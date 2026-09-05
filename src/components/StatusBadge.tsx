import { Badge } from "./ui/Badge";
import { STUCK_DANGER_DAYS, STUCK_WARN_DAYS } from "@/data/contents";
import type { ContentStatus } from "@/data/types";

/**
 * 단계 배지는 전부 무채색이다.
 * 색은 "지금 문제가 있다"에만 쓴다. 단계마다 색을 주면 정체 경고가 묻힌다.
 */
export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant="outline">{status}</Badge>;
}

export function StuckBadge({ days }: { days: number }) {
  if (days < STUCK_WARN_DAYS) return null;
  const variant = days >= STUCK_DANGER_DAYS ? "danger" : "warn";
  return (
    <Badge variant={variant}>
      <span className="tnum">{days}일 정체</span>
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: "승인" | "반려" | "대기" }) {
  if (status === "승인") return <Badge variant="success">승인</Badge>;
  if (status === "반려") return <Badge variant="danger">반려</Badge>;
  return <Badge variant="neutral">대기</Badge>;
}
