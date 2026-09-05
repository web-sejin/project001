import { intBetween, makeRng } from "@/lib/rand";
import type { Content, ShotItem } from "./types";

/** AI를 쓰는 층위. 화면 곳곳의 ⓘ 툴팁이 이 정의를 참조한다. */
export type Tier = "연산" | "전용 모델" | "LLM 비전" | "LLM" | "AI 아님";

export const TIER_LABEL: Record<Tier, string> = {
  연산: "순수 연산",
  "전용 모델": "전용 모델",
  "LLM 비전": "LLM 비전",
  LLM: "LLM",
  "AI 아님": "AI 아님 (규칙)",
};

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
  previewDone: boolean;
  rawPending: boolean;
  recommended: number;
  select: SelectRow[];
  timings: { label: string; value: string }[];
  missing: MissingItem[];
  /** 이 숙소 건에서만 사람이 제외한 필수 컷 (예외 처리) */
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
    previewDone: boolean;
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
    previewDone: true,
    rawPending: false,
    excludedShotLabels: ["스파 · 사우나"],
    coRetoucher: "유가온",
  },
  "c-03": {
    total: 800,
    uploaded: 247,
    previewDone: true,
    rawPending: true,
    missingLabels: [
      {
        label: "바비큐존",
        confidence: "high",
        reason: "체크리스트 필수 항목인데 라벨링 결과에 해당 공간이 한 장도 없습니다",
      },
      {
        label: "수영장 야간",
        confidence: "low",
        reason:
          "야간 컷 3장이 검출됐지만 촬영 위치가 수영장인지 불확실합니다. 사람 확인이 필요합니다",
      },
    ],
  },
  "c-07": {
    total: 763,
    uploaded: 763,
    previewDone: true,
    rawPending: false,
    dismissedMissing: ["스파 · 사우나"],
  },
  "c-13": {
    total: 694,
    uploaded: 694,
    previewDone: true,
    rawPending: false,
    missingLabels: [
      {
        label: "욕실",
        confidence: "high",
        reason:
          "욕실로 분류된 컷이 한 장도 없습니다. 재촬영 2회가 여기서 발생했습니다",
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
    if (notShot) shotCounts[item.label] = 0;
    else if (missingSet.has(item.label)) shotCounts[item.label] = 0;
    else shotCounts[item.label] = item.minCount + intBetween(rng, 0, 9);
  }

  const total = notShot ? 0 : (ov.total ?? intBetween(rng, 620, 880));
  const uploaded = notShot ? 0 : (ov.uploaded ?? total);

  // 처리 순서 = 비용 설계.
  // 1층(연산)으로 먼저 걸러내고, 2층(임베딩)으로 중복을 지우고,
  // 남은 것만 3층(LLM 비전)에 넘긴다.
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
        "라플라시안 분산으로 엣지 선명도를 측정합니다. 학습 모델이 아니라 수식이라 800장을 수 초에 처리합니다.",
    },
    {
      reason: "노출 오류",
      count: exposure,
      tier: "연산",
      method:
        "히스토그램 분석. 화이트·블랙 클리핑 비율이 임계치를 넘는 컷을 제외합니다.",
    },
    {
      reason: "중복 · 유사 컷",
      count: dup,
      tier: "전용 모델",
      method:
        "CLIP 계열 임베딩 벡터의 코사인 유사도. LLM보다 훨씬 싸고 빠르며 로컬 실행도 가능합니다.",
    },
    {
      reason: "대표 컷 추천",
      count: recommended,
      tier: "LLM 비전",
      method:
        "남은 컷만 공간 라벨링한 뒤 라벨별 상위를 선별합니다. 중복 그룹은 대표 1장만 라벨링하고 나머지에 상속시킵니다.",
    },
  ];

  const timings = notShot
    ? []
    : [
        { label: "결함 필터", value: "3초" },
        { label: "중복 제거", value: "41초" },
        { label: "라벨링", value: "2분 18초" },
      ];

  const missing: MissingItem[] = missingLabels.map((m) => {
    const item = shotList.find((s) => s.label === m.label);
    return {
      label: m.label,
      found: shotCounts[m.label] ?? 0,
      required: item?.minCount ?? 0,
      confidence: m.confidence,
      reason: m.reason,
    };
  });

  return {
    contentId: content.id,
    shotList,
    shotCounts,
    total,
    uploaded,
    previewDone: ov.previewDone ?? !notShot,
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

/** 필수 컷 충족 진행률 (예: 6/8) */
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
