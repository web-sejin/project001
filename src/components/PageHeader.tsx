import type { ReactNode } from "react";

/**
 * 페이지 헤더.
 *
 * purpose 는 "이 화면이 뭘 하는 곳인가"를 한두 줄로 밝히는 자리다.
 * 면접관이 개발자가 아닐 수 있어서, 화면마다 용도가 글로 적혀 있어야 한다.
 */
export function PageHeader({
  title,
  purpose,
  right,
  children,
}: {
  title: string;
  purpose?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line-strong bg-surface px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-fg">{title}</h1>
          {purpose ? (
            <p className="mt-1.5 max-w-3xl text-body leading-[19px] text-fg-muted">
              {purpose}
            </p>
          ) : null}
        </div>
        {right ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
}
