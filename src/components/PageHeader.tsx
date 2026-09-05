import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-fg">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-body text-fg-muted">{description}</p>
          ) : null}
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      {children}
    </header>
  );
}
