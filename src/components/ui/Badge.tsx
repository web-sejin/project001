import type { ReactNode } from "react";

type Variant = "neutral" | "ai" | "success" | "warn" | "danger" | "outline";

const STYLES: Record<Variant, string> = {
  neutral: "bg-surface text-fg-muted border-line",
  ai: "bg-ai-bg text-ai border-ai/20",
  success: "bg-[#EDF4F2] text-success border-success/20",
  warn: "bg-[#FBF0E4] text-warn border-warn/20",
  danger: "bg-[#FBEBEB] text-danger border-danger/20",
  outline: "bg-canvas text-fg-muted border-line-strong",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-box border px-1.5 py-0.5 text-badge font-medium whitespace-nowrap ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/** AI가 만든 산출물임을 알리는 배지. 화면 전체에서 같은 색을 쓴다. */
export function AiBadge({ label = "AI 결과 (모의)" }: { label?: string }) {
  return (
    <Badge variant="ai">
      <span aria-hidden className="text-[9px] leading-none">◆</span>
      {label}
    </Badge>
  );
}
