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
    <section className={`rounded-box border border-line bg-canvas ${className}`}>
      {children}
    </section>
  );
}

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
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
      <div className="min-w-0">
        <h2 className="text-section font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-badge text-fg-subtle">{description}</p>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
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
