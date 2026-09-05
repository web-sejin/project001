import type { ReactNode } from "react";

type Variant = "neutral" | "ai" | "success" | "warn" | "danger" | "outline";

const STYLES: Record<Variant, string> = {
  neutral: "bg-surface text-fg-muted border-line-strong",
  ai: "bg-ai-bg text-ai border-ai-line",
  success: "bg-[#E8F2F0] text-success border-[#B9D9D3]",
  warn: "bg-[#FBF0E2] text-warn border-[#EDCFA6]",
  danger: "bg-[#FBEAEA] text-danger border-[#EFC2C1]",
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
