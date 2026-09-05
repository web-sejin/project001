"use client";

import Link from "next/link";
import { StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { openMissing, shotProgress } from "@/data/analysis";
import { flagCounts } from "@/data/photos";
import { useStore } from "@/store/MockStore";
import { STAGES } from "@/data/types";

/**
 * 과제가 정의한 4단계를 그대로 칼럼으로 세운 보드.
 *
 * 촬영 일정 관리 → 촬영 사진 업로드 → 사진 보정 및 검수 → 채널별 콘텐츠 업로드
 * 콘텐츠 상세의 탭 4개와 1:1로 맞춰서, 보드에서 클릭하면 같은 단계의 탭이 열린다.
 */
export function StageBoard() {
  const store = useStore();
  const axMode = store.axMode;

  return (
    <div className="thin-scroll overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {STAGES.map((stage) => {
          const list = store.contents.filter((c) => stage.statuses.includes(c.status));

          return (
            <section
              key={stage.key}
              className="flex w-64 shrink-0 flex-col rounded-box border border-line-strong bg-surface"
            >
              <header className="border-b border-line-strong px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-body font-semibold text-fg">
                    <span className="tnum mr-1.5 text-fg-subtle">{stage.step}</span>
                    {stage.label}
                  </h3>
                  <span className="tnum text-badge font-semibold text-fg-muted">
                    {list.length}
                  </span>
                </div>
                <p className="mt-0.5 text-badge leading-[15px] text-fg-subtle">
                  {stage.hint}
                </p>
              </header>

              <div className="flex-1 space-y-2 p-2">
                {list.map((content) => {
                  const acc = store.accommodationOf(content.accommodationId);
                  const analysis = store.analysisOf(content.id);
                  const progress = analysis
                    ? shotProgress(analysis)
                    : { met: 0, total: 0 };
                  const missing = analysis ? openMissing(analysis) : [];
                  const flags = flagCounts(store.photosOf(content.id)).reduce(
                    (s, f) => s + f.count,
                    0,
                  );
                  const pub = store.publishProgress(content.id);

                  // AI가 만들어낸 신호는 AX 토글이 켜졌을 때만 보여준다.
                  // 끈 상태가 지금 쓰고 있을 법한 화면이기 때문이다.
                  const showMissing = axMode && missing.length > 0;
                  const showFlags = axMode && !showMissing && flags > 0;
                  const tab = showMissing
                    ? "upload"
                    : showFlags
                      ? "retouch"
                      : stage.key === "발행"
                        ? "publish"
                        : stage.key === "보정검수"
                          ? "retouch"
                          : stage.key === "업로드"
                            ? "upload"
                            : "shoot";

                  return (
                    <Link
                      key={content.id}
                      href={`/content/${content.id}?tab=${tab}`}
                      className="block rounded-box border border-line-strong bg-canvas p-2.5 hover:border-ai"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="min-w-0 text-body font-semibold text-fg">
                          {acc?.name ?? "삭제된 숙소"}
                        </span>
                        {showMissing ? (
                          <span
                            title={`누락 의심 ${missing.length}건`}
                            className="shrink-0 text-badge font-semibold text-danger"
                          >
                            ▲
                          </span>
                        ) : showFlags ? (
                          <span
                            title={`검수 플래그 ${flags}장`}
                            className="shrink-0 text-badge font-semibold text-ai"
                          >
                            ◆
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 flex items-baseline justify-between gap-2 text-badge text-fg-muted">
                        <span className="tnum">{content.shootDate}</span>
                        <span className="truncate">
                          {content.retoucher ?? content.photographer}
                        </span>
                      </p>

                      {/* 3단계는 보정중/검수가 한 칼럼에 있어 세부 상태를 표시한다 */}
                      {stage.statuses.length > 1 ? (
                        <p className="mt-1.5">
                          <Badge variant="outline">{content.status}</Badge>
                        </p>
                      ) : null}

                      {stage.key === "발행" ? (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-badge">
                            <span className="text-fg-muted">채널 발행</span>
                            <span
                              className={`tnum ${
                                pub.done === pub.total
                                  ? "text-fg-muted"
                                  : "font-semibold text-warn"
                              }`}
                            >
                              {pub.done}/{pub.total}
                            </span>
                          </div>
                          <Meter
                            className="mt-1"
                            value={pub.done}
                            max={pub.total}
                            tone={pub.done === pub.total ? "success" : "warn"}
                          />
                        </div>
                      ) : progress.total > 0 ? (
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
