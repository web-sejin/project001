"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TIER_LABEL, TIER_NOTE, axIdea, type Tier } from "@/data/ax";
import { useStore } from "@/store/MockStore";

/** 수단 층위 배지. 화면 전체에서 같은 색 규칙을 쓴다. */
export function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "불가") return <Badge variant="danger">판정 불가</Badge>;
  if (tier === "AI 아님") return <Badge variant="neutral">AI 아님</Badge>;
  if (tier === "LLM" || tier === "LLM 비전")
    return <Badge variant="ai">{TIER_LABEL[tier]}</Badge>;
  return <Badge variant="outline">{TIER_LABEL[tier]}</Badge>;
}

/**
 * AX 개선 아이디어 주석.
 *
 * 토글이 꺼져 있으면 아무것도 그리지 않는다.
 * 끈 상태가 "지금 쓰고 있을 법한 관리 화면"이고, 켠 상태가 제안이다.
 */
export function AxNote({
  id,
  children,
  className = "",
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  const { axMode } = useStore();
  const idea = axIdea(id);
  if (!axMode || !idea) return null;

  return (
    <div
      className={`rounded-box border border-ai-line bg-ai-bg px-3 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-badge font-semibold tracking-wide text-ai">AX 개선</span>
        <span className="text-body font-semibold text-fg">{idea.title}</span>
        <TierBadge tier={idea.tier} />
      </div>
      <p className="mt-1 text-badge leading-[16px] text-fg-muted">
        {children ?? idea.note}
      </p>
      <p className="mt-1 text-badge leading-[16px] text-fg-subtle">
        {TIER_NOTE[idea.tier]} ·{" "}
        <Link href="/ax" className="underline underline-offset-2 hover:text-fg-muted">
          전체 아이디어
        </Link>
      </p>
    </div>
  );
}

/** AX 토글이 켜졌을 때만 보이는 인라인 표시 (배지 옆 등) */
export function AxOnly({ children }: { children: ReactNode }) {
  const { axMode } = useStore();
  if (!axMode) return null;
  return <>{children}</>;
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
