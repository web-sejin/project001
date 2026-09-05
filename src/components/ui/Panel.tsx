import type { ReactNode } from "react";

type Tone = "default" | "ai";

/**
 * 테두리로 구조를 만든다. 그림자 아님.
 *
 * tone="ai" 는 AI 산출물이 들어 있는 패널이다.
 * 왼쪽에 보라 굵은 바를 세워서 스크롤 중에도 어디가 AI인지 바로 보이게 한다.
 */
export function Panel({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-box border bg-canvas ${
        tone === "ai"
          ? "border-ai-line border-l-[3px] border-l-ai"
          : "border-line-strong"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  right,
  description,
  tone = "default",
}: {
  title: ReactNode;
  right?: ReactNode;
  description?: ReactNode;
  tone?: Tone;
}) {
  return (
    <header
      className={`flex flex-wrap items-start justify-between gap-2 border-b px-4 py-2.5 ${
        tone === "ai" ? "border-ai-line bg-ai-bg" : "border-line-strong bg-surface"
      }`}
    >
      <div className="min-w-0">
        <h2 className="text-section font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-0.5 max-w-xl text-badge leading-[16px] text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {right ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>
      ) : null}
    </header>
  );
}

export function PanelBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
