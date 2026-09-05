import { TODAY, daysBetween } from "@/data/contents";
import type { AlertSettings, Content } from "@/data/types";

/**
 * 놓치고 있는 건을 시스템이 대신 훑는다.
 *
 * 자동화는 사람이 버튼을 눌렀을 때 반응하는 것이 아니라,
 * 아무도 보고 있지 않을 때 시스템이 알아서 챙겨 주는 것이다.
 * 그래서 여기 규칙은 전부 "사람이 신경 쓰지 않아도" 걸리는 것들이다.
 *
 * 매일 정해진 시각에 이 검사를 돌려 담당자별로 묶어 알림을 보낸다.
 * 날짜 빼기와 조건 검사뿐이라 AI가 낄 자리가 없다.
 * 며칠을 기준으로 볼지는 코드가 아니라 설정에서 정한다.
 */

export type AttentionKind =
  | "미업로드"
  | "배정 대기"
  | "마감 초과"
  | "정체"
  | "발행 미완료";

export interface AttentionItem {
  contentId: string;
  kind: AttentionKind;
  detail: string;
  severity: "warn" | "danger";
  owner: string;
}

export function findAttention(
  content: Content,
  publish: { done: number; total: number },
  s: AlertSettings,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const owner = content.retoucher ?? content.photographer;

  // 촬영일이 지났는데 사진이 안 올라온 건
  if (content.status === "촬영예정") {
    const past = daysBetween(content.shootDate, TODAY);
    if (past >= s.uploadOverdueDays) {
      items.push({
        contentId: content.id,
        kind: "미업로드",
        detail: `촬영일이 ${past}일 지났는데 사진이 올라오지 않았습니다`,
        severity: past >= s.stuckWarnDays ? "danger" : "warn",
        owner: content.photographer,
      });
    }
  }

  // 업로드는 끝났는데 리터처가 안 정해진 건
  if (content.status === "촬영완료" && !content.retoucher) {
    const waiting = daysBetween(content.statusChangedAt, TODAY);
    if (waiting >= s.assignWaitDays) {
      items.push({
        contentId: content.id,
        kind: "배정 대기",
        detail: `업로드 후 ${waiting}일째 리터처가 정해지지 않았습니다`,
        severity: waiting >= s.stuckWarnDays ? "danger" : "warn",
        owner: content.photographer,
      });
    }
  }

  // 보정 마감일이 지난 건
  if (content.dueDate && content.status !== "발행") {
    const over = daysBetween(content.dueDate, TODAY);
    if (over > 0) {
      items.push({
        contentId: content.id,
        kind: "마감 초과",
        detail: `보정 마감일을 ${over}일 넘겼습니다`,
        severity: "danger",
        owner,
      });
    }
  }

  // 같은 단계에 오래 머문 건
  if (content.status !== "발행" && content.stuckDays >= s.stuckWarnDays) {
    items.push({
      contentId: content.id,
      kind: "정체",
      detail: `${content.status} 상태로 ${content.stuckDays}일째입니다`,
      severity: content.stuckDays >= s.stuckDangerDays ? "danger" : "warn",
      owner,
    });
  }

  // 발행 단계인데 아직 안 올린 채널이 있는 건
  if (content.status === "발행" && publish.done < publish.total) {
    items.push({
      contentId: content.id,
      kind: "발행 미완료",
      detail: `채널 ${publish.total - publish.done}곳에 아직 올리지 않았습니다`,
      severity: publish.done === 0 ? "danger" : "warn",
      owner,
    });
  }

  return items;
}
