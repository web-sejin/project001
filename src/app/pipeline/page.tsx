import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { getAccommodation } from "@/data/accommodations";
import { getAnalysis, shotProgress } from "@/data/analysis";
import { getFlagCounts } from "@/data/photos";
import { CONTENTS, TODAY } from "@/data/contents";
import { CONTENT_STATUSES, type ContentStatus } from "@/data/types";

const COLUMN_NOTE: Record<ContentStatus, string> = {
  촬영예정: "일정 확정 · 필수 컷 목록 생성됨",
  촬영완료: "프리뷰 업로드 · 누락 탐지 구간",
  보정중: "평균 4.2일. 가장 오래 걸리는 구간",
  검수: "사진 단위 승인 · 반려",
  발행: "채널별 변환 완료",
};

export default function PipelinePage() {
  const cards = CONTENTS.map((c) => {
    const acc = getAccommodation(c.accommodationId);
    const analysis = getAnalysis(c.id);
    const progress = analysis ? shotProgress(analysis) : { met: 0, total: 0 };
    const missing = analysis
      ? analysis.missing.filter((m) => !analysis.dismissedMissing.includes(m.label))
      : [];
    const flags = getFlagCounts(c.id).reduce((s, f) => s + f.count, 0);
    return { content: c, acc, progress, missing, flags };
  });

  return (
    <div>
      <PageHeader
        title="파이프라인"
        description={`${TODAY} 기준 진행 중인 ${CONTENTS.length}건. 지금 각 건이 어느 단계에 있는지를 봅니다.`}
        right={
          <div className="flex items-center gap-1.5">
            <Badge variant="warn">3일 초과</Badge>
            <Badge variant="danger">7일 초과</Badge>
            <Badge variant="ai">AI 경고</Badge>
          </div>
        }
      />

      <div className="thin-scroll overflow-x-auto p-4 lg:p-6">
        <div className="flex min-w-max gap-3">
          {CONTENT_STATUSES.map((status) => {
            const list = cards.filter((c) => c.content.status === status);
            return (
              <section
                key={status}
                className="flex w-64 shrink-0 flex-col rounded-box border border-line bg-surface"
              >
                <header className="border-b border-line px-3 py-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-body font-semibold text-fg">{status}</h2>
                    <span className="tnum text-badge text-fg-subtle">
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
                        className="block rounded-box border border-line bg-canvas p-2.5 transition-colors hover:border-line-strong"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="min-w-0 text-body font-medium text-fg">
                            {acc?.name}
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
                              <span className="text-fg-subtle">필수 컷</span>
                              <span
                                className={`tnum ${
                                  progress.met === progress.total
                                    ? "text-fg-muted"
                                    : "font-medium text-danger"
                                }`}
                              >
                                {progress.met}/{progress.total}
                              </span>
                            </div>
                            <Meter
                              className="mt-1"
                              value={progress.met}
                              max={progress.total}
                              tone={
                                progress.met === progress.total ? "success" : "danger"
                              }
                            />
                          </div>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <StuckBadge days={content.stuckDays} />
                          {content.reshootCount > 0 ? (
                            <Badge variant="danger">
                              재촬영 {content.reshootCount}
                            </Badge>
                          ) : null}
                          {content.fieldMode ? (
                            <Badge variant="ai">현장</Badge>
                          ) : null}
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

      <div className="px-4 pb-6 lg:px-6">
        <p className="text-badge leading-[16px] text-fg-subtle">
          카드의 ▲는 AI가 필수 컷 누락을 의심한 건, ◆는 AI 1차 검수 플래그가 있는
          건입니다. 클릭하면 해당 탭으로 바로 이동합니다. 목업에서는 드래그앤드롭 대신
          링크 이동만 지원합니다.
        </p>
      </div>
    </div>
  );
}
