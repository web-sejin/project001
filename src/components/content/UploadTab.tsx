"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiBadge, AxNote, TierBadge } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { Meter } from "@/components/ui/Meter";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { Toggle } from "@/components/ui/Toggle";
import type { ContentAnalysis } from "@/data/analysis";
import { TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";
import type { Content, Photo } from "@/data/types";

export function UploadTab({
  content,
  analysis,
  photos,
}: {
  content: Content;
  analysis: ContentAnalysis;
  photos: Photo[];
}) {
  const { axMode } = useStore();
  const [dismissed, setDismissed] = useState<string[]>(analysis.dismissedMissing);
  const [recommendedOnly, setRecommendedOnly] = useState(true);
  const [labelFilter, setLabelFilter] = useState("전체");

  const labels = useMemo(
    () => ["전체", ...Array.from(new Set(photos.map((p) => p.aiLabel)))],
    [photos],
  );

  const openMissing = analysis.missing.filter((m) => !dismissed.includes(m.label));
  const lowConfidence = photos.filter((p) => p.confidence < 0.8).length;

  if (content.status === "촬영예정") {
    return <PreviewUpload content={content} />;
  }

  const visible = photos.filter((p) => {
    if (!axMode) return true;
    if (recommendedOnly && !p.selected) return false;
    if (labelFilter !== "전체" && p.aiLabel !== labelFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 누락 탐지는 AI가 만들어낸 신호라 AX 토글에 묶는다 */}
      {axMode ? (
        <Panel tone="ai">
          <PanelHeader
            tone="ai"
            title={
              openMissing.length ? (
                <span className="text-danger">누락 의심 {openMissing.length}건</span>
              ) : (
                "누락 의심 없음"
              )
            }
            description="업로드된 사진을 공간 유형으로 분류해 체크리스트와 대조한 결과입니다."
            right={
              <>
                <AiBadge />
                <InfoTip align="right">
                  분류는 LLM 비전, 대조는 배열 비교입니다. 확인해 주는 건 라벨별
                  장수까지이고, 객실 여러 개에 고르게 퍼졌는지는 판정하지 못합니다.
                </InfoTip>
              </>
            }
          />
          <div className="p-4">
            {openMissing.length === 0 ? (
              <p className="text-body text-fg-muted">
                필수 컷이 모두 확보됐습니다.
                {dismissed.length > 0 ? (
                  <span className="text-fg-subtle">
                    {" "}
                    ({dismissed.join(", ")} — 담당자가 이미 촬영함으로 처리)
                  </span>
                ) : null}
              </p>
            ) : (
              <ul className="space-y-2">
                {openMissing.map((m) => (
                  <li
                    key={m.label}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-box border border-line bg-surface px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-body font-semibold text-fg">
                          {m.label}
                        </span>
                        <span className="tnum text-body text-fg-muted">
                          {m.found}장 / 필요 {m.required}장
                        </span>
                        {m.confidence === "high" ? (
                          <Badge variant="danger">확신도 높음</Badge>
                        ) : (
                          <Badge variant="warn">확신도 낮음 · 확인 필요</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-badge leading-[16px] text-fg-muted">
                        {m.reason}
                      </p>
                    </div>
                    {/* 사람이 AI 판단을 뒤집는 버튼은 항상 있어야 한다 */}
                    <Button
                      size="sm"
                      onClick={() => setDismissed((prev) => [...prev, m.label])}
                    >
                      이미 촬영함
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="업로드" />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between text-body">
              <span className="text-fg-muted">프리뷰 (JPG)</span>
              <span className="tnum font-semibold text-fg">
                {analysis.uploaded} / {analysis.total} 완료
              </span>
            </div>
            <Meter
              value={analysis.uploaded}
              max={analysis.total}
              tone={analysis.rawPending ? "ai" : "success"}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {analysis.rawPending ? (
                <>
                  <Badge variant="ai">프리뷰 업로드 중</Badge>
                  <Badge variant="neutral">원본(RAW) 대기중</Badge>
                </>
              ) : (
                <>
                  <Badge variant="success">프리뷰 업로드 완료</Badge>
                  <Badge variant="success">원본(RAW) 수신 완료</Badge>
                </>
              )}
            </div>
          </div>
        </Panel>

        {axMode ? (
          <Panel tone="ai">
            <PanelHeader
              tone="ai"
              title="셀렉 후보"
              description={`${analysis.total}장 → ${analysis.recommended}장`}
              right={<AiBadge />}
            />
            <ul className="divide-y divide-line">
              {analysis.select.map((row) => (
                <li key={row.reason} className="flex items-center gap-2 px-4 py-2">
                  <span className="min-w-0 flex-1 text-body text-fg">{row.reason}</span>
                  <span className="tnum shrink-0 text-body text-fg-muted">
                    {row.count}장
                  </span>
                  <TierBadge tier={row.tier} />
                  <InfoTip align="right">{row.method}</InfoTip>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-surface px-4 py-2">
              <p className="text-badge text-fg-muted">
                {analysis.timings.map((t, i) => (
                  <span key={t.label} className="tnum">
                    {i > 0 ? " · " : ""}
                    {t.label} {t.value}
                  </span>
                ))}
              </p>
            </div>
          </Panel>
        ) : null}
      </div>

      {axMode ? <AxNote id="ax-03" /> : null}

      <Panel tone={axMode ? "ai" : "default"}>
        <PanelHeader
          tone={axMode ? "ai" : "default"}
          title={axMode ? "분류 결과" : "업로드된 사진"}
          description={
            axMode
              ? `확신도 80% 미만 ${lowConfidence}장은 점선으로 표시됩니다.`
              : "촬영 원본 파일 목록입니다."
          }
          right={
            axMode ? (
              <>
                <AiBadge />
                <label className="flex items-center gap-1.5 text-body text-fg-muted">
                  추천만 보기
                  <Toggle
                    id="recommended-only"
                    label="추천만 보기"
                    checked={recommendedOnly}
                    onChange={setRecommendedOnly}
                  />
                </label>
              </>
            ) : null
          }
        />

        {axMode ? (
          <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-line px-4 py-2">
            {labels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabelFilter(l)}
                className={`shrink-0 rounded-box border px-2 py-0.5 text-badge ${
                  labelFilter === l
                    ? "border-ai bg-ai-bg font-semibold text-ai"
                    : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((p) => {
            const low = p.confidence < 0.8;
            return (
              <figure key={p.id} className="min-w-0">
                <div
                  className={`rounded-box ${
                    axMode && low ? "border border-dashed border-ai p-0.5" : ""
                  }`}
                >
                  <PhotoBox
                    id={p.id}
                    label={axMode ? p.aiLabel : p.rawPath.split("/")[1]}
                  />
                </div>
                {axMode ? (
                  <figcaption className="mt-1 flex items-center justify-between gap-1">
                    <span className="min-w-0 truncate text-badge font-medium text-ai">
                      {p.aiLabel}
                    </span>
                    <span
                      className={`tnum shrink-0 text-badge ${
                        low ? "font-semibold text-ai" : "text-fg-subtle"
                      }`}
                    >
                      {Math.round(p.confidence * 100)}%
                    </span>
                  </figcaption>
                ) : (
                  <figcaption className="mt-1 truncate text-badge text-fg-subtle">
                    {p.rawPath.split("/")[1]}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>

        <div className="border-t border-line bg-surface px-4 py-2">
          <p className="text-badge text-fg-subtle">
            목업 렌더링 범위: 추천 48장 + 제외 샘플 24장. 실제 대상은{" "}
            <span className="tnum">{analysis.total}</span>장이며 위 집계는 전체
            기준입니다.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/**
 * 업로드 진입점.
 *
 * 실제 파일 전송은 구현하지 않는다. 서버도 스토리지도 없다.
 * 다만 사진이 시스템에 들어오는 자리가 없으면 흐름이 끊긴다.
 * 파일을 고르면 그 장수를 총량으로 잡고 상태 전이까지 재현한다.
 */
function PreviewUpload({ content }: { content: Content }) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [done, setDone] = useState(0);

  const total = picked ?? 800;

  useEffect(() => {
    if (phase !== "uploading" || done >= total) return;
    const t = setTimeout(() => {
      const next = Math.min(total, done + Math.ceil(total / 18));
      setDone(next);
      if (next >= total) setPhase("analyzing");
    }, 90);
    return () => clearTimeout(t);
  }, [phase, done, total]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const t = setTimeout(
      () =>
        store.updateContent(content.id, {
          status: "촬영완료",
          statusChangedAt: TODAY,
          stuckDays: 0,
        }),
      1400,
    );
    return () => clearTimeout(t);
  }, [phase, store, content.id]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel>
        <PanelHeader
          title="사진 업로드"
          description="촬영이 끝나면 카드에서 JPG를 복사해 올립니다. 원본 RAW는 복귀 후 올립니다."
        />
        <div className="p-4">
          {phase === "idle" ? (
            <>
              <div className="rounded-box border border-dashed border-line-strong bg-surface px-4 py-8 text-center">
                <p className="text-body font-semibold text-fg">
                  파일을 끌어다 놓거나 선택하세요
                </p>
                <p className="mt-1 text-badge text-fg-muted">
                  JPG · 한 건당 보통 700~900장
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPicked(e.target.files?.length ?? null)}
                />
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={() => inputRef.current?.click()}>파일 선택</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setDone(0);
                      setPhase("uploading");
                    }}
                  >
                    {picked ? `${picked}장 업로드` : "샘플 800장으로 업로드"}
                  </Button>
                </div>
                {picked ? (
                  <p className="mt-2 text-badge text-fg-muted">
                    <span className="tnum">{picked}</span>장 선택됨
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-badge leading-[16px] text-fg-muted">
                목업이라 파일이 실제로 전송되지는 않습니다. 고른 장수만 읽어서 이후
                흐름(업로드 → 상태 전환 → 분류)을 재현합니다.
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-body">
                <span className="text-fg-muted">
                  {phase === "uploading" ? "업로드 중" : "분류 중"}
                </span>
                <span className="tnum font-semibold text-fg">
                  {done} / {total}
                </span>
              </div>
              <Meter value={done} max={total} tone="ai" />
            </div>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <PanelHeader title="업로드 후" />
          <ol className="divide-y divide-line text-body">
            <li className="px-4 py-2.5">
              <span className="font-semibold text-fg">상태가 촬영완료로 바뀝니다</span>
              <span className="mt-px block text-badge text-fg-muted">
                현황판 보드에서 칼럼이 이동합니다
              </span>
            </li>
            <li className="px-4 py-2.5">
              <span className="font-semibold text-fg">체크리스트와 대조합니다</span>
              <span className="mt-px block text-badge text-fg-muted">
                빠진 공간이 있으면 경고가 뜹니다
              </span>
            </li>
          </ol>
        </Panel>

        <AxNote id="ax-02" />
      </div>
    </div>
  );
}
