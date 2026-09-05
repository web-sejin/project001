import type {
  AlertSettings,
  ChannelProfile,
  Content,
  Publication,
} from "./types";

/** 목업 기준일. 화면이 항상 같은 상태로 보이도록 고정한다. */
export const TODAY = "2026-09-05";

/** 정체 기준일 (설정 기본값) */
export const STUCK_WARN_DAYS = 3;
export const STUCK_DANGER_DAYS = 7;

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  stuckWarnDays: STUCK_WARN_DAYS,
  stuckDangerDays: STUCK_DANGER_DAYS,
  uploadOverdueDays: 1,
  assignWaitDays: 1,
  notifyAt: "09:00",
  channel: "슬랙",
};

export const PHOTOGRAPHERS = ["박현우", "이도현", "정민석", "최유진"];
export const RETOUCHERS = ["김서연", "한지우", "유가온"];
export const OPERATORS = ["김운영", "박마케팅"];

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

/** 채널 프로필. 규격과 문구 톤만 관리한다. */
export const CHANNELS: ChannelProfile[] = [
  { id: "ch-own", name: "자사몰", ratio: "4:3", maxPhotos: 20, tone: "상세 설명형" },
  {
    id: "ch-naver",
    name: "네이버 블로그",
    ratio: "1:1",
    maxPhotos: 10,
    tone: "검색 키워드 중심",
  },
  {
    id: "ch-ota",
    name: "야놀자 · 여기어때",
    ratio: "16:9",
    maxPhotos: 15,
    tone: "프로모션 강조",
  },
  {
    id: "ch-insta",
    name: "인스타그램",
    ratio: "4:5",
    maxPhotos: 10,
    tone: "감성 짧은 문구",
  },
];

/**
 * 채널 게시 기록.
 *
 * 발행 단계에서 관리하는 건 자동 등록이 아니라 이 표다.
 * 어느 채널에 올렸는지, 링크가 뭔지, 누가 언제 올렸는지.
 */
export const PUBLICATIONS: Publication[] = [
  {
    contentId: "c-04",
    channelId: "ch-own",
    status: "발행완료",
    url: "https://trip11.co.kr/stay/1042",
    publishedAt: "2026-08-27",
    publishedBy: "김운영",
  },
  {
    contentId: "c-04",
    channelId: "ch-naver",
    status: "발행완료",
    url: "https://blog.naver.com/trip11/223812940117",
    publishedAt: "2026-08-27",
    publishedBy: "김운영",
  },
  {
    contentId: "c-04",
    channelId: "ch-ota",
    status: "발행완료",
    url: "https://www.yanolja.com/stay/3001284",
    publishedAt: "2026-08-28",
    publishedBy: "김운영",
  },
  {
    contentId: "c-04",
    channelId: "ch-insta",
    status: "발행완료",
    url: "https://www.instagram.com/p/C9xK2mLpQ4a/",
    publishedAt: "2026-08-28",
    publishedBy: "박마케팅",
  },
  {
    contentId: "c-11",
    channelId: "ch-own",
    status: "발행완료",
    url: "https://trip11.co.kr/stay/0987",
    publishedAt: "2026-08-21",
    publishedBy: "김운영",
  },
  {
    contentId: "c-11",
    channelId: "ch-naver",
    status: "발행완료",
    url: "https://blog.naver.com/trip11/223798451220",
    publishedAt: "2026-08-21",
    publishedBy: "김운영",
  },
  {
    contentId: "c-11",
    channelId: "ch-ota",
    status: "발행완료",
    url: "https://www.yanolja.com/stay/2998710",
    publishedAt: "2026-08-22",
    publishedBy: "김운영",
  },
];

/** 두 날짜 사이 일수. 목업 데이터가 문자열 날짜라 여기서만 Date를 쓴다. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}
