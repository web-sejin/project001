/**
 * 원본 ↔ 보정본 짝짓기.
 *
 * 리터처는 라이트룸에서 보정한 뒤 내보내는데, 라이트룸은 기본적으로
 * 원본 파일명을 그대로 유지한다. 그래서 확장자를 뗀 이름으로 맞춰 보면 된다.
 * 문자열 비교라 AI가 아니다.
 *
 * 이름을 바꿔서 내보내는 경우가 있어 흔한 접미사는 떼어내고 비교한다.
 * 그래도 못 찾으면 사람이 직접 고르게 한다. 자동으로 아무 데나 붙이면
 * 엉뚱한 사진을 승인하게 된다.
 */

const SUFFIX = /[-_ ]?(final|edit|edited|retouch|retouched|보정|최종|v\d+|\d+)$/i;

export function stripExt(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
}

export function baseName(fileName: string): string {
  return stripExt(fileName).replace(SUFFIX, "").trim();
}

export type MatchHow =
  | "파일명 완전 일치"
  | "접미사 제외 후 일치"
  | "앞부분 일치"
  | "직접 지정";

export interface MatchCandidate {
  id: string;
  /** 원본 파일명 */
  name: string;
}

export interface MatchResult {
  id: string;
  how: MatchHow;
}

export function matchOriginal(
  fileName: string,
  candidates: MatchCandidate[],
  taken: Set<string>,
): MatchResult | null {
  const full = stripExt(fileName);
  const base = baseName(fileName);
  if (!base) return null;

  const free = candidates.filter((c) => !taken.has(c.id));

  // 1) 확장자만 다르고 이름이 같은 것
  const exact = free.find((c) => stripExt(c.name) === full);
  if (exact) return { id: exact.id, how: "파일명 완전 일치" };

  // 2) final, v2 같은 접미사를 떼면 같은 것
  const stripped = free.find((c) => baseName(c.name) === base);
  if (stripped) return { id: stripped.id, how: "접미사 제외 후 일치" };

  // 3) 한쪽이 다른 쪽으로 시작하는 것
  const prefix = free.find((c) => {
    const b = baseName(c.name);
    return b.startsWith(base) || base.startsWith(b);
  });
  return prefix ? { id: prefix.id, how: "앞부분 일치" } : null;
}
