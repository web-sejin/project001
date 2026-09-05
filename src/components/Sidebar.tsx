"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "운영",
    items: [
      { href: "/", label: "현황판" },
      { href: "/calendar", label: "촬영 캘린더" },
    ],
  },
  {
    title: "기준 정보",
    items: [
      { href: "/facilities", label: "1. 시설 관리" },
      { href: "/accommodations", label: "2. 숙소 관리" },
    ],
  },
  {
    title: "문서",
    items: [{ href: "/how-it-works", label: "처리 구조" }],
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
      <aside className="hidden w-52 shrink-0 flex-col bg-nav lg:flex">
        <div className="px-4 py-4">
          <p className="text-ui font-semibold text-white">콘텐츠 제작 운영</p>
          <p className="mt-0.5 text-badge text-nav-muted">트립일레븐 내부 도구</p>
        </div>

        <nav className="flex-1 overflow-y-auto pb-2">
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-4 px-2">
              <p className="px-2.5 pb-1.5 text-badge font-semibold tracking-wide text-nav-muted">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`mb-0.5 block rounded-box px-2.5 py-1.5 text-body ${
                      active
                        ? "bg-white font-semibold text-ai"
                        : "text-nav-fg hover:bg-nav-soft"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/15 p-3">
          <p className="text-badge font-semibold text-white">
            더미 데이터 기반 목업
          </p>
          <p className="mt-1 text-badge leading-[15px] text-nav-muted">
            등록·수정은 화면에서 반영되지만 서버가 없어 새로고침하면 초기값으로
            돌아갑니다.
          </p>
        </div>
      </aside>

      {/* 모바일 — 촬영 현장에서 폰으로 쓰는 시나리오를 위해 유지 */}
      <div className="sticky top-0 z-30 bg-nav lg:hidden">
        <div className="flex items-baseline justify-between px-3 pt-2.5">
          <p className="text-ui font-semibold text-white">콘텐츠 제작 운영</p>
          <span className="text-badge text-nav-muted">목업</span>
        </div>
        <nav className="thin-scroll flex gap-1 overflow-x-auto px-2 py-2">
          {FLAT.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-box px-2.5 py-1 text-body ${
                  active
                    ? "bg-white font-semibold text-ai"
                    : "text-nav-fg hover:bg-nav-soft"
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
