"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TIER_LABEL, axIdea, axKind, type Tier } from "@/data/ax";
import { useStore } from "@/store/MockStore";

/**
 * 수단 층위 배지.
 *
 * 층위 이름만으로는 무엇을 말하는지 알기 어렵다.
 * means 를 주면 "전용 모델 · 중복 확인 라이브러리" 처럼 구체적인 도구까지 적는다.
 */
export function TierBadge({ tier, means }: { tier: Tier; means?: string }) {
  const variant =
    tier === "불가"
      ? "danger"
      : tier === "AI 아님"
        ? "neutral"
        : tier === "LLM" || tier === "LLM 비전"
          ? "ai"
          : "outline";
  return (
    <Badge variant={variant}>
      {TIER_LABEL[tier]}
      {means ? <span className="font-normal opacity-80">· {means}</span> : null}
    </Badge>
  );
}

/** AI가 만든 산출물임을 알리는 배지 */
export function AiBadge({ label = "AI 결과 (모의)" }: { label?: string }) {
  return (
    <Badge variant="ai">
      <span aria-hidden className="text-[9px] leading-none">
        ◆
      </span>
      {label}
    </Badge>
  );
}

/** AX 토글이 켜졌을 때만 렌더링 */
export function AxOnly({ children }: { children: ReactNode }) {
  const { axMode } = useStore();
  if (!axMode) return null;
  return <>{children}</>;
}

/**
 * 말풍선.
 *
 * 설명을 별도 카드로 빼면 화면이 길어지고 무엇에 대한 설명인지도 흐려진다.
 * 실제로 그 일이 일어나는 자리에 표식을 찍고 거기서 펼친다.
 *
 * 과제가 "AI 또는 자동화"를 물었으므로 둘을 색과 이름으로 갈라 놓는다.
 * 보라는 AI, 남색은 자동화다.
 */
function Bubble({
  id,
  align = "right",
  children,
}: {
  id: string;
  align?: "left" | "right";
  children?: ReactNode;
}) {
  const idea = axIdea(id);
  if (!idea) return null;
  const kind = axKind(idea);
  const isAi = kind === "AI";

  return (
    <span className="group/ax relative inline-flex">
      <span
        className={`flex cursor-help items-center gap-1 rounded-full border px-1.5 py-[1px] text-[10px] leading-[14px] font-semibold text-white ${
          isAi
            ? "border-ai bg-ai shadow-[0_1px_3px_rgba(105,64,165,0.35)]"
            : "border-auto bg-auto shadow-[0_1px_3px_rgba(44,92,168,0.35)]"
        }`}
      >
        <span aria-hidden>◆</span>
        AX · {kind}
      </span>

      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-50 mt-1.5 w-72 rounded-box border bg-canvas p-3 text-left opacity-0 shadow-[0_6px_20px_rgba(30,25,50,0.18)] transition-opacity duration-100 group-hover/ax:visible group-hover/ax:opacity-100 ${
          isAi ? "border-ai-line" : "border-auto-line"
        } ${align === "right" ? "right-0" : "left-0"}`}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-box border px-1.5 py-0.5 text-badge font-semibold ${
            isAi
              ? "border-ai-line bg-ai-bg text-ai"
              : "border-auto-line bg-auto-bg text-auto"
          }`}
        >
          {isAi ? "AI를 씁니다" : "자동화 · AI 아님"}
        </span>

        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-body font-semibold text-fg">{idea.title}</span>
          {idea.tiers.map((t) => (
            <TierBadge key={t} tier={t} means={idea.means[t]} />
          ))}
        </span>

        <span className="mt-1.5 block text-badge leading-[16px] text-fg-muted">
          {children ?? idea.note}
        </span>

        <span className="mt-2 block border-t border-line pt-1.5 text-badge leading-[16px] text-fg-subtle">
          <span className="font-semibold text-fg-muted">지금</span> {idea.asIs}
          <br />
          <span className="font-semibold text-fg-muted">바뀌면</span> {idea.toBe}
        </span>

        <span className="mt-1.5 block text-badge leading-[16px] text-fg-subtle">
          {idea.why} ·{" "}
          <Link href="/ax" className="underline underline-offset-2">
            전체 아이디어
          </Link>
        </span>
      </span>
    </span>
  );
}

/**
 * 블록 강조.
 *
 * 개선이 실제로 일어나는 영역을 테두리로 감싸고 오른쪽 위에 표식을 붙인다.
 * 표식에 마우스를 올리면 설명이 펼쳐진다.
 * 토글이 꺼져 있으면 아무 표시 없이 원래 화면 그대로다.
 */
export function AxHighlight({
  id,
  align = "right",
  children,
  note,
}: {
  id: string;
  align?: "left" | "right";
  children: ReactNode;
  note?: ReactNode;
}) {
  const { axMode } = useStore();
  if (!axMode) return <>{children}</>;

  const idea = axIdea(id);
  const isAi = idea ? axKind(idea) === "AI" : true;

  return (
    <div
      className={`relative rounded-box outline outline-2 outline-offset-2 ${
        isAi ? "outline-ai/35" : "outline-auto/35"
      }`}
    >
      {children}
      <span
        className={`absolute -top-2.5 z-40 ${align === "right" ? "right-3" : "left-3"}`}
      >
        <Bubble id={id} align={align}>
          {note}
        </Bubble>
      </span>
    </div>
  );
}

/** 인라인 표식. 숫자나 배지 하나처럼 좁은 지점에 붙인다 */
export function AxTag({
  id,
  align = "right",
  note,
}: {
  id: string;
  align?: "left" | "right";
  note?: ReactNode;
}) {
  const { axMode } = useStore();
  if (!axMode) return null;
  return (
    <Bubble id={id} align={align}>
      {note}
    </Bubble>
  );
}
