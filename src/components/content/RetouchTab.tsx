"use client";

import { useMemo, useState } from "react";
import { AiBadge, Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { ApprovalBadge } from "@/components/StatusBadge";
import { CompareView, type Pin } from "./CompareView";
import { ToneChart } from "./ToneChart";
import type { ContentAnalysis } from "@/data/analysis";
import type { ApprovalStatus, Content, Photo, ReviewFlag } from "@/data/types";

const FLOW = [
  { label: "보정 의뢰", external: false },
  { label: "리터처 배정", external: false },
  { label: "원본 다운로드", external: false },
  { label: "Lightroom · Photoshop", external: true },
  { label: "결과 업로드", external: false },
  { label: "AI 1차 검수", external: false },
  { label: "사람 2차 검수", external: false },
  { label: "승인 · 반려", external: false },
];

type Filter = "전체" | "플래그" | "대기" | "반려" | "승인";

export function RetouchTab({
  content,
  analysis,
  photos,
}: {
  content: Content;
  analysis: ContentAnalysis;
  photos: Photo[];
}) {
  const pool = useMemo(() => photos.filter((p) => p.selected), [photos]);

  const [approvals, setApprovals] = useState<Record<string, ApprovalStatus>>({});
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [pins, setPins] = useState<Record<string, Pin[]>>({});
  const [pinMode, setPinMode] = useState(false);
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState<Filter>("전체");
  const [selectedId, setSelectedId] = useState<string | null>(pool[0]?.id ?? null);
  const [dueDate, setDueDate] = useState("2026-09-08");

  const statusOf = (p: Photo): ApprovalStatus => approvals[p.id] ?? p.approvalStatus;

  const flagCounts = useMemo(() => {
    const map = new Map<ReviewFlag, number>();
    for (const p of pool) {
      for (const f of p.reviewFlags) map.set(f, (map.get(f) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [pool]);

  const visible = pool.filter((p) => {
    if (filter === "플래그") return p.reviewFlags.length > 0;
    if (filter === "전체") return true;
    return statusOf(p) === filter;
  });

  const selected = pool.find((p) => p.id === selectedId) ?? null;
  const counts = {
    승인: pool.filter((p) => statusOf(p) === "승인").length,
    반려: pool.filter((p) => statusOf(p) === "반려").length,
    대기: pool.filter((p) => statusOf(p) === "대기").length,
  };

  if (content.status === "촬영예정" || content.status === "촬영완료") {
    return (
      <Panel>
        <div className="p-4 text-body text-fg-muted">
          아직 보정 단계가 아닙니다. 셀렉이 확정되면 리터처를 배정하고 원본을
          전달합니다.
        </div>
      </Panel>
    );
  }

  const addPin = (x: number, y: number) => {
    if (!selected) return;
    setPins((prev) => {
      const list = prev[selected.id] ?? [];
      return {
        ...prev,
        [selected.id]: [
          ...list,
          { id: `${selected.id}-pin-${list.length + 1}`, x, y, text: "" },
        ],
      };
    });
  };

  const reject = () => {
    if (!selected || !reason.trim()) return;
    setApprovals((prev) => ({ ...prev, [selected.id]: "반려" }));
    setHistory((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), reason.trim()],
    }));
    setReason("");
    setPinMode(false);
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="보정 흐름"
          description="보정 작업 자체는 시스템 밖(라이트룸)에서 일어납니다. 시스템은 배정·전달·검수·이력만 관리합니다."
        />
        <div className="thin-scroll flex items-center gap-1 overflow-x-auto p-4">
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex shrink-0 items-center gap-1">
              <span
                className={`rounded-box border px-2 py-1 text-badge ${
                  step.external
                    ? "border-dashed border-line-strong bg-surface text-fg-subtle"
                    : "border-line bg-canvas text-fg-muted"
                }`}
              >
                {step.label}
                {step.external ? (
                  <span className="ml-1 text-fg-subtle">외부</span>
                ) : null}
              </span>
              {i < FLOW.length - 1 ? (
                <span aria-hidden className="text-fg-subtle">
                  ›
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="리터처 배정" />
          <dl className="divide-y divide-line text-body">
            <Row label="담당자" value={content.retoucher ?? "미배정"} />
            {analysis.coRetoucher ? (
              <Row label="공동 작업" value={analysis.coRetoucher} />
            ) : null}
            <Row label="배정일시" value={`${content.statusChangedAt} 10:24`} />
            <div className="flex items-center gap-3 px-4 py-2">
              <dt className="w-16 shrink-0 text-fg-subtle">마감일</dt>
              <dd className="flex-1">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="tnum rounded-box border border-line px-1.5 py-0.5 text-body text-fg outline-none focus:border-line-strong"
                />
              </dd>
            </div>
            <Row
              label="정체"
              value={
                content.stuckDays >= 7 ? (
                  <span className="text-danger">
                    {content.stuckDays}일 경과 · 마감 초과
                  </span>
                ) : (
                  `${content.stuckDays}일 경과`
                )
              }
            />
          </dl>
          <div className="border-t border-line px-4 py-2">
            <p className="text-badge leading-[16px] text-fg-subtle">
              배정 시점이 기록돼야 정체 일수가 계산됩니다. 대시보드의 병목 숫자는 이
              타임스탬프를 집계한 결과입니다.
            </p>
          </div>
        </Panel>

        <Panel className="border-ai/25">
          <PanelHeader
            title="AI 1차 검수"
            description="사람이 볼 대상을 좁혀 줄 뿐, 승인 판단은 하지 않습니다."
            right={<AiBadge />}
          />
          <ul className="divide-y divide-line">
            {flagCounts.length === 0 ? (
              <li className="px-4 py-2 text-body text-fg-muted">
                플래그된 컷이 없습니다.
              </li>
            ) : (
              flagCounts.map(([flag, count]) => (
                <li key={flag} className="flex items-center gap-2 px-4 py-2">
                  <span className="min-w-0 flex-1 text-body text-fg">{flag}</span>
                  <span className="tnum text-body text-fg-muted">{count}장</span>
                  <InfoTip align="right">{FLAG_METHOD[flag]}</InfoTip>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-line px-4 py-2">
            <button
              type="button"
              onClick={() => setFilter(filter === "플래그" ? "전체" : "플래그")}
              className={`rounded-box border px-2 py-1 text-badge font-medium transition-colors ${
                filter === "플래그"
                  ? "border-ai bg-ai-bg text-ai"
                  : "border-line-strong text-fg-muted hover:text-fg"
              }`}
            >
              플래그된 사진만 보기
            </button>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="보정 톤 일관성"
            right={<Badge variant="neutral">연산</Badge>}
            description="RGB 평균 비교. AI가 아닙니다."
          />
          <div className="p-4">
            <ToneChart photos={pool} />
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="검수"
          description="사진 단위로 승인·반려합니다. 일괄 승인 버튼은 두지 않았습니다."
          right={
            <>
              <Badge variant="success">
                승인 <span className="tnum">{counts.승인}</span>
              </Badge>
              <Badge variant="danger">
                반려 <span className="tnum">{counts.반려}</span>
              </Badge>
              <Badge variant="neutral">
                대기 <span className="tnum">{counts.대기}</span>
              </Badge>
            </>
          }
        />

        <div className="flex flex-wrap gap-1 border-b border-line px-4 py-2">
          {(["전체", "플래그", "대기", "반려", "승인"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-box border px-2 py-0.5 text-badge transition-colors ${
                filter === f
                  ? "border-line-strong bg-surface font-medium text-fg"
                  : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {visible.map((p) => {
              const st = statusOf(p);
              const isSel = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setReason("");
                  }}
                  className={`min-w-0 rounded-box p-0.5 text-left ${
                    isSel ? "bg-line" : ""
                  }`}
                >
                  <PhotoBox
                    id={p.id}
                    label={p.aiLabel}
                    variant={st === "승인" ? "retouched" : "raw"}
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <ApprovalBadge status={st} />
                    {p.reviewFlags.length > 0 ? (
                      <span className="shrink-0 text-badge text-warn">●</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {visible.length === 0 ? (
              <p className="col-span-full py-4 text-body text-fg-muted">
                조건에 맞는 사진이 없습니다.
              </p>
            ) : null}
          </div>

          {selected ? (
            <div className="rounded-box border border-line">
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <span className="truncate text-body font-medium text-fg">
                  {selected.aiLabel}
                </span>
                <span className="tnum shrink-0 text-badge text-fg-subtle">
                  {selected.id}
                </span>
              </div>

              <div className="space-y-3 p-3">
                <CompareView
                  photoId={selected.id}
                  label={selected.aiLabel}
                  pins={pins[selected.id] ?? []}
                  onAddPin={addPin}
                  pinMode={pinMode}
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  {selected.reviewFlags.map((f) => (
                    <Badge key={f} variant="warn">
                      {f}
                    </Badge>
                  ))}
                  <Badge variant="neutral">
                    <span className="tnum">{selected.colorTempK}K</span>
                  </Badge>
                  {selected.retoucher ? (
                    <Badge variant="neutral">{selected.retoucher}</Badge>
                  ) : null}
                </div>

                {[...(selected.rejectHistory.map((r) => r.reason) ?? []), ...(history[selected.id] ?? [])].length > 0 ? (
                  <div className="rounded-box border border-line bg-surface p-2.5">
                    <p className="text-badge font-medium text-fg-muted">
                      반려 이력{" "}
                      <span className="tnum">
                        {selected.rejectHistory.length + (history[selected.id]?.length ?? 0)}
                      </span>
                      회
                    </p>
                    <ol className="mt-1 space-y-1">
                      {selected.rejectHistory.map((r) => (
                        <li key={r.round} className="text-badge leading-[16px] text-fg-muted">
                          <span className="text-fg-subtle tnum">
                            {r.round}차 · {r.at} · {r.by}
                          </span>
                          <br />
                          {r.reason}
                        </li>
                      ))}
                      {(history[selected.id] ?? []).map((r, i) => (
                        <li
                          key={`new-${i}`}
                          className="text-badge leading-[16px] text-fg-muted"
                        >
                          <span className="text-fg-subtle tnum">
                            {selected.rejectHistory.length + i + 1}차 · 방금 · 나
                          </span>
                          <br />
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="reject-reason"
                      className="text-badge font-medium text-fg-muted"
                    >
                      반려 사유 (필수)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPinMode(!pinMode)}
                      className={`rounded-box border px-1.5 py-0.5 text-badge transition-colors ${
                        pinMode
                          ? "border-danger bg-[#FBEBEB] text-danger"
                          : "border-line-strong text-fg-muted hover:text-fg"
                      }`}
                    >
                      {pinMode ? "핀 찍는 중 · 사진 클릭" : "핀 코멘트"}
                    </button>
                  </div>
                  <textarea
                    id="reject-reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="어디를 어떻게 고쳐야 하는지 적습니다. 카톡에 흩어지면 다음 사람이 못 찾습니다."
                    className="w-full resize-none rounded-box border border-line-strong p-2 text-body outline-none focus:border-fg-subtle"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setApprovals((prev) => ({ ...prev, [selected.id]: "승인" }))
                      }
                      className="flex-1 rounded-box border border-success/30 bg-[#EDF4F2] px-2 py-1.5 text-body font-medium text-success"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={reject}
                      disabled={!reason.trim()}
                      className="flex-1 rounded-box border border-danger/30 bg-[#FBEBEB] px-2 py-1.5 text-body font-medium text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      반려
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

const FLAG_METHOD: Record<ReviewFlag, string> = {
  "수평 틀어짐":
    "허프 변환으로 직선을 검출한 뒤 수평선 대비 각도를 계산합니다. 순수 연산이라 즉시 끝납니다.",
  "노출 편차": "히스토그램 분석. 세트 평균 대비 노출이 벗어난 컷을 표시합니다.",
  "색온도 편차": "RGB 평균값 비교. 같은 숙소 세트의 중앙값에서 벗어난 컷을 찾습니다.",
  눈감음: "얼굴 랜드마크 검출. 작은 전용 모델이면 충분하고 LLM을 쓸 이유가 없습니다.",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <dt className="w-16 shrink-0 text-fg-subtle">{label}</dt>
      <dd className="min-w-0 flex-1 text-fg">{value}</dd>
    </div>
  );
}
