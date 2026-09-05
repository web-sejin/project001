/**
 * 이미지 품질 측정.
 *
 * 3층 파이프라인의 1층(순수 연산)은 학습 모델이 필요 없다.
 * 그래서 목업에서도 흉내가 아니라 진짜로 돌린다 — 브라우저 캔버스면 충분하다.
 *
 *   흔들림   라플라시안 분산 (엣지 선명도)
 *   노출     히스토그램 클리핑 비율
 *   중복     지각 해시(dHash)의 해밍 거리
 *
 * 실제 시스템에서는 중복 판정에 CLIP 계열 임베딩을 쓰는 편이 정확하지만,
 * 원리는 같다. 어느 쪽이든 LLM을 부르지 않는다.
 */

export interface ImageMetrics {
  /** 라플라시안 분산. 값이 낮을수록 흐리다 */
  sharpness: number;
  /** 하이라이트 날아간 픽셀 비율 0~1 */
  clipHigh: number;
  /** 암부 뭉갠 픽셀 비율 0~1 */
  clipLow: number;
  /** 지각 해시 64비트를 0/1 문자열로 */
  hash: string;
}

const WORK_SIZE = 192;

function toCanvas(img: HTMLImageElement, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2d context를 만들 수 없습니다");
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function grayscale(data: ImageData): Float32Array {
  const gray = new Float32Array(data.width * data.height);
  for (let i = 0, p = 0; i < data.data.length; i += 4, p++) {
    // ITU-R BT.601 휘도
    gray[p] =
      0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
  }
  return gray;
}

/** 라플라시안 커널을 돌려 분산을 구한다. 초점이 맞으면 엣지가 강해 분산이 크다 */
function laplacianVariance(gray: Float32Array, w: number, h: number): number {
  const values: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      values.push(
        4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w],
      );
    }
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}

/** 가로 인접 픽셀 밝기 비교로 64비트 지문을 만든다 */
function dHash(img: HTMLImageElement): string {
  const data = toCanvas(img, 9, 8);
  const gray = grayscale(data);
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += gray[y * 9 + x] > gray[y * 9 + x + 1] ? "1" : "0";
    }
  }
  return bits;
}

/** 두 지문에서 다른 비트 수 */
export function hammingDistance(a: string, b: string): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
  return count;
}

export async function measureImage(url: string): Promise<ImageMetrics> {
  const img = new Image();
  img.src = url;
  await img.decode();

  const ratio = img.naturalWidth / img.naturalHeight || 1;
  const w = ratio >= 1 ? WORK_SIZE : Math.max(8, Math.round(WORK_SIZE * ratio));
  const h = ratio >= 1 ? Math.max(8, Math.round(WORK_SIZE / ratio)) : WORK_SIZE;

  const data = toCanvas(img, w, h);
  const gray = grayscale(data);

  let high = 0;
  let low = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] >= 250) high++;
    else if (gray[i] <= 5) low++;
  }

  return {
    sharpness: laplacianVariance(gray, w, h),
    clipHigh: high / gray.length,
    clipLow: low / gray.length,
    hash: dHash(img),
  };
}

export type SelectReason = "흔들림" | "노출 오류" | "중복" | null;

export interface SelectVerdict {
  reason: SelectReason;
  /** 중복 그룹의 대표 사진 id */
  duplicateOf?: string;
}

/**
 * 측정값 → 제외 판정.
 *
 * 흔들림 기준은 절대값으로 못 잡는다. 피사체와 렌즈에 따라 편차가 커서
 * 같은 촬영 건 안에서의 상대 비교가 훨씬 안정적이다.
 */
export function judgeSelection(
  items: Array<{ id: string; metrics: ImageMetrics }>,
): Record<string, SelectVerdict> {
  const verdicts: Record<string, SelectVerdict> = {};
  if (items.length === 0) return verdicts;

  const sharps = items.map((i) => i.metrics.sharpness).sort((a, b) => a - b);
  const median = sharps[Math.floor(sharps.length / 2)];
  const blurThreshold = Math.max(12, median * 0.35);

  for (const item of items) {
    const m = item.metrics;
    if (m.sharpness < blurThreshold) {
      verdicts[item.id] = { reason: "흔들림" };
    } else if (m.clipHigh > 0.15 || m.clipLow > 0.5) {
      verdicts[item.id] = { reason: "노출 오류" };
    } else {
      verdicts[item.id] = { reason: null };
    }
  }

  // 살아남은 것끼리 중복 판정. 그룹에서 가장 선명한 컷만 남긴다.
  const survivors = items.filter((i) => verdicts[i.id].reason === null);
  const used = new Set<string>();
  for (let i = 0; i < survivors.length; i++) {
    const a = survivors[i];
    if (used.has(a.id)) continue;
    const group = [a];
    for (let j = i + 1; j < survivors.length; j++) {
      const b = survivors[j];
      if (used.has(b.id)) continue;
      if (hammingDistance(a.metrics.hash, b.metrics.hash) <= 8) {
        group.push(b);
        used.add(b.id);
      }
    }
    if (group.length === 1) continue;
    const best = group.reduce((x, y) =>
      y.metrics.sharpness > x.metrics.sharpness ? y : x,
    );
    for (const g of group) {
      if (g.id !== best.id) verdicts[g.id] = { reason: "중복", duplicateOf: best.id };
    }
  }

  return verdicts;
}
