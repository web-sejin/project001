"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { ShootTab } from "./ShootTab";
import { UploadTab } from "./UploadTab";
import { RetouchTab } from "./RetouchTab";
import { PublishTab } from "./PublishTab";
import { useStore } from "@/store/MockStore";
import { STAGES, stageOf } from "@/data/types";
import type { Accommodation, Content } from "@/data/types";
import type { ContentAnalysis } from "@/data/analysis";

export type TabKey = "shoot" | "upload" | "retouch" | "publish";

/** 탭 4개 = 과제의 업무 흐름 4단계 = 현황판 보드의 칼럼 4개 */
const TABS: Array<{ key: TabKey; stageIndex: number; label: string }> = [
  { key: "shoot", stageIndex: 0, label: "촬영 일정" },
  { key: "upload", stageIndex: 1, label: "사진 업로드" },
  { key: "retouch", stageIndex: 2, label: "보정 · 검수" },
  { key: "publish", stageIndex: 3, label: "채널 발행" },
];

export function ContentDetail({
  content,
  acc,
  analysis,
  initialTab,
}: {
  content: Content;
  acc: Accommodation;
  analysis: ContentAnalysis;
  initialTab: TabKey;
}) {
  const store = useStore();
  const [tab, setTab] = useState<TabKey>(initialTab);

  const photos = store.photosOf(content.id);
  const pub = store.publishProgress(content.id);
  const currentStage = STAGES.findIndex((s) => s.key === stageOf(content.status).key);

  return (
    <div>
      <header className="border-b border-line-strong bg-surface px-4 pt-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2 text-badge text-fg-muted">
          <Link href="/" className="hover:text-fg">
            현황판
          </Link>
          <span aria-hidden>/</span>
          <span>{acc.region}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-page font-semibold text-fg">{acc.name}</h1>
          <StatusBadge status={content.status} />
          <StuckBadge days={content.stuckDays} />
          {content.reshootCount > 0 ? (
            <Badge variant="danger">재촬영 {content.reshootCount}회</Badge>
          ) : null}
          {pub.done > 0 ? (
            <Badge variant={pub.done === pub.total ? "success" : "warn"}>
              채널 발행{" "}
              <span className="tnum">
                {pub.done}/{pub.total}
              </span>
            </Badge>
          ) : null}
        </div>

        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-body text-fg-muted">
          <Meta label="촬영일" value={content.shootDate} />
          <Meta label="작가" value={content.photographer} />
          <Meta label="리터처" value={content.retoucher ?? "미배정"} />
          <Meta label="유형" value={acc.type} />
        </dl>

        <nav className="mt-3 -mb-px flex gap-0.5 overflow-x-auto">
          {TABS.map((t) => {
            const done = t.stageIndex < currentStage;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 border-b-2 px-3 py-2 text-body ${
                  tab === t.key
                    ? "border-ai font-semibold text-ai"
                    : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                <span className="tnum mr-1.5 text-fg-subtle">{t.stageIndex + 1}</span>
                {t.label}
                {done ? (
                  <span aria-hidden className="ml-1 text-success">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </header>

      <div key={tab} className="tab-panel p-4 lg:p-6">
        {tab === "shoot" ? (
          <ShootTab content={content} acc={acc} analysis={analysis} />
        ) : null}
        {tab === "upload" ? (
          <UploadTab content={content} analysis={analysis} photos={photos} />
        ) : null}
        {tab === "retouch" ? (
          <RetouchTab content={content} photos={photos} />
        ) : null}
        {tab === "publish" ? <PublishTab content={content} acc={acc} photos={photos} /> : null}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}
