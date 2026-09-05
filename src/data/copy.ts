import type { Accommodation } from "./types";

/**
 * LLM이 생성한 채널별 카피 초안.
 *
 * 채널마다 톤이 실제로 달라야 의미가 있다. 같은 문장을 길이만 잘라 쓰면
 * "채널별 카피 생성"이라고 부를 이유가 없다.
 * 목업이므로 LLM 호출 대신 채널 톤 프로필에 맞춘 결과물을 미리 넣어 뒀다.
 */

export interface ChannelCopy {
  title: string;
  body: string;
  meta?: string;
}

/** 시설 항목 id → 카피에 쓸 짧은 단어 */
const WORD: Record<string, string> = {
  "f-pool": "수영장",
  "f-breakfast": "조식",
  "f-bbq": "바비큐",
  "f-spa": "스파",
  "f-pet": "반려동물 동반",
  "f-outdoor": "테라스",
};

export function getChannelCopy(
  channelId: string,
  acc: Accommodation,
): ChannelCopy {
  const has = (id: string) => acc.facilityIds.includes(id);
  const words = acc.facilityIds.map((id) => WORD[id]).filter(Boolean);
  const roomLine =
    acc.roomTypes > 1 ? `객실 ${acc.roomTypes}개 타입` : "독채 1개 타입";

  switch (channelId) {
    case "ch-own":
      return {
        title: `${acc.name} — 공간 안내`,
        body: [
          `${acc.address}에 위치한 ${acc.type}입니다. ${roomLine}으로 운영되며, ${
            words.slice(0, 3).join(" · ") || "기본 편의시설"
          }을 갖추고 있습니다.`,
          "",
          `객실은 전 타입 남향 배치로 오후 시간대 채광이 안정적입니다. ${
            has("f-pool")
              ? "야외 수영장은 투숙객 전용으로 운영되며 이용 시간은 07:00~21:00입니다. "
              : ""
          }${has("f-breakfast") ? "조식은 1층 다이닝에서 08:00~10:00에 제공됩니다. " : ""}${
            has("f-bbq") ? "바비큐존은 사전 예약제로 운영합니다." : ""
          }`,
          "",
          "체크인 15:00 / 체크아웃 11:00. 주차는 객실당 1대 무료입니다.",
        ].join("\n"),
        meta: "상세 설명형 · 시설 정보와 이용 규칙 중심",
      };

    case "ch-naver":
      return {
        title: `${acc.region} ${acc.type} 추천 | ${acc.name} 후기·가격·예약`,
        body: [
          `${acc.region} ${acc.type} 찾으신다면 ${acc.name}을 추천드립니다.`,
          `${acc.region} 여행 숙소, ${acc.region} ${words[0] ?? "가족여행"} 숙소로 많이 찾으시는 곳입니다.`,
          "",
          `▪ ${acc.region} ${acc.type} / ${roomLine}`,
          ...words.map((w) => `▪ ${acc.region} ${w} 숙소`),
          "",
          `${acc.region} 숙소 예약, ${acc.name} 실사진으로 확인하세요.`,
        ].join("\n"),
        meta: "검색 키워드 중심 · 지역명 + 유형 + 시설 조합",
      };

    case "ch-ota":
      return {
        title: `[9월 한정] ${acc.name} 최대 32% 할인`,
        body: [
          `${acc.region} ${acc.type} · ${words.slice(0, 2).join(" / ") || "프라이빗 스테이"}`,
          "",
          "· 9월 평일 예약 시 32% 할인",
          "· 2박 이상 예약 시 웰컴 드링크 제공",
          has("f-breakfast") ? "· 조식 2인 무료 포함" : "· 얼리 체크인 무료 (14:00)",
          "",
          "선착순 마감. 지금 예약하세요.",
        ].join("\n"),
        meta: "프로모션 강조 · 할인율과 마감 압박 중심",
      };

    case "ch-insta":
      return {
        title: acc.name,
        body: [
          `${acc.region}에서 보낸 하루.`,
          has("f-pool")
            ? "물에 비친 하늘을 한참 봤다."
            : "창을 열면 바로 그 계절이었다.",
          "",
          `#${acc.region} #${acc.type} #${acc.name.replace(/\s/g, "")} ${words
            .map((w) => `#${w.replace(/\s/g, "")}`)
            .join(" ")} #국내여행 #숙소추천`,
        ].join("\n"),
        meta: "감성 짧은 문구 · 2~3줄 + 해시태그",
      };

    default:
      return { title: acc.name, body: "" };
  }
}
