"use client";

import { useMemo, useState } from "react";
import { AiBadge, Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";
import { Meter } from "@/components/ui/Meter";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { Toggle } from "@/components/ui/Toggle";
import { TIER_LABEL, type ContentAnalysis } from "@/data/analysis";
import type { Content, Photo } from "@/data/types";

export function UploadTab({
  content,
  analysis,
  photos,
  fieldMode,
}: {
  content: Content;
  analysis: ContentAnalysis;
  photos: Photo[];
  fieldMode: boolean;
}) {
  const [dismissed, setDismissed] = useState<string[]>(analysis.dismissedMissing);
  const [recommendedOnly, setRecommendedOnly] = useState(true);
  const [labelFilter, setLabelFilter] = useState<string>("전체");
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const labels = useMemo(() => {
    const set = new Set(photos.map((p) => overrides[p.id] ?? p.aiLabel));
    return ["전체", ...Array.from(set)];
  }, [photos, overrides]);

  const visible = photos.filter((p) => {
    if (recommendedOnly && !p.selected) return false;
    if (labelFilter !== "전체" && (overrides[p.id] ?? p.aiLabel) !== labelFilter)
      return false;
    return true;
  });

  const openMissing = analysis.missing.filter((m) => !dismissed.includes(m.label));
  const lowConfidence = photos.filter((p) => p.confidence < 0.8).length;

  if (content.status === "촬영예정") {
    return (
      <Panel>
        <div className="p-4 text-body text-fg-muted">
          아직 촬영 전입니다. 촬영일({content.shootDate}) 이후 프리뷰가 업로드되면 AI
          라벨링과 누락 탐지가 실행됩니다.
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* 누락 탐지는 화면 상단에 고정한다. 이 시스템의 1차 목표가 이 패널이다. */}
      <Panel className={openMissing.length ? "border-danger/30" : "border-ai/25"}>
        <PanelHeader
          title={
            openMissing.length ? (
              <span className="text-danger">
                누락 의심 {openMissing.length}건
              </span>
            ) : (
              "누락 의심 없음"
            )
          }
          description={
            fieldMode
              ? "현장 모드 · 프리뷰 업로드 즉시 체크리스트와 대조합니다"
              : "업로드 완료 후 체크리스트와 대조한 결과입니다"
          }
          right={
            <>
              <AiBadge label="AI 결과 (모의)" />
              <InfoTip align="right">
                LLM 비전으로 공간 유형을 라벨링한 뒤 체크리스트와 대조합니다. 대조
                자체는 AI가 아니라 단순 비교입니다. 확인해 주는 건 라벨별 장수까지이고,
                객실 3개에 고르게 퍼졌는지는 판정하지 못합니다.
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
                  ({dismissed.join(", ")} — 담당자가 &ldquo;이미 촬영함&rdquo;으로
                  처리)
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
                      <span className="text-body font-medium text-fg">{m.label}</span>
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
                  <button
                    type="button"
                    onClick={() => setDismissed((prev) => [...prev, m.label])}
                    className="shrink-0 rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge font-medium text-fg-muted transition-colors hover:text-fg"
                  >
                    이미 촬영함
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="업로드" />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between text-body">
              <span className="text-fg-muted">프리뷰 (JPG)</span>
              <span className="tnum font-medium text-fg">
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
            <p className="text-badge leading-[16px] text-fg-subtle">
              브라우저가 스토리지에 직접 올립니다(presigned URL, 동시 4~6개). 파일이
              웹서버를 거치지 않아 중간 실패 시 해당 파일만 재개합니다. 목업에서는
              진행 상태만 표현합니다.
            </p>
          </div>
        </Panel>

        <Panel className="border-ai/25">
          <PanelHeader
            title="AI 셀렉"
            description={`${analysis.total}장 → ${analysis.recommended}장 추천`}
            right={<AiBadge />}
          />
          <ul className="divide-y divide-line">
            {analysis.select.map((row) => (
              <li key={row.reason} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 text-body text-fg">{row.reason}</span>
                <span className="tnum shrink-0 text-body text-fg-muted">
                  {row.count}장
                </span>
                <Badge variant={row.tier === "LLM 비전" ? "ai" : "neutral"}>
                  {TIER_LABEL[row.tier]}
                </Badge>
                <InfoTip align="right">{row.method}</InfoTip>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-surface px-4 py-2">
            <p className="text-badge text-fg-muted">
              처리 순서 = 비용 설계.{" "}
              {analysis.timings.map((t, i) => (
                <span key={t.label} className="tnum">
                  {i > 0 ? " · " : ""}
                  {t.label} {t.value}
                </span>
              ))}
            </p>
            <p className="mt-1 text-badge leading-[16px] text-fg-subtle">
              싼 연산으로 먼저 걸러 LLM에 도달하는 장수를 줄입니다. 800장을 전부 LLM에
              넘기면 비용과 시간이 몇 배가 됩니다. 전달 이미지도 원본이 아니라 축소본
              (긴 변 768px)입니다.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="AI 라벨링 결과"
          description={`확신도 80% 미만 ${lowConfidence}장은 점선으로 표시됩니다. 라벨은 직접 바꿀 수 있습니다.`}
          right={
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
          }
        />

        <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-line px-4 py-2">
          {labels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabelFilter(l)}
              className={`shrink-0 rounded-box border px-2 py-0.5 text-badge transition-colors ${
                labelFilter === l
                  ? "border-line-strong bg-surface font-medium text-fg"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((p) => {
            const label = overrides[p.id] ?? p.aiLabel;
            const low = p.confidence < 0.8;
            return (
              <figure key={p.id} className="min-w-0">
                <div
                  className={`rounded-box ${
                    low ? "border border-dashed border-ai p-0.5" : ""
                  }`}
                >
                  <PhotoBox id={p.id} label={label} />
                </div>
                <figcaption className="mt-1 flex items-center justify-between gap-1">
                  <select
                    aria-label={`${p.id} 라벨`}
                    value={label}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="min-w-0 flex-1 truncate rounded-box border border-transparent bg-transparent py-0.5 text-badge text-fg outline-none hover:border-line focus:border-line-strong"
                  >
                    {labels
                      .filter((l) => l !== "전체")
                      .map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                  </select>
                  <span
                    className={`tnum shrink-0 text-badge ${
                      low ? "font-medium text-ai" : "text-fg-subtle"
                    }`}
                  >
                    {Math.round(p.confidence * 100)}%
                  </span>
                </figcaption>
                {!p.selected ? (
                  <p className="mt-px text-badge text-fg-subtle">
                    제외 · {p.excludeReason}
                  </p>
                ) : null}
                {overrides[p.id] ? (
                  <p className="mt-px text-badge text-fg-muted">사람이 수정함</p>
                ) : null}
              </figure>
            );
          })}
        </div>

        <div className="border-t border-line bg-surface px-4 py-2">
          <p className="text-badge text-fg-subtle">
            목업 렌더링 범위: 추천 컷 48장 + 제외 컷 샘플 24장. 실제 대상은{" "}
            <span className="tnum">{analysis.total}</span>장이며 위 집계 숫자가 전체
            기준입니다.
          </p>
        </div>
      </Panel>
    </div>
  );
}
