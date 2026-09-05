"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiBadge, AxHighlight, AxTag } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { Meter } from "@/components/ui/Meter";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";
import type { Content, ShotItem, UploadedPhoto } from "@/data/types";

const UNCLASSIFIED = "미분류";

/**
 * 파일명에서 공간 유형을 추정한다.
 *
 * 실제 시스템은 여기서 LLM 비전으로 이미지를 분류한다.
 * 목업에는 모델이 없으므로 파일명만 본다. 못 알아보면 미분류로 두고
 * 사람이 직접 고르게 한다 — 실제 시스템에서도 사람이 뒤집을 수 있어야 한다.
 *
 * 중요한 건 그 다음이다. 분류 결과와 체크리스트를 대조하는 부분은
 * 배열 비교라서 목업에서도 진짜로 동작한다.
 */
const KEYWORDS: Array<[string, string[]]> = [
  ["수영장 야간", ["poolnight", "pool-night", "pool_night", "수영장야간", "야간수영"]],
  ["야간 전경", ["night", "야간", "야경", "nightview"]],
  ["수영장", ["pool", "수영장", "swim"]],
  ["욕실", ["bath", "욕실", "화장실", "shower", "toilet", "restroom"]],
  ["객실", ["room", "bed", "객실", "침실", "guestroom"]],
  ["외관", ["exterior", "facade", "외관", "front", "outside", "building"]],
  ["로비 · 공용 라운지", ["lobby", "lounge", "로비", "라운지"]],
  ["조식장", ["breakfast", "조식", "dining", "다이닝", "restaurant"]],
  ["바비큐존", ["bbq", "barbecue", "grill", "바비큐", "그릴"]],
  ["스파 · 사우나", ["spa", "sauna", "스파", "사우나", "찜질"]],
  ["반려동물 전용 공간", ["pet", "dog", "반려", "애견"]],
  ["정원 · 테라스", ["garden", "terrace", "patio", "정원", "테라스", "야외"]],
];

function guessLabel(fileName: string, labels: string[]): string {
  const name = fileName.toLowerCase();

  // 체크리스트 항목 이름이 파일명에 그대로 들어 있으면 그것부터
  const direct = labels.find((l) => name.includes(l.toLowerCase()));
  if (direct) return direct;

  for (const [label, words] of KEYWORDS) {
    if (!labels.includes(label)) continue;
    if (words.some((w) => name.includes(w))) return label;
  }
  return UNCLASSIFIED;
}

/** 썸네일을 그릴 최대 장수. 그 이상은 집계만 한다 */
const RENDER_CAP = 60;

export function UploadVerify({ content }: { content: Content }) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(0);

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

  /* ----- 여기가 진짜로 동작하는 부분: 분류 결과 ↔ 체크리스트 대조 ----- */
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of files) map[f.label] = (map[f.label] ?? 0) + 1;
    return map;
  }, [files]);

  const rows = shotList.map((item: ShotItem) => ({
    ...item,
    current: counts[item.label] ?? 0,
  }));
  const required = rows.filter((r) => r.isRequired);
  const met = required.filter((r) => r.current >= r.minCount);
  const missing = required.filter((r) => r.current < r.minCount);
  const unclassified = counts[UNCLASSIFIED] ?? 0;

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
            description="실제 사진을 올려보세요. 파일명으로 공간 유형을 추정하고 체크리스트와 대조합니다."
            right={
              files.length > 0 ? (
                <>
                  <Badge variant="neutral">
                    직접 올린 사진 <span className="tnum">{files.length}</span>장
                  </Badge>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => store.clearUploads(content.id)}
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
                  <span className="text-body font-semibold text-fg">분류 결과</span>
                  <AiBadge label="파일명 기반 추정 (모의)" />
                  <AxTag id="ax-02" align="left" />
                  <InfoTip>
                    실제 시스템은 이 자리에서 LLM 비전으로 이미지를 분류합니다. 목업에는
                    모델이 없어 파일명만 봅니다. 못 알아보면 미분류로 두고 직접 고르게
                    합니다. 오른쪽 체크리스트 대조는 배열 비교라 실제로 동작합니다.
                  </InfoTip>
                  {unclassified > 0 ? (
                    <Badge variant="warn">
                      미분류 <span className="tnum">{unclassified}</span>장 · 직접
                      지정하세요
                    </Badge>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {files.slice(0, RENDER_CAP).map((f) => (
                    <figure key={f.id} className="min-w-0">
                      {/* 방금 고른 로컬 파일이라 next/image 를 쓰지 않는다 */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={f.name}
                        className="aspect-[4/3] w-full rounded-box border border-line object-cover"
                      />
                      <figcaption className="mt-1">
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
                        <span className="mt-px block truncate text-badge text-fg-subtle">
                          {f.name}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>

                {files.length > RENDER_CAP ? (
                  <p className="mt-2 text-badge text-fg-subtle">
                    썸네일은 {RENDER_CAP}장까지만 그립니다. 대조는{" "}
                    <span className="tnum">{files.length}</span>장 전부가 대상입니다.
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
        <AxHighlight id="ax-02">
        <Panel tone={files.length > 0 && missing.length > 0 ? "ai" : "default"}>
          <PanelHeader
            tone={files.length > 0 && missing.length > 0 ? "ai" : "default"}
            title="필수 컷 대조"
            description="올린 사진의 분류 결과와 체크리스트를 맞춰봅니다."
            right={
              <Badge
                variant={files.length > 0 && missing.length === 0 ? "success" : "outline"}
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
                    {missing.map((m) => m.label).join(", ")} — 촬영 현장에서 이 화면을
                    보면 바로 다시 찍을 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="border-b border-line bg-[#E8F2F0] px-4 py-2.5">
                  <p className="text-body font-semibold text-success">
                    필수 컷이 모두 확보됐습니다
                  </p>
                </div>
              )}

              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
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
      </div>
    </div>
  );
}
