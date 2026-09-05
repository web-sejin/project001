"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "대시보드", hint: "지금 뭐가 막혀 있나" },
  { href: "/pipeline", label: "파이프라인", hint: "현재 상태" },
  { href: "/calendar", label: "캘린더", hint: "앞으로 할 촬영" },
  { href: "/accommodations", label: "숙소 관리", hint: "필수 컷 자동 생성" },
  { href: "/how-it-works", label: "처리 구조", hint: "왜 이렇게 설계했나" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-4 py-3.5">
          <p className="text-ui font-semibold text-fg">콘텐츠 제작 운영</p>
          <p className="mt-0.5 text-badge text-fg-subtle">트립일레븐 · 내부 도구</p>
        </div>

        <nav className="flex-1 p-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-box px-2.5 py-1.5 text-body transition-colors ${
                  active
                    ? "bg-line/70 font-medium text-fg"
                    : "text-fg-muted hover:bg-line/40"
                }`}
              >
                {item.label}
                <span className="mt-px block text-badge text-fg-subtle">
                  {item.hint}
                </span>
              </Link>
            );
          })}
        </nav>

        <MockNotice />
      </aside>

      {/* 모바일 — 촬영 현장에서 폰으로 쓰는 시나리오를 위해 유지 */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface lg:hidden">
        <div className="flex items-baseline justify-between px-3 pt-2.5">
          <p className="text-ui font-semibold text-fg">콘텐츠 제작 운영</p>
          <span className="text-badge text-fg-subtle">목업</span>
        </div>
        <nav className="thin-scroll flex gap-1 overflow-x-auto px-2 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-box border px-2.5 py-1 text-body ${
                  active
                    ? "border-line-strong bg-canvas font-medium text-fg"
                    : "border-transparent text-fg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

/** 목업이라는 걸 감추지 않는다. 범위를 밝히는 것 자체가 설계의 일부다. */
function MockNotice() {
  return (
    <div className="border-t border-line p-3">
      <p className="text-badge font-medium text-fg-muted">
        이 화면은 더미 데이터 기반 목업입니다
      </p>
      <p className="mt-1 text-badge leading-[15px] text-fg-subtle">
        AI 처리 결과는 실제 파이프라인의 출력 형태를 재현한 것입니다. 서버·DB·로그인은
        구현 범위에 포함하지 않았습니다.
      </p>
    </div>
  );
}
