/**
 * 목업이지만 실제 DB 스키마와 형태를 맞춘다.
 * 나중에 백엔드를 붙이면 이 타입이 그대로 API 응답 타입이 된다.
 */

/* ------------------------------------------------------------------ *
 * 업무 흐름
 *
 * 과제가 정의한 4단계를 그대로 화면 골격으로 쓴다.
 *   촬영 일정 관리 → 촬영 사진 업로드 → 사진 보정 및 검수 → 채널별 업로드
 * 운영 상태는 5개지만, 3단계 안에서 보정중/검수로 나뉠 뿐이다.
 * ------------------------------------------------------------------ */

export type ContentStatus =
  | "촬영예정"
  | "촬영완료"
  | "보정중"
  | "검수"
  | "발행";

export type StageKey = "촬영" | "업로드" | "보정검수" | "발행";

export interface Stage {
  key: StageKey;
  /** 과제 원문의 단계 이름 */
  label: string;
  step: number;
  statuses: ContentStatus[];
  hint: string;
}

export const STAGES: Stage[] = [
  {
    key: "촬영",
    label: "촬영 일정 관리",
    step: 1,
    statuses: ["촬영예정"],
    hint: "일정 확정 · 필수 컷 목록 생성",
  },
  {
    key: "업로드",
    label: "촬영 사진 업로드",
    step: 2,
    statuses: ["촬영완료"],
    hint: "업로드 · 분류 · 셀렉",
  },
  {
    key: "보정검수",
    label: "사진 보정 및 검수",
    step: 3,
    statuses: ["보정중", "검수"],
    hint: "리터처 작업 · 승인 · 반려",
  },
  {
    key: "발행",
    label: "채널별 콘텐츠 업로드",
    step: 4,
    statuses: ["발행"],
    hint: "채널별 게시 · 링크 기록",
  },
];

export function stageOf(status: ContentStatus): Stage {
  return STAGES.find((s) => s.statuses.includes(status)) ?? STAGES[0];
}

/* ------------------------------------------------------------------ *
 * 숙소와 촬영 필수 컷
 * ------------------------------------------------------------------ */

export type AccommodationType =
  | "풀빌라"
  | "독채"
  | "호텔"
  | "펜션"
  | "글램핑"
  | "한옥"
  | "리조트";

export interface ShotRule {
  /** 컷 이름. 사진만 보고 판정 가능한 공간 유형이어야 한다 */
  label: string;
  minCount: number;
  /** 권장 컷. 없어도 촬영 완료로 본다 */
  optional?: boolean;
}

export type FacilityScope = "공통" | "객실" | "선택";

export interface FacilityDef {
  id: string;
  label: string;
  scope: FacilityScope;
  rules: ShotRule[];
  description: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  address: string;
  region: string;
  /** 객실 수. 객실 규칙의 장수에 이 값을 곱한다 */
  roomCount: number;
  facilityIds: string[];
}

export interface ShotItem {
  id: string;
  label: string;
  minCount: number;
  isRequired: boolean;
  facilityId: string;
  /** 어느 시설에서 나왔는지 (자동 생성 근거 표시용) */
  derivedFrom: string;
}

/* ------------------------------------------------------------------ *
 * 촬영 건
 * ------------------------------------------------------------------ */

export interface Content {
  id: string;
  accommodationId: string;
  shootDate: string;
  photographer: string;
  retoucher: string | null;
  status: ContentStatus;
  statusChangedAt: string;
  stuckDays: number;
  reshootCount: number;
}

export type ApprovalStatus = "승인" | "반려" | "대기";

export interface RejectRecord {
  round: number;
  at: string;
  by: string;
  reason: string;
}

export type ReviewFlag = "수평 틀어짐" | "노출 편차" | "색온도 편차" | "눈감음";

export type ExcludeReason = "흔들림" | "중복" | "노출 오류" | null;

export interface Photo {
  id: string;
  contentId: string;
  thumbUrl: string;
  rawPath: string;
  aiLabel: string;
  confidence: number;
  selected: boolean;
  excludeReason: ExcludeReason;
  reviewFlags: ReviewFlag[];
  approvalStatus: ApprovalStatus;
  rejectHistory: RejectRecord[];
  colorTempK: number;
  brightness: number;
  retoucher: string | null;
}

/* ------------------------------------------------------------------ *
 * 채널 발행
 *
 * 발행 단계가 하는 일은 자동 등록이 아니라
 * "어느 채널에 올렸고 링크가 무엇인지"를 기록하고 관리하는 것이다.
 * ------------------------------------------------------------------ */

export interface ChannelProfile {
  id: string;
  name: string;
  ratio: string;
  maxPhotos: number;
  tone: string;
}

export type PublishStatus = "미발행" | "발행완료";

export interface Publication {
  contentId: string;
  channelId: string;
  status: PublishStatus;
  url: string;
  publishedAt: string | null;
  publishedBy: string | null;
}
