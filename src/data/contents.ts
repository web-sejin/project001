import type { ChannelProfile, Content } from "./types";

/**
 * 목업 기준일. 실제 시스템이라면 서버 시각을 쓴다.
 * 여기서는 화면이 항상 같은 상태로 보이도록 고정한다.
 */
export const TODAY = "2026-09-05";

/** 정체 일수 기준 */
export const STUCK_WARN_DAYS = 3;
export const STUCK_DANGER_DAYS = 7;

export const CONTENTS: Content[] = [
  {
    id: "c-01",
    accommodationId: "acc-01",
    shootDate: "2026-08-19",
    photographer: "박현우",
    retoucher: "김서연",
    status: "보정중",
    statusChangedAt: "2026-08-24",
    stuckDays: 12,
    reshootCount: 1,
    fieldMode: false,
  },
  {
    id: "c-02",
    accommodationId: "acc-02",
    shootDate: "2026-08-28",
    photographer: "이도현",
    retoucher: "한지우",
    status: "검수",
    statusChangedAt: "2026-09-02",
    stuckDays: 3,
    reshootCount: 0,
    fieldMode: true,
  },
  {
    id: "c-03",
    accommodationId: "acc-03",
    shootDate: "2026-09-04",
    photographer: "정민석",
    retoucher: null,
    status: "촬영완료",
    statusChangedAt: "2026-09-04",
    stuckDays: 1,
    reshootCount: 0,
    fieldMode: true,
  },
  {
    id: "c-04",
    accommodationId: "acc-04",
    shootDate: "2026-08-11",
    photographer: "박현우",
    retoucher: "유가온",
    status: "발행",
    statusChangedAt: "2026-08-27",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-05",
    accommodationId: "acc-05",
    shootDate: "2026-09-10",
    photographer: "이도현",
    retoucher: null,
    status: "촬영예정",
    statusChangedAt: "2026-08-30",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-06",
    accommodationId: "acc-06",
    shootDate: "2026-08-25",
    photographer: "최유진",
    retoucher: "김서연",
    status: "보정중",
    statusChangedAt: "2026-08-28",
    stuckDays: 8,
    reshootCount: 1,
    fieldMode: false,
  },
  {
    id: "c-07",
    accommodationId: "acc-07",
    shootDate: "2026-09-03",
    photographer: "정민석",
    retoucher: null,
    status: "촬영완료",
    statusChangedAt: "2026-09-03",
    stuckDays: 2,
    reshootCount: 0,
    fieldMode: true,
  },
  {
    id: "c-08",
    accommodationId: "acc-08",
    shootDate: "2026-09-08",
    photographer: "박현우",
    retoucher: null,
    status: "촬영예정",
    statusChangedAt: "2026-08-29",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-09",
    accommodationId: "acc-09",
    shootDate: "2026-08-30",
    photographer: "최유진",
    retoucher: "한지우",
    status: "검수",
    statusChangedAt: "2026-09-04",
    stuckDays: 1,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-10",
    accommodationId: "acc-10",
    shootDate: "2026-08-26",
    photographer: "이도현",
    retoucher: "유가온",
    status: "보정중",
    statusChangedAt: "2026-09-01",
    stuckDays: 4,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-11",
    accommodationId: "acc-11",
    shootDate: "2026-08-06",
    photographer: "최유진",
    retoucher: "김서연",
    status: "발행",
    statusChangedAt: "2026-08-21",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-12",
    accommodationId: "acc-12",
    shootDate: "2026-09-14",
    photographer: "정민석",
    retoucher: null,
    status: "촬영예정",
    statusChangedAt: "2026-09-01",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
  {
    id: "c-13",
    accommodationId: "acc-13",
    shootDate: "2026-08-27",
    photographer: "박현우",
    retoucher: null,
    status: "촬영완료",
    statusChangedAt: "2026-08-27",
    stuckDays: 9,
    reshootCount: 2,
    fieldMode: false,
  },
  {
    id: "c-14",
    accommodationId: "acc-14",
    shootDate: "2026-09-01",
    photographer: "이도현",
    retoucher: "한지우",
    status: "보정중",
    statusChangedAt: "2026-09-03",
    stuckDays: 2,
    reshootCount: 0,
    fieldMode: true,
  },
  {
    id: "c-15",
    accommodationId: "acc-05",
    shootDate: "2026-09-11",
    photographer: "최유진",
    retoucher: null,
    status: "촬영예정",
    statusChangedAt: "2026-09-02",
    stuckDays: 0,
    reshootCount: 0,
    fieldMode: false,
  },
];

/**
 * 단계별 평균 소요일. 실제로는 statusChangedAt 로그를 집계해서 나온다.
 * 보정 구간이 병목이라는 진단의 근거 숫자.
 */
export const STAGE_DURATIONS = [
  { stage: "촬영", days: 1.2 },
  { stage: "보정", days: 4.2 },
  { stage: "검수", days: 1.8 },
  { stage: "발행", days: 0.5 },
];

/**
 * 채널 프로필.
 * publishMode / apiNote 는 각 채널의 실제 API 정책을 조사한 결과다.
 */
export const CHANNELS: ChannelProfile[] = [
  {
    id: "ch-own",
    name: "자사몰",
    ratio: "4:3",
    maxPhotos: 20,
    tone: "상세 설명형",
    publishMode: "자동 발행",
    apiNote: "내부 API. 시스템이 직접 등록한다.",
  },
  {
    id: "ch-naver",
    name: "네이버 블로그",
    ratio: "1:1",
    maxPhotos: 10,
    tone: "검색 키워드 중심",
    publishMode: "수동 발행",
    apiNote:
      "글쓰기 API가 2020년 5월 종료됐다 (광고성 대량 발행 문제). 자동 발행 경로가 없어 패키지를 내려받아 사람이 올린다.",
  },
  {
    id: "ch-ota",
    name: "야놀자 · 여기어때",
    ratio: "16:9",
    maxPhotos: 15,
    tone: "프로모션 강조",
    publishMode: "수동 발행",
    apiNote:
      "공개 API가 없다. 파트너 연동 계약 또는 채널 매니저 경유가 필요해 협의 전까지는 수동 발행.",
  },
  {
    id: "ch-insta",
    name: "인스타그램",
    ratio: "4:5",
    maxPhotos: 10,
    tone: "감성 짧은 문구",
    publishMode: "심사 필요",
    apiNote:
      "Graph API로 가능하지만 비즈니스/크리에이터 계정 + 페이스북 페이지 연결 + Meta 앱 심사가 선행돼야 한다. 24시간당 100건 제한.",
  },
];

/** 두 날짜 사이 일수. 목업 데이터가 문자열 날짜라 여기서만 Date를 쓴다. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

/** 촬영 작가 풀. 실제로는 인력 테이블에서 온다. */
export const PHOTOGRAPHERS = ["박현우", "이도현", "정민석", "최유진"];

/** 리터처 풀 */
export const RETOUCHERS = ["김서연", "한지우", "유가온"];
