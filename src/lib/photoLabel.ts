/**
 * 파일명에서 공간 유형을 추정한다.
 *
 * 실제 시스템은 이 자리에서 LLM 비전으로 이미지를 분류한다.
 * 목업에는 모델이 없으므로 파일명만 본다. 못 알아보면 미분류로 두고
 * 사람이 직접 고르게 한다 — 실제 시스템에서도 사람이 뒤집을 수 있어야 한다.
 */

export const UNCLASSIFIED = "미분류";

const KEYWORDS: Array<[string, string[]]> = [
  ["수영장 야간", ["poolnight", "pool-night", "pool_night", "수영장야간", "야간수영"]],
  ["야간 전경", ["night", "야간", "야경", "nightview"]],
  ["수영장", ["pool", "수영장", "swim"]],
  ["욕실", ["bath", "욕실", "화장실", "shower", "toilet", "restroom"]],
  ["객실", ["room", "bed", "객실", "침실", "guestroom"]],
  ["외관", ["exterior", "facade", "외관", "front", "outside", "building"]],
  ["로비 · 공용 라운지", ["lobby", "lounge", "로비", "라운지"]],
  ["조식장", ["breakfast", "조식", "dining", "다이닝", "restaurant"]],
  ["바비큐존", ["bbq", "barbecue", "grill", "바비큐", "그릴"]],
  ["스파 · 사우나", ["spa", "sauna", "스파", "사우나", "찜질"]],
  ["반려동물 전용 공간", ["pet", "dog", "반려", "애견"]],
  ["정원 · 테라스", ["garden", "terrace", "patio", "정원", "테라스", "야외"]],
];

export function guessLabel(fileName: string, labels: string[]): string {
  const name = fileName.toLowerCase();
  // 체크리스트 항목 이름이 파일명에 그대로 들어 있으면 그것부터
  const direct = labels.find((l) => name.includes(l.toLowerCase()));
  if (direct) return direct;

  for (const [label, words] of KEYWORDS) {
    if (!labels.includes(label)) continue;
    if (words.some((w) => name.includes(w))) return label;
  }
  return UNCLASSIFIED;
}

/** 라벨별 장수 집계 */
export function countByLabel(items: Array<{ label: string }>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) map[item.label] = (map[item.label] ?? 0) + 1;
  return map;
}
