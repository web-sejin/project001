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

/**
 * 섹션 단위 해설.
 * 실제 운영 화면이면서 동시에 "이 기능이 왜 여기 있는지"를 설명하는 문서이기도 하다.
 */
export function Explain({
  label = "이 섹션",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-l-2 border-line-strong bg-surface py-2 pr-3 pl-3">
      <p className="text-badge leading-[16px] text-fg-muted">
        <span className="font-semibold text-fg">{label}</span>{" "}
        {children}
      </p>
    </div>
  );
}
