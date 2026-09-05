"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge, StuckBadge } from "@/components/StatusBadge";
import { ShootTab } from "./ShootTab";
import { UploadTab } from "./UploadTab";
import { RetouchTab } from "./RetouchTab";
import { PublishTab } from "./PublishTab";
import { CONTENT_STATUSES } from "@/data/types";
import type { ContentAnalysis } from "@/data/analysis";
import type { ChannelCopy } from "@/data/copy";
import type {
  Accommodation,
  ChannelProfile,
  Content,
  Photo,
} from "@/data/types";

export type TabKey = "shoot" | "upload" | "retouch" | "publish";

const TABS: Array<{ key: TabKey; label: string; step: string }> = [
  { key: "shoot", label: "촬영", step: "1" },
  { key: "upload", label: "업로드 · 분류", step: "2" },
  { key: "retouch", label: "보정 · 검수", step: "3" },
  { key: "publish", label: "발행", step: "4" },
];

export function ContentDetail({
  content,
  acc,
  analysis,
  photos,
  channels,
  copies,
  initialTab,
}: {
  content: Content;
  acc: Accommodation;
  analysis: ContentAnalysis;
  photos: Photo[];
  channels: ChannelProfile[];
  copies: Record<string, ChannelCopy>;
  initialTab: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [fieldMode, setFieldMode] = useState(content.fieldMode);

  const approved = photos.filter(
    (p) => p.selected && p.approvalStatus === "승인",
  );
  const currentStep = CONTENT_STATUSES.indexOf(content.status);

  return (
    <div>
      <header className="border-b border-line-strong bg-surface px-4 pt-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="text-badge text-fg-subtle transition-colors hover:text-fg-muted"
          >
            현황판
          </Link>
          <span aria-hidden className="text-badge text-fg-subtle">
            /
          </span>
          <span className="text-badge text-fg-subtle">{acc.region}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-page font-semibold text-fg">{acc.name}</h1>
          <StatusBadge status={content.status} />
          <StuckBadge days={content.stuckDays} />
          {content.reshootCount > 0 ? (
            <Badge variant="danger">재촬영 {content.reshootCount}회</Badge>
          ) : null}
          {fieldMode ? <Badge variant="ai">현장 모드</Badge> : null}
        </div>

        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-body text-fg-muted">
          <Meta label="촬영일" value={content.shootDate} />
          <Meta label="작가" value={content.photographer} />
          <Meta label="리터처" value={content.retoucher ?? "미배정"} />
          <Meta label="유형" value={acc.type} />
        </dl>

        <p className="mt-2 max-w-3xl text-body leading-[19px] text-fg-muted">
          촬영 건 하나를 처음부터 끝까지 다루는 화면입니다. 탭 4개가 업무 흐름의 각
          단계이고, 지금 어느 단계까지 왔는지는 탭 옆 체크 표시로 보입니다.
        </p>

        <nav className="mt-3 -mb-px flex gap-0.5 overflow-x-auto">
          {TABS.map((t, i) => {
            const done = i < currentStep;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 border-b-2 px-3 py-2 text-body transition-colors ${
                  tab === t.key
                    ? "border-fg font-medium text-fg"
                    : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                <span className="tnum mr-1.5 text-fg-subtle">{t.step}</span>
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
          <ShootTab
            content={content}
            acc={acc}
            analysis={analysis}
            fieldMode={fieldMode}
            onFieldModeChange={setFieldMode}
          />
        ) : null}
        {tab === "upload" ? (
          <UploadTab
            content={content}
            analysis={analysis}
            photos={photos}
            fieldMode={fieldMode}
          />
        ) : null}
        {tab === "retouch" ? (
          <RetouchTab content={content} analysis={analysis} photos={photos} />
        ) : null}
        {tab === "publish" ? (
          approved.length === 0 ? (
            <div className="rounded-box border border-line p-4 text-body text-fg-muted">
              아직 승인된 컷이 없습니다. 검수에서 승인이 끝나면 채널별 변환 결과가
              여기에 생성됩니다.
            </div>
          ) : (
            <PublishTab
              channels={channels}
              copies={copies}
              photos={approved}
              approvedCount={approved.length}
            />
          )
        ) : null}
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
