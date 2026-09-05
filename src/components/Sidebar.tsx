"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  hint: string;
}

/**
 * 매일 보는 화면(운영)과 가끔 설정하는 화면(기준 정보)을 갈라 놓는다.
 * 기준 정보는 시설 → 숙소 → 촬영 일정 순서로 등록하는 게 맞아서 그 순서로 세운다.
 */
const GROUPS: Array<{ title: string; note?: string; items: NavItem[] }> = [
  {
    title: "운영",
    items: [
      { href: "/", label: "현황판", hint: "지금 뭐가 막혀 있나" },
      { href: "/calendar", label: "촬영 캘린더", hint: "앞으로 할 촬영" },
    ],
  },
  {
    title: "기준 정보",
    note: "시설 → 숙소 → 촬영 일정 순서로 등록합니다",
    items: [
      { href: "/facilities", label: "1. 시설 관리", hint: "필수 컷 규칙의 원천" },
      { href: "/accommodations", label: "2. 숙소 관리", hint: "시설 선택 · 일정 등록" },
    ],
  },
  {
    title: "문서",
    items: [
      { href: "/how-it-works", label: "처리 구조", hint: "왜 이렇게 설계했나" },
    ],
  },
];

const FLAT = GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/content");
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line-strong bg-surface lg:flex">
        <div className="border-b border-line-strong px-4 py-3.5">
          <p className="text-ui font-semibold text-fg">콘텐츠 제작 운영</p>
          <p className="mt-0.5 text-badge text-fg-subtle">트립일레븐 · 내부 도구</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-3 px-2">
              <p className="px-2.5 pb-1 text-badge font-semibold text-fg-subtle">
                {group.title}
              </p>
              {group.note ? (
                <p className="px-2.5 pb-1.5 text-badge leading-[15px] text-fg-subtle">
                  {group.note}
                </p>
              ) : null}
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`mb-0.5 block border-l-2 py-1.5 pr-2.5 pl-2 transition-colors ${
                      active
                        ? "border-fg bg-canvas"
                        : "border-transparent hover:bg-line/50"
                    }`}
                  >
                    <span
                      className={`block text-body ${
                        active ? "font-semibold text-fg" : "text-fg-muted"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="mt-px block text-badge text-fg-subtle">
                      {item.hint}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <MockNotice />
      </aside>

      {/* 모바일 — 촬영 현장에서 폰으로 쓰는 시나리오를 위해 유지 */}
      <div className="sticky top-0 z-30 border-b border-line-strong bg-surface lg:hidden">
        <div className="flex items-baseline justify-between px-3 pt-2.5">
          <p className="text-ui font-semibold text-fg">콘텐츠 제작 운영</p>
          <span className="text-badge text-fg-subtle">더미 데이터 목업</span>
        </div>
        <nav className="thin-scroll flex gap-1 overflow-x-auto px-2 py-2">
          {FLAT.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-box border px-2.5 py-1 text-body ${
                  active
                    ? "border-line-strong bg-canvas font-semibold text-fg"
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
    <div className="border-t border-line-strong p-3">
      <p className="text-badge font-semibold text-fg">
        더미 데이터 기반 목업입니다
      </p>
      <p className="mt-1 text-badge leading-[15px] text-fg-muted">
        등록·수정은 화면에서 실제로 반영되지만 서버가 없어 새로고침하면 초기값으로
        돌아갑니다. AI 처리 결과는 실제 파이프라인의 출력 형태를 재현한 것입니다.
      </p>
    </div>
  );
}
