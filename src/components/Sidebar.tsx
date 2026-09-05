"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toggle } from "@/components/ui/Toggle";
import { useStore } from "@/store/MockStore";

const NAV = [
  { href: "/", label: "현황판" },
  { href: "/calendar", label: "촬영 캘린더" },
  { href: "/accommodations", label: "숙소 관리" },
  { href: "/ax", label: "AX 관점 아이디어" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/content");
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { axMode, setAxMode } = useStore();

  return (
    <>
      {/* 뷰포트에 고정한다. 본문이 길어져도 AX 토글이 항상 보여야 한다 */}
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col bg-nav lg:flex">
        <div className="px-4 py-4">
          <p className="text-ui font-semibold text-white">콘텐츠 제작 운영</p>
          <p className="mt-0.5 text-badge text-nav-muted">트립일레븐 내부 도구</p>
        </div>

        <nav className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mb-0.5 block rounded-box px-2.5 py-1.5 text-body ${
                  active
                    ? "bg-white font-semibold text-fg"
                    : "text-nav-fg hover:bg-nav-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <AxToggle axMode={axMode} setAxMode={setAxMode} />

        <div className="border-t border-white/15 p-3">
          <p className="text-badge font-semibold text-white">더미 데이터 기반 목업</p>
          <p className="mt-1 text-badge leading-[17px] text-nav-muted">
            등록·수정은 화면에서 반영되지만 서버가 없어 새로고침하면 초기값으로
            돌아갑니다.
          </p>
        </div>
      </aside>

      {/* 모바일 */}
      <div className="sticky top-0 z-30 bg-nav lg:hidden">
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <p className="text-ui font-semibold text-white">콘텐츠 제작 운영</p>
          <label className="flex items-center gap-1.5 text-badge text-nav-fg">
            AX
            <Toggle
              id="ax-mode-mobile"
              label="AX 관점 아이디어 표시"
              checked={axMode}
              onChange={setAxMode}
            />
          </label>
        </div>
        <nav className="thin-scroll flex gap-1 overflow-x-auto px-2 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-box px-2.5 py-1 text-body ${
                  active
                    ? "bg-white font-semibold text-fg"
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

/**
 * 이 목업의 핵심 장치.
 *
 * 끄면 지금 쓰고 있을 법한 관리 화면이고, 켜면 어디에 무엇을 얹을지가 보인다.
 * As-Is 와 To-Be 를 한 화면에서 비교할 수 있게 하는 것이 목적이다.
 */
function AxToggle({
  axMode,
  setAxMode,
}: {
  axMode: boolean;
  setAxMode: (n: boolean) => void;
}) {
  return (
    <div className="mx-2 mb-3 rounded-box border border-ai/50 border-l-[3px] border-l-ai bg-nav-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-semibold text-white">AX 관점 아이디어</span>
        <Toggle
          id="ax-mode"
          label="AX 관점 아이디어 표시"
          checked={axMode}
          onChange={setAxMode}
        />
      </div>
      {axMode ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-badge text-nav-fg">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-ai"
            />
            보라 — AI를 쓰는 지점
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-badge text-nav-fg">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-auto"
            />
            남색 — 자동화 (AI 아님)
          </p>
        </>
      ) : (
        <p className="mt-2 text-badge leading-[17px] text-nav-muted">
          지금 쓰고 있을 법한 관리 화면입니다. 켜면 어디에 AI·자동화를 넣을지
          보입니다.
        </p>
      )}
    </div>
  );
}
