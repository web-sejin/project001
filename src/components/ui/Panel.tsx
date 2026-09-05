import type { ReactNode } from "react";

/** 테두리로 구조를 만든다. 그림자 아님. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-box border border-line-strong bg-canvas ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * 패널 헤더에 배경을 채워 본문과 확실히 갈라 놓는다.
 * 전부 흰 박스에 회색 선만 있으면 화면이 밋밋하고 위계가 안 보인다.
 */
export function PanelHeader({
  title,
  right,
  description,
}: {
  title: ReactNode;
  right?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line-strong bg-surface px-4 py-2.5">
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

/** 패널 하단의 근거·해설 영역 */
export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line bg-surface px-4 py-2.5">
      <p className="text-badge leading-[16px] text-fg-muted">{children}</p>
    </div>
  );
}
