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

export function baseName(fileName: string): string {
  const noExt = fileName.replace(/\.[^.]+$/, "");
  return noExt.replace(SUFFIX, "").trim().toLowerCase();
}

export interface MatchCandidate {
  id: string;
  /** 원본 파일명 */
  name: string;
}

export function matchOriginal(
  fileName: string,
  candidates: MatchCandidate[],
  taken: Set<string>,
): string | null {
  const base = baseName(fileName);
  if (!base) return null;

  const free = candidates.filter((c) => !taken.has(c.id));

  // 1) 이름이 정확히 같은 것
  const exact = free.find((c) => baseName(c.name) === base);
  if (exact) return exact.id;

  // 2) 한쪽이 다른 쪽으로 시작하는 것 (DSC0417 ↔ DSC0417_a)
  const prefix = free.find((c) => {
    const b = baseName(c.name);
    return b.startsWith(base) || base.startsWith(b);
  });
  return prefix?.id ?? null;
}
