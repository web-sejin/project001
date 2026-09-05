import type { ReactNode } from "react";

/**
 * ⓘ 툴팁. "AI가 처리합니다"로 뭉뚱그리지 않고
 * 어떤 층위의 수단을 왜 골랐는지를 그 자리에서 밝히는 장치.
 */
export function InfoTip({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label="수단 설명"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line-strong text-[9px] leading-none text-fg-subtle transition-colors hover:border-fg-subtle hover:text-fg-muted"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-40 mt-1.5 w-64 rounded-box border border-line-strong bg-canvas p-2.5 text-badge leading-[15px] font-normal text-fg-muted opacity-0 shadow-[0_4px_12px_rgba(15,15,15,0.12)] transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
