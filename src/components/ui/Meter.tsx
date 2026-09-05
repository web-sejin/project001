/** 진행률 바. 색은 상태 전달에만 쓴다. */
export function Meter({
  value,
  max,
  tone = "neutral",
  className = "",
}: {
  value: number;
  max: number;
  tone?: "neutral" | "success" | "warn" | "danger" | "ai";
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const fill = {
    neutral: "bg-fg-subtle",
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger",
    ai: "bg-ai",
  }[tone];
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-box bg-line ${className}`}>
      <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
