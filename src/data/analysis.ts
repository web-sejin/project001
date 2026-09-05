import { intBetween, makeRng } from "@/lib/rand";
import type { Tier } from "./ax";
import type { Content, ShotItem } from "./types";

export interface MissingItem {
  label: string;
  found: number;
  required: number;
  confidence: "high" | "low";
  reason: string;
}

export interface SelectRow {
  reason: string;
  count: number;
  tier: Tier;
  method: string;
}

export interface ContentAnalysis {
  contentId: string;
  shotList: ShotItem[];
  /** 라벨별 촬영된 장수 */
  shotCounts: Record<string, number>;
  total: number;
  uploaded: number;
  rawPending: boolean;
  recommended: number;
  select: SelectRow[];
  timings: { label: string; value: string }[];
  missing: MissingItem[];
  /** 이 건에서만 사람이 제외한 필수 컷 */
  excludedShotLabels: string[];
  /** AI 누락 경고를 사람이 뒤집은 항목 */
  dismissedMissing: string[];
  coRetoucher: string | null;
}

/** 콘텐츠별 시나리오 예외. 나머지는 시드로 자동 생성된다. */
const OVERRIDES: Record<
  string,
  Partial<{
    uploaded: number;
    total: number;
    rawPending: boolean;
    missingLabels: Array<{ label: string; confidence: "high" | "low"; reason: string }>;
    excludedShotLabels: string[];
    dismissedMissing: string[];
    coRetoucher: string;
  }>
> = {
  "c-01": {
    total: 812,
    uploaded: 812,
    excludedShotLabels: ["스파 · 사우나"],
    coRetoucher: "유가온",
  },
  "c-03": {
    total: 800,
    uploaded: 247,
    rawPending: true,
    missingLabels: [
      {
        label: "바비큐존",
        confidence: "high",
        reason: "체크리스트 필수 항목인데 해당 공간으로 분류된 컷이 한 장도 없습니다",
      },
      {
        label: "수영장 야간",
        confidence: "low",
        reason: "야간 컷 3장이 있으나 촬영 위치가 수영장인지 불확실합니다. 확인이 필요합니다",
      },
    ],
  },
  "c-07": {
    total: 763,
    uploaded: 763,
    dismissedMissing: ["스파 · 사우나"],
  },
  "c-13": {
    total: 694,
    uploaded: 694,
    missingLabels: [
      {
        label: "욕실",
        confidence: "high",
        reason: "욕실로 분류된 컷이 한 장도 없습니다. 재촬영 2회가 여기서 발생했습니다",
      },
    ],
  },
};

export function buildAnalysis(
  content: Content,
  shotList: ShotItem[],
): ContentAnalysis {
  const ov = OVERRIDES[content.id] ?? {};
  const rng = makeRng(`${content.id}-analysis`);

  const missingLabels = (ov.missingLabels ?? []).filter((m) =>
    shotList.some((s) => s.label === m.label),
  );
  const missingSet = new Set(missingLabels.map((m) => m.label));
  const notShot = content.status === "촬영예정";

  const shotCounts: Record<string, number> = {};
  for (const item of shotList) {
    if (notShot || missingSet.has(item.label)) shotCounts[item.label] = 0;
    else shotCounts[item.label] = item.minCount + intBetween(rng, 0, 9);
  }

  const total = notShot ? 0 : (ov.total ?? intBetween(rng, 620, 880));
  const uploaded = notShot ? 0 : (ov.uploaded ?? total);

  // 처리 순서 = 비용 설계.
  // 싼 연산으로 먼저 걸러 LLM에 도달하는 장수를 줄인다.
  const blur = notShot ? 0 : Math.round(total * (0.035 + rng() * 0.02));
  const exposure = notShot ? 0 : Math.round(total * (0.008 + rng() * 0.006));
  const afterTier1 = total - blur - exposure;
  const dup = notShot ? 0 : Math.round(afterTier1 * (0.5 + rng() * 0.06));
  const afterTier2 = afterTier1 - dup;
  const recommended = notShot ? 0 : Math.round(afterTier2 * (0.22 + rng() * 0.05));

  const select: SelectRow[] = [
    {
      reason: "흔들림",
      count: blur,
      tier: "연산",
      method:
        "사진의 경계선이 얼마나 또렷한지 계산합니다. 흔들린 사진은 경계가 뭉개져 값이 낮게 나옵니다. AI가 아니라 계산식이라 800장을 몇 초에 끝냅니다. OpenCV 같은 이미지 처리 라이브러리를 씁니다.",
    },
    {
      reason: "노출 오류",
      count: exposure,
      tier: "연산",
      method:
        "너무 밝아 하얗게 날아갔거나 너무 어두워 까맣게 뭉갠 부분이 얼마나 되는지 셉니다. 기준을 넘으면 제외합니다. 같은 이미지 처리 라이브러리를 씁니다.",
    },
    {
      reason: "중복 · 유사 컷",
      count: dup,
      tier: "전용 모델",
      method:
        "사진마다 지문 같은 값을 만들어 서로 얼마나 닮았는지 견줍니다. 큰 AI를 부르는 것보다 훨씬 싸고 빠르며 우리 서버에서 돌릴 수 있습니다. imagehash나 CLIP 같은 라이브러리를 씁니다.",
    },
    {
      reason: "대표 컷 추천",
      count: recommended,
      tier: "LLM 비전",
      method:
        "여기까지 살아남은 컷만 큰 AI에 보내 공간 이름을 붙이고, 공간별로 좋은 컷을 고릅니다. 비슷한 사진 묶음은 대표 한 장만 보내고 나머지는 같은 이름을 물려받습니다. Claude·GPT·Gemini 중 아무거나 붙일 수 있습니다.",
    },
  ];

  const timings = notShot
    ? []
    : [
        { label: "결함 필터", value: "3초" },
        { label: "중복 제거", value: "41초" },
        { label: "라벨링", value: "2분 18초" },
      ];

  const missing: MissingItem[] = missingLabels.map((m) => ({
    label: m.label,
    found: shotCounts[m.label] ?? 0,
    required: shotList.find((s) => s.label === m.label)?.minCount ?? 0,
    confidence: m.confidence,
    reason: m.reason,
  }));

  return {
    contentId: content.id,
    shotList,
    shotCounts,
    total,
    uploaded,
    rawPending: ov.rawPending ?? false,
    recommended,
    select,
    timings,
    missing,
    excludedShotLabels: (ov.excludedShotLabels ?? []).filter((l) =>
      shotList.some((s) => s.label === l),
    ),
    dismissedMissing: ov.dismissedMissing ?? [],
    coRetoucher: ov.coRetoucher ?? null,
  };
}

/** 필수 컷 충족 진행률 */
export function shotProgress(a: ContentAnalysis) {
  const active = a.shotList.filter(
    (s) => s.isRequired && !a.excludedShotLabels.includes(s.label),
  );
  const met = active.filter((s) => (a.shotCounts[s.label] ?? 0) >= s.minCount);
  return { met: met.length, total: active.length };
}

/** 사람이 아직 처리하지 않은 누락 경고 */
export function openMissing(a: ContentAnalysis): MissingItem[] {
  return a.missing.filter((m) => !a.dismissedMissing.includes(m.label));
}
