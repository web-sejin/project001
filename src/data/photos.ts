import { intBetween, makeRng, pick } from "@/lib/rand";
import type { ContentAnalysis } from "./analysis";
import type {
  Content,
  ExcludeReason,
  Photo,
  RejectRecord,
  ReviewFlag,
} from "./types";

/**
 * 목업에서 렌더링할 사진 수.
 * 실제 대상은 800장이지만 화면에 800개 DOM을 그릴 이유가 없다.
 * 추천 컷 일부와 제외 컷 샘플만 만들고, 전체 숫자는 집계값으로 보여준다.
 */
export const RENDER_RECOMMENDED = 48;
export const RENDER_EXCLUDED = 24;

const REVIEW_FLAGS: ReviewFlag[] = [
  "수평 틀어짐",
  "노출 편차",
  "색온도 편차",
  "눈감음",
];

const REJECT_REASONS = [
  "수평이 1.5도 정도 틀어졌습니다. 재보정 부탁드려요",
  "다른 컷 대비 색온도가 차갑습니다. 5800K 기준으로 맞춰주세요",
  "창밖 하이라이트가 날아갔습니다. 하이라이트 복구 부탁드립니다",
  "침구 주름이 그대로 남아 있어 리터칭이 필요합니다",
  "바닥 반사광이 과해서 톤이 튑니다",
];

const cache = new Map<string, Photo[]>();

function cacheKey(content: Content, analysis: ContentAnalysis) {
  return [
    content.id,
    content.status,
    content.retoucher ?? "-",
    analysis.shotList.length,
  ].join("|");
}

function labelPool(analysis: ContentAnalysis): string[] {
  const pool: string[] = [];
  for (const item of analysis.shotList) {
    const n = analysis.shotCounts[item.label] ?? 0;
    if (n === 0) continue;
    // 촬영 장수에 비례해 라벨 분포를 만든다
    for (let i = 0; i < Math.max(1, Math.round(n / 2)); i++) pool.push(item.label);
  }
  return pool;
}

export function buildPhotos(
  content: Content,
  analysis: ContentAnalysis,
): Photo[] {
  const key = cacheKey(content, analysis);
  const hit = cache.get(key);
  if (hit) return hit;

  if (content.status === "촬영예정") {
    cache.set(key, []);
    return [];
  }

  const rng = makeRng(`${content.id}-photos`);
  const pool = labelPool(analysis);
  if (pool.length === 0) {
    cache.set(key, []);
    return [];
  }

  const retouchers = [content.retoucher, analysis.coRetoucher].filter(
    (r): r is string => Boolean(r),
  );

  const photos: Photo[] = [];

  for (let i = 0; i < RENDER_RECOMMENDED + RENDER_EXCLUDED; i++) {
    const selected = i < RENDER_RECOMMENDED;
    const label = pool[Math.floor(rng() * pool.length)];

    // 확신도는 흩어져야 한다. 전부 0.95면 AI를 안 써본 티가 난다.
    const roll = rng();
    const confidence =
      roll < 0.14
        ? 0.6 + rng() * 0.19 // 확인 필요 구간
        : roll < 0.45
          ? 0.8 + rng() * 0.11
          : 0.91 + rng() * 0.08;

    let excludeReason: ExcludeReason = null;
    if (!selected) {
      const r = rng();
      excludeReason = r < 0.62 ? "중복" : r < 0.92 ? "흔들림" : "노출 오류";
    }

    // 검수 플래그는 보정 결과가 올라온 뒤에만 붙는다
    const inReview = ["보정중", "검수", "발행"].includes(content.status);
    const reviewFlags: ReviewFlag[] = [];
    if (selected && inReview && rng() < 0.17) reviewFlags.push(pick(rng, REVIEW_FLAGS));

    const retoucher = retouchers.length ? pick(rng, retouchers) : null;

    // 리터처가 둘이면 톤이 갈린다. 이 편차를 화면에서 보여주는 게 목적.
    const base =
      retoucher && retouchers.length > 1 && retoucher === retouchers[1] ? 6180 : 5720;
    const colorTempK = Math.round(base + (rng() - 0.5) * 380);
    const brightness = Math.round((0.44 + (rng() - 0.5) * 0.22) * 100) / 100;

    let approvalStatus: Photo["approvalStatus"] = "대기";
    const rejectHistory: RejectRecord[] = [];
    if (selected) {
      if (content.status === "발행") approvalStatus = "승인";
      else if (content.status === "검수") {
        const r = rng();
        approvalStatus = r < 0.62 ? "승인" : r < 0.78 ? "반려" : "대기";
      } else if (content.status === "보정중") {
        const r = rng();
        approvalStatus = r < 0.46 ? "승인" : r < 0.64 ? "반려" : "대기";
      }
      if (approvalStatus === "반려") {
        const rounds = rng() < 0.25 ? 2 : 1;
        for (let k = 1; k <= rounds; k++) {
          rejectHistory.push({
            round: k,
            at: k === 1 ? "2026-08-29" : "2026-09-02",
            by: "정하늘",
            reason: REJECT_REASONS[intBetween(rng, 0, REJECT_REASONS.length - 1)],
          });
        }
      }
    }

    const seq = String(i + 1).padStart(4, "0");
    photos.push({
      id: `${content.id}-p${seq}`,
      contentId: content.id,
      thumbUrl: `/photos/${content.id}/thumb/${seq}.jpg`,
      rawPath: `${content.id}/DSC${seq}.ARW`,
      aiLabel: label,
      confidence: Math.round(confidence * 100) / 100,
      selected,
      excludeReason,
      reviewFlags,
      approvalStatus,
      rejectHistory,
      colorTempK,
      brightness,
      retoucher,
    });
  }

  cache.set(key, photos);
  return photos;
}

export function flagCounts(photos: Photo[]): Array<{ flag: ReviewFlag; count: number }> {
  const map = new Map<ReviewFlag, number>();
  for (const p of photos) {
    if (!p.selected) continue;
    for (const f of p.reviewFlags) map.set(f, (map.get(f) ?? 0) + 1);
  }
  return REVIEW_FLAGS.filter((f) => map.has(f)).map((f) => ({
    flag: f,
    count: map.get(f) ?? 0,
  }));
}
