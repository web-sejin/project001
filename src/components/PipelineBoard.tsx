"use client";

import Link from "next/link";
import { StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { openMissing, shotProgress } from "@/data/analysis";
import { flagCounts } from "@/data/photos";
import { useStore } from "@/store/MockStore";
import { CONTENT_STATUSES, type ContentStatus } from "@/data/types";

const COLUMN_NOTE: Record<ContentStatus, string> = {
  촬영예정: "일정 확정 · 필수 컷 목록 생성됨",
  촬영완료: "프리뷰 업로드 · 누락 탐지 구간",
  보정중: "평균 4.2일. 가장 오래 걸리는 구간",
  검수: "사진 단위 승인 · 반려",
  발행: "채널별 변환 완료",
};

export function PipelineBoard() {
  const store = useStore();

  const cards = store.contents.map((content) => {
    const acc = store.accommodationOf(content.accommodationId);
    const analysis = store.analysisOf(content.id);
    const progress = analysis ? shotProgress(analysis) : { met: 0, total: 0 };
    const missing = analysis ? openMissing(analysis) : [];
    const flags = analysis
      ? flagCounts(store.photosOf(content.id)).reduce((s, f) => s + f.count, 0)
      : 0;
    return { content, acc, progress, missing, flags };
  });

  return (
    <div className="thin-scroll overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {CONTENT_STATUSES.map((status) => {
          const list = cards.filter((c) => c.content.status === status);
          return (
            <section
              key={status}
              className="flex w-64 shrink-0 flex-col rounded-box border border-line-strong bg-surface"
            >
              <header className="border-b border-line-strong px-3 py-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-semibold text-fg">{status}</h3>
                  <span className="tnum text-badge font-semibold text-fg-muted">
                    {list.length}
                  </span>
                </div>
                <p className="mt-0.5 text-badge leading-[15px] text-fg-subtle">
                  {COLUMN_NOTE[status]}
                </p>
              </header>

              <div className="flex-1 space-y-2 p-2">
                {list.map(({ content, acc, progress, missing, flags }) => {
                  const hasWarning = missing.length > 0;
                  const tab = hasWarning ? "upload" : flags > 0 ? "retouch" : "shoot";
                  return (
                    <Link
                      key={content.id}
                      href={`/content/${content.id}?tab=${tab}`}
                      className="block rounded-box border border-line-strong bg-canvas p-2.5 hover:border-fg-subtle"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="min-w-0 text-body font-semibold text-fg">
                          {acc?.name ?? "삭제된 숙소"}
                        </span>
                        {hasWarning ? (
                          <span
                            title={`누락 의심 ${missing.length}건`}
                            className="shrink-0 text-badge font-semibold text-danger"
                          >
                            ▲
                          </span>
                        ) : flags > 0 ? (
                          <span
                            title={`AI 검수 플래그 ${flags}장`}
                            className="shrink-0 text-badge font-semibold text-ai"
                          >
                            ◆
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 flex items-baseline justify-between gap-2 text-badge text-fg-subtle">
                        <span className="tnum">{content.shootDate}</span>
                        <span className="truncate">
                          {content.retoucher ?? content.photographer}
                        </span>
                      </p>

                      {progress.total > 0 ? (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-badge">
                            <span className="text-fg-muted">필수 컷</span>
                            <span
                              className={`tnum ${
                                progress.met === progress.total
                                  ? "text-fg-muted"
                                  : "font-semibold text-danger"
                              }`}
                            >
                              {progress.met}/{progress.total}
                            </span>
                          </div>
                          <Meter
                            className="mt-1"
                            value={progress.met}
                            max={progress.total}
                            tone={progress.met === progress.total ? "success" : "danger"}
                          />
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <StuckBadge days={content.stuckDays} />
                        {content.reshootCount > 0 ? (
                          <Badge variant="danger">재촬영 {content.reshootCount}</Badge>
                        ) : null}
                        {content.fieldMode ? <Badge variant="ai">현장</Badge> : null}
                      </div>
                    </Link>
                  );
                })}

                {list.length === 0 ? (
                  <p className="px-1 py-2 text-badge text-fg-subtle">없음</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
