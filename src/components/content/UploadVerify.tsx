"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiBadge, AxHighlight, AxTag, TierBadge } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { Meter } from "@/components/ui/Meter";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Toggle } from "@/components/ui/Toggle";
import {
  judgeSelection,
  measureImage,
  type ImageMetrics,
  type SelectVerdict,
} from "@/lib/imageMetrics";
import { LabelTabs, buildLabelTabs } from "./LabelTabs";
import { UNCLASSIFIED, countByLabel, guessLabel } from "@/lib/photoLabel";
import { TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";
import type { Content, ShotItem, UploadedPhoto } from "@/data/types";

const RENDER_CAP = 60;

export function UploadVerify({ content }: { content: Content }) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(0);
  const [metrics, setMetrics] = useState<Record<string, ImageMetrics>>({});
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [labelTab, setLabelTab] = useState("전체");

  const axMode = store.axMode;
  const files = store.uploadsOf(content.id);
  const shotList = store.shotListOf(content.accommodationId);
  const labels = useMemo(() => shotList.map((s) => s.label), [shotList]);
  const beforeShoot = content.status === "촬영예정";

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const added: UploadedPhoto[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((f, i) => ({
        id: `${content.id}-${Date.now()}-${i}`,
        contentId: content.id,
        name: f.name,
        url: URL.createObjectURL(f),
        label: guessLabel(f.name, labels),
      }));
    store.addUploads(content.id, added);
  };

  /* ---- 1층: 순수 연산. 브라우저 캔버스에서 실제로 측정한다 ---- */
  useEffect(() => {
    const pending = files.filter((f) => !metrics[f.id]);
    if (pending.length === 0) return;
    let cancelled = false;

    (async () => {
      const started = performance.now();
      const next: Record<string, ImageMetrics> = {};
      for (const f of pending) {
        try {
          next[f.id] = await measureImage(f.url);
        } catch {
          // 읽을 수 없는 파일은 건너뛴다
        }
      }
      if (cancelled) return;
      setMetrics((prev) => ({ ...prev, ...next }));
      setElapsed(Math.round(performance.now() - started));
    })();

    return () => {
      cancelled = true;
    };
  }, [files, metrics]);

  const verdicts: Record<string, SelectVerdict> = useMemo(() => {
    const measured = files
      .filter((f) => metrics[f.id])
      .map((f) => ({ id: f.id, metrics: metrics[f.id] }));
    return judgeSelection(measured);
  }, [files, metrics]);

  const analyzing = files.some((f) => !metrics[f.id]);
  const excludedBy = (reason: string) =>
    files.filter((f) => verdicts[f.id]?.reason === reason).length;
  const recommended = files.filter((f) => verdicts[f.id]?.reason == null);

  /* ---- 대조: 라벨별 장수를 세서 체크리스트의 필요 수량과 견준다 ---- */
  const counts = useMemo(() => countByLabel(recommended), [recommended]);
  // 탭에는 제외된 컷까지 포함한 전체 분포를 보여준다
  const allCounts = useMemo(() => countByLabel(files), [files]);

  const rows = shotList.map((item: ShotItem) => ({
    ...item,
    current: counts[item.label] ?? 0,
  }));
  const required = rows.filter((r) => r.isRequired);
  const met = required.filter((r) => r.current >= r.minCount);
  const missing = required.filter((r) => r.current < r.minCount);
  const unclassified = counts[UNCLASSIFIED] ?? 0;

  const tabs = buildLabelTabs(shotList, allCounts);
  const visible = files.filter((f) => {
    if (recommendedOnly && verdicts[f.id]?.reason != null) return false;
    if (labelTab !== "전체" && f.label !== labelTab) return false;
    return true;
  });

  // 샘플 시뮬레이션 (올릴 사진이 없을 때 흐름만 보기 위한 경로)
  useEffect(() => {
    if (!simulating || simDone >= 800) return;
    const t = setTimeout(() => {
      const next = Math.min(800, simDone + 45);
      setSimDone(next);
      if (next >= 800) {
        setSimulating(false);
        store.updateContent(content.id, {
          status: "촬영완료",
          statusChangedAt: TODAY,
          stuckDays: 0,
        });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [simulating, simDone, store, content.id]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Panel>
          <PanelHeader
            title="사진 업로드"
            description="실제 사진을 올려보세요. 품질 측정과 체크리스트 대조가 브라우저에서 바로 돌아갑니다."
            right={
              files.length > 0 ? (
                <>
                  <Badge variant="neutral">
                    올린 사진 <span className="tnum">{files.length}</span>장
                  </Badge>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      store.clearUploads(content.id);
                      setMetrics({});
                      setElapsed(null);
                    }}
                  >
                    비우기
                  </Button>
                </>
              ) : null
            }
          />

          <div className="p-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`rounded-box border border-dashed px-4 py-6 text-center transition-colors ${
                dragOver ? "border-ai bg-ai-bg" : "border-line-strong bg-surface"
              }`}
            >
              <p className="text-body font-semibold text-fg">
                사진을 여기에 끌어다 놓으세요
              </p>
              <p className="mt-1 text-badge text-fg-muted">
                파일명에 <span className="text-fg">욕실</span> ·{" "}
                <span className="text-fg">bbq</span> ·{" "}
                <span className="text-fg">pool</span> 같은 단어가 있으면 자동으로
                분류됩니다
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="mt-3">
                <Button variant="primary" onClick={() => inputRef.current?.click()}>
                  파일 선택
                </Button>
              </div>
            </div>

            {files.length > 0 ? (
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-body font-semibold text-fg">
                    {axMode ? "분류 결과" : "올린 사진"}
                  </span>
                  {axMode ? <AiBadge label="파일명 기반 추정 (모의)" /> : null}
                  {axMode ? <AxTag id="ax-02" align="left" /> : null}
                  {axMode ? (
                  <InfoTip>
                    실제 시스템은 이 자리에서 LLM 비전으로 이미지를 분류합니다. 목업에는
                    모델이 없어 파일명만 봅니다. 못 알아보면 미분류로 두고 직접 고르게
                    합니다.
                  </InfoTip>
                  ) : null}
                  {axMode && unclassified > 0 ? (
                    <Badge variant="warn">
                      미분류 <span className="tnum">{unclassified}</span>장
                    </Badge>
                  ) : null}
                  {axMode ? (
                  <label className="ml-auto flex items-center gap-1.5 text-body text-fg-muted">
                    추천만 보기
                    <Toggle
                      id="upload-recommended-only"
                      label="추천만 보기"
                      checked={recommendedOnly}
                      onChange={setRecommendedOnly}
                    />
                  </label>
                  ) : null}
                </div>

                {axMode ? (
                  <div className="mb-2">
                    <LabelTabs
                      tabs={tabs}
                      total={files.length}
                      active={labelTab}
                      onChange={setLabelTab}
                    />
                    <p className="mt-1.5 text-badge text-fg-subtle">
                      이 숙소가 찍어야 하는 공간 전부를 늘어놓습니다. 0장인 항목이
                      곧 아직 못 찍은 컷입니다.
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {visible.slice(0, RENDER_CAP).map((f) => {
                    const v = verdicts[f.id];
                    const excluded = axMode && Boolean(v?.reason);
                    return (
                      <figure key={f.id} className="min-w-0">
                        <div className="relative">
                          {/* 방금 고른 로컬 파일이라 next/image 를 쓰지 않는다 */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.url}
                            alt={f.name}
                            className={`aspect-[4/3] w-full rounded-box border border-line object-cover ${
                              excluded ? "opacity-40 grayscale" : ""
                            }`}
                          />
                          {excluded ? (
                            <span className="absolute top-1 left-1 rounded-box bg-fg/85 px-1.5 py-0.5 text-badge font-semibold text-white">
                              {v.reason}
                            </span>
                          ) : null}
                        </div>
                        <figcaption className="mt-1">
                          {axMode ? (
                          <select
                            value={f.label}
                            onChange={(e) =>
                              store.setUploadLabel(content.id, f.id, e.target.value)
                            }
                            aria-label={`${f.name} 분류`}
                            className={`w-full truncate rounded-box border bg-canvas px-1 py-0.5 text-badge outline-none focus:border-ai ${
                              f.label === UNCLASSIFIED
                                ? "border-warn text-warn"
                                : "border-line text-ai"
                            }`}
                          >
                            <option value={UNCLASSIFIED}>{UNCLASSIFIED}</option>
                            {labels.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                          ) : null}
                          <span className="mt-px block truncate text-badge text-fg-subtle">
                            {axMode && metrics[f.id]
                              ? `${f.name} · 선명도 ${Math.round(metrics[f.id].sharpness)}`
                              : f.name}
                          </span>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>

                {visible.length > RENDER_CAP ? (
                  <p className="mt-2 text-badge text-fg-subtle">
                    썸네일은 {RENDER_CAP}장까지만 그립니다.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {files.length === 0 ? (
            <div className="border-t border-line bg-surface px-4 py-2.5">
              {simulating || simDone > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-badge text-fg-muted">
                    <span>샘플 업로드 중</span>
                    <span className="tnum">{simDone} / 800</span>
                  </div>
                  <Meter value={simDone} max={800} tone="ai" />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-badge text-fg-muted">
                    올릴 사진이 없으면 샘플 800장으로 흐름만 볼 수 있습니다.
                  </p>
                  <Button size="sm" onClick={() => setSimulating(true)}>
                    샘플 800장으로 진행
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="space-y-4">
        {axMode && files.length > 0 ? (
          <AxHighlight id="ax-03">
            <Panel tone="ai">
              <PanelHeader
                tone="ai"
                title="셀렉 후보"
                description={
                  analyzing
                    ? "품질을 측정하는 중입니다"
                    : `${files.length}장 → ${recommended.length}장`
                }
                right={<Badge variant="outline">순수 연산</Badge>}
              />
              <ul className="divide-y divide-line">
                <SelectRow
                  reason="흔들림"
                  count={excludedBy("흔들림")}
                  method="라플라시안 커널로 엣지 선명도를 재고, 같은 촬영 건 안에서 중앙값의 35% 아래면 제외합니다. 절대값 기준은 피사체와 렌즈에 따라 편차가 커서 상대 비교가 안정적입니다."
                />
                <SelectRow
                  reason="노출 오류"
                  count={excludedBy("노출 오류")}
                  method="히스토그램에서 하이라이트가 날아갔거나 암부가 뭉갠 픽셀 비율을 셉니다."
                />
                <SelectRow
                  reason="중복 · 유사 컷"
                  count={excludedBy("중복")}
                  method="지각 해시(dHash) 64비트의 해밍 거리가 8 이하면 같은 장면으로 보고, 그룹에서 가장 선명한 컷만 남깁니다. 실제 시스템은 CLIP 계열 임베딩을 쓰는 편이 정확하지만 원리는 같고 어느 쪽도 LLM을 부르지 않습니다."
                />
                <li className="flex items-center gap-2 bg-ai-bg px-4 py-2">
                  <span className="min-w-0 flex-1 text-body font-semibold text-fg">
                    LLM이 볼 대상
                  </span>
                  <span className="tnum shrink-0 text-body font-semibold text-ai">
                    {recommended.length}장
                  </span>
                  <TierBadge tier="LLM 비전" />
                </li>
              </ul>
              <div className="border-t border-line bg-surface px-4 py-2.5">
                <p className="text-badge leading-[16px] text-fg-muted">
                  {analyzing ? (
                    "측정 중…"
                  ) : (
                    <>
                      <span className="tnum font-semibold text-fg">{files.length}</span>
                      장 측정에{" "}
                      <span className="tnum font-semibold text-fg">{elapsed}ms</span>{" "}
                      걸렸습니다. 브라우저에서 잰 실제 시간입니다. 이 단계는 모델이
                      없어도 되고, 그래서 LLM에 넘길 장수를 먼저 줄입니다.
                    </>
                  )}
                </p>
              </div>
            </Panel>
          </AxHighlight>
        ) : null}

        {axMode ? (
        <AxHighlight id="ax-02">
          <Panel tone={files.length > 0 && missing.length > 0 ? "ai" : "default"}>
            <PanelHeader
              tone={files.length > 0 && missing.length > 0 ? "ai" : "default"}
              title="필수 컷 대조"
              description="셀렉을 통과한 컷만 세서 체크리스트와 맞춰봅니다."
              right={
                <Badge
                  variant={
                    files.length > 0 && missing.length === 0 ? "success" : "outline"
                  }
                >
                  <span className="tnum">
                    {met.length}/{required.length}
                  </span>
                  {" 충족"}
                </Badge>
              }
            />

            {files.length === 0 ? (
              <p className="p-4 text-body text-fg-muted">
                사진을 올리면 어떤 컷이 빠졌는지 여기에 바로 표시됩니다.
              </p>
            ) : (
              <>
                {missing.length > 0 ? (
                  <div className="border-b border-line bg-[#FBEAEA] px-4 py-2.5">
                    <p className="text-body font-semibold text-danger">
                      누락 {missing.length}건
                    </p>
                    <p className="mt-1 text-badge leading-[16px] text-fg-muted">
                      {missing.map((m) => m.label).join(", ")} — 편집에 들어가기 전에
                      알 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <div className="border-b border-line bg-[#E8F2F0] px-4 py-2.5">
                    <p className="text-body font-semibold text-success">
                      필수 컷이 모두 확보됐습니다
                    </p>
                  </div>
                )}

                <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
                  {rows.map((row) => {
                    const ok = row.current >= row.minCount;
                    return (
                      <li key={row.id} className="flex items-center gap-2.5 px-4 py-1.5">
                        <span
                          aria-hidden
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-box border text-[10px] leading-none ${
                            ok
                              ? "border-[#B9D9D3] bg-[#E8F2F0] text-success"
                              : row.isRequired
                                ? "border-[#EFC2C1] bg-[#FBEAEA] text-danger"
                                : "border-line text-fg-subtle"
                          }`}
                        >
                          {ok ? "✓" : row.isRequired ? "✗" : "–"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-body text-fg">
                          {row.label}
                          {!row.isRequired ? (
                            <span className="ml-1.5 text-badge text-fg-subtle">권장</span>
                          ) : null}
                        </span>
                        <span
                          className={`tnum shrink-0 text-body ${
                            ok
                              ? "text-fg-muted"
                              : row.isRequired
                                ? "font-semibold text-danger"
                                : "text-fg-subtle"
                          }`}
                        >
                          {row.current} / {row.minCount}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-line p-4">
                  {beforeShoot ? (
                    <>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() =>
                          store.updateContent(content.id, {
                            status: "촬영완료",
                            statusChangedAt: TODAY,
                            stuckDays: 0,
                          })
                        }
                      >
                        촬영 완료로 처리
                      </Button>
                      <p className="mt-2 text-badge leading-[16px] text-fg-subtle">
                        누락이 있어도 처리할 수 있습니다. 시스템은 알려줄 뿐 막지
                        않습니다.
                      </p>
                    </>
                  ) : (
                    <p className="text-badge leading-[16px] text-fg-muted">
                      직접 올린 사진 <span className="tnum">{files.length}</span>장을
                      기준으로 계산한 결과입니다. 비우면 샘플 데이터 화면으로 돌아갑니다.
                    </p>
                  )}
                </div>
              </>
            )}
          </Panel>
        </AxHighlight>
        ) : (
          <Panel>
            <PanelHeader title="촬영 정보" />
            <dl className="divide-y divide-line text-body">
              <div className="flex gap-3 px-4 py-2">
                <dt className="w-16 shrink-0 text-fg-subtle">촬영일</dt>
                <dd className="flex-1 text-fg">{content.shootDate}</dd>
              </div>
              <div className="flex gap-3 px-4 py-2">
                <dt className="w-16 shrink-0 text-fg-subtle">작가</dt>
                <dd className="flex-1 text-fg">{content.photographer}</dd>
              </div>
              <div className="flex gap-3 px-4 py-2">
                <dt className="w-16 shrink-0 text-fg-subtle">올린 사진</dt>
                <dd className="tnum flex-1 text-fg">{files.length}장</dd>
              </div>
            </dl>
            {beforeShoot ? (
              <div className="border-t border-line p-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() =>
                    store.updateContent(content.id, {
                      status: "촬영완료",
                      statusChangedAt: TODAY,
                      stuckDays: 0,
                    })
                  }
                >
                  촬영 완료로 처리
                </Button>
              </div>
            ) : null}
          </Panel>
        )}
      </div>
    </div>
  );
}

function SelectRow({
  reason,
  count,
  method,
}: {
  reason: string;
  count: number;
  method: string;
}) {
  return (
    <li className="flex items-center gap-2 px-4 py-2">
      <span className="min-w-0 flex-1 text-body text-fg">{reason}</span>
      <span
        className={`tnum shrink-0 text-body ${
          count > 0 ? "font-semibold text-fg" : "text-fg-subtle"
        }`}
      >
        {count}장 제외
      </span>
      <TierBadge tier="연산" />
      <InfoTip align="right">{method}</InfoTip>
    </li>
  );
}
