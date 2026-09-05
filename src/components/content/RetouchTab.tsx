"use client";

import { useMemo, useState } from "react";
import { AiBadge, AxHighlight, AxTag } from "@/components/AxNote";
import { ApprovalBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { AssignPanel, RetouchFlow } from "./AssignPanel";
import { CompareView, type Pin } from "./CompareView";
import { Dialog } from "@/components/ui/Dialog";
import { RetouchedUpload } from "./RetouchedUpload";
import { ToneChart } from "./ToneChart";
import { flagCounts } from "@/data/photos";
import { useStore } from "@/store/MockStore";
import type { ApprovalStatus, Content, Photo, ReviewFlag } from "@/data/types";

const FLAG_METHOD: Record<ReviewFlag, string> = {
  "수평 틀어짐":
    "사진 속 직선을 찾아 지평선과 몇 도 어긋났는지 계산합니다. 이미지 처리 라이브러리(OpenCV)로 하고 AI는 쓰지 않습니다",
  "노출 편차":
    "사진의 밝기를 재서 같은 촬영 건의 평균에서 많이 벗어난 컷을 표시합니다",
  "색온도 편차":
    "사진의 평균 색을 재서 같은 촬영 건의 가운데 값에서 벗어난 컷을 찾습니다",
  눈감음:
    "얼굴에서 눈 위치를 찾아주는 작은 AI로 확인합니다(MediaPipe 같은 라이브러리). 큰 AI를 부를 일이 아닙니다",
};

type Filter = "전체" | "플래그" | "대기" | "반려" | "승인";

export function RetouchTab({
  content,
  photos,
}: {
  content: Content;
  photos: Photo[];
}) {
  const store = useStore();
  const { axMode } = store;
  const pool = useMemo(() => photos.filter((p) => p.selected), [photos]);

  const [approvals, setApprovals] = useState<Record<string, ApprovalStatus>>({});
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [pins, setPins] = useState<Record<string, Pin[]>>({});
  const [pinMode, setPinMode] = useState(false);
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState<Filter>("전체");
  const [selectedId, setSelectedId] = useState<string | null>(pool[0]?.id ?? null);
  const [retouchedOpen, setRetouchedOpen] = useState(false);

  if (content.status === "촬영예정") {
    return (
      <Panel>
        <div className="p-4 text-body text-fg-muted">
          아직 촬영 전입니다. 촬영과 업로드가 끝나면 리터처를 배정합니다.
        </div>
      </Panel>
    );
  }

  // 아직 배정 전이면 배정 화면만 보여준다. 검수할 결과물이 없기 때문이다.
  if (content.status === "촬영완료") {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <AssignPanel content={content} />
        <Panel>
          <PanelHeader title="보정 흐름" description="어디까지가 시스템인지" />
          <div className="p-4">
            <RetouchFlow />
            <p className="mt-3 text-body leading-[21px] text-fg-muted">
              보정은 수동입니다. 리터처가 라이트룸에서 직접 합니다. 시스템이 하는 건
              누구에게 언제 맡겼는지 기록하고, 결과가 올라오면 사람이 볼 대상을 좁혀
              주고, 반려 사유를 남기는 것입니다.
            </p>
            <p className="mt-2 text-body leading-[21px] text-fg-muted">
              배정하면 상태가 보정중으로 넘어가고 정체 일수 계산이 시작됩니다.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  const statusOf = (p: Photo): ApprovalStatus => approvals[p.id] ?? p.approvalStatus;
  const flags = flagCounts(pool);
  const selected = pool.find((p) => p.id === selectedId) ?? null;

  // 올린 보정본이 있으면 비교 뷰에 실제 사진을 띄운다
  const uploads = store.uploadsOf(content.id);
  const retouched = store.retouchedOf(content.id);
  const pairFor = (originalId: string) => {
    const after = retouched.find((r) => r.originalId === originalId);
    const before = uploads.find((u) => u.id === originalId);
    return { beforeUrl: before?.url, afterUrl: after?.url };
  };

  const visible = pool.filter((p) => {
    if (filter === "전체") return true;
    if (filter === "플래그") return p.reviewFlags.length > 0;
    return statusOf(p) === filter;
  });

  const counts = {
    승인: pool.filter((p) => statusOf(p) === "승인").length,
    반려: pool.filter((p) => statusOf(p) === "반려").length,
    대기: pool.filter((p) => statusOf(p) === "대기").length,
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
      <div className="grid gap-4 lg:grid-cols-3">
        <AssignPanel content={content} />

        {axMode ? (
          <>
            <AxHighlight id="ax-04">
            <Panel tone="ai">
              <PanelHeader
                tone="ai"
                title="1차 검수"
                description="보정 결과가 올라오면 수평·노출·색온도·눈감음이 의심되는 컷만 표시합니다. 볼 대상을 좁혀줄 뿐 승인 판단은 하지 않습니다."
                right={<AiBadge />}
              />
              <ul className="divide-y divide-line">
                {flags.length === 0 ? (
                  <li className="px-4 py-2 text-body text-fg-muted">
                    플래그된 컷이 없습니다.
                  </li>
                ) : (
                  flags.map(({ flag, count }) => (
                    <li key={flag} className="flex items-center gap-2 px-4 py-2">
                      <span className="min-w-0 flex-1 text-body text-fg">{flag}</span>
                      <span className="tnum text-body text-fg-muted">{count}장</span>
                      <InfoTip align="right">{FLAG_METHOD[flag]}</InfoTip>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-line px-4 py-2">
                <Button
                  size="sm"
                  variant={filter === "플래그" ? "primary" : "default"}
                  onClick={() => setFilter(filter === "플래그" ? "전체" : "플래그")}
                >
                  플래그된 사진만 보기
                </Button>
              </div>
            </Panel>
            </AxHighlight>

            <AxHighlight id="ax-05">
            <Panel>
              <PanelHeader
                title="보정 톤 일관성"
                description="RGB 평균 비교. AI가 아닙니다."
                right={<Badge variant="outline">순수 연산</Badge>}
              />
              <div className="p-4">
                <ToneChart photos={pool} />
              </div>
            </Panel>
            </AxHighlight>
          </>
        ) : null}
      </div>

      <Panel>
        <PanelHeader
          title="검수"
          description="사진 단위로 승인·반려합니다. 반려 사유는 필수입니다."
          right={
            <>
              <Button size="sm" onClick={() => setRetouchedOpen(true)}>
                보정본 업로드
              </Button>
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
          {(["전체", "플래그", "대기", "반려", "승인"] as Filter[])
            .filter((f) => axMode || f !== "플래그")
            .map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-box border px-2 py-0.5 text-badge ${
                  filter === f
                    ? "border-ai bg-ai-bg font-semibold text-ai"
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
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setReason("");
                  }}
                  className={`min-w-0 rounded-box p-0.5 text-left ${
                    p.id === selectedId ? "bg-ai-bg" : ""
                  }`}
                >
                  <PhotoBox
                    id={p.id}
                    label={p.aiLabel}
                    variant={st === "승인" ? "retouched" : "raw"}
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <ApprovalBadge status={st} />
                    {axMode && p.reviewFlags.length > 0 ? (
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
            <div className="rounded-box border border-line-strong">
              <div className="flex items-center justify-between gap-2 border-b border-line-strong bg-surface px-3 py-2">
                <span className="truncate text-body font-semibold text-fg">
                  {selected.aiLabel}
                </span>
                <span className="tnum shrink-0 text-badge text-fg-muted">
                  {selected.rawPath.split("/")[1]}
                </span>
              </div>

              <div className="space-y-3 p-3">
                <CompareView
                  photoId={selected.id}
                  label={selected.aiLabel}
                  pins={pins[selected.id] ?? []}
                  pinMode={pinMode}
                  {...pairFor(selected.id)}
                  onAddPin={(x, y) =>
                    setPins((prev) => {
                      const list = prev[selected.id] ?? [];
                      return {
                        ...prev,
                        [selected.id]: [
                          ...list,
                          { id: `${selected.id}-pin-${list.length + 1}`, x, y },
                        ],
                      };
                    })
                  }
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  {axMode
                    ? selected.reviewFlags.map((f) => (
                        <Badge key={f} variant="warn">
                          {f}
                        </Badge>
                      ))
                    : null}
                  {selected.retoucher ? (
                    <Badge variant="neutral">{selected.retoucher}</Badge>
                  ) : null}
                </div>

                {selected.rejectHistory.length + (history[selected.id]?.length ?? 0) >
                0 ? (
                  <div className="rounded-box border border-line bg-surface p-2.5">
                    <p className="flex items-center gap-1.5 text-badge font-semibold text-fg-muted">
                      <AxTag id="ax-09" align="left" />
                      반려 이력{" "}
                      <span className="tnum">
                        {selected.rejectHistory.length +
                          (history[selected.id]?.length ?? 0)}
                      </span>
                      회
                    </p>
                    <ol className="mt-1 space-y-1.5">
                      {selected.rejectHistory.map((r) => (
                        <li
                          key={r.round}
                          className="text-badge leading-[18px] text-fg-muted"
                        >
                          <span className="tnum text-fg-subtle">
                            {r.round}차 · {r.at} · {r.by}
                          </span>
                          <br />
                          {r.reason}
                        </li>
                      ))}
                      {(history[selected.id] ?? []).map((r, i) => (
                        <li
                          key={`new-${i}`}
                          className="text-badge leading-[18px] text-fg-muted"
                        >
                          <span className="tnum text-fg-subtle">
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
                      className="text-badge font-semibold text-fg-muted"
                    >
                      반려 사유 (필수)
                    </label>
                    <Button
                      size="sm"
                      variant={pinMode ? "danger" : "default"}
                      onClick={() => setPinMode(!pinMode)}
                    >
                      {pinMode ? "사진을 클릭하세요" : "핀 코멘트"}
                    </Button>
                  </div>
                  <textarea
                    id="reject-reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="어디를 어떻게 고쳐야 하는지 적습니다."
                    className="w-full resize-none rounded-box border border-line-strong p-2 text-body outline-none focus:border-ai"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setApprovals((prev) => ({ ...prev, [selected.id]: "승인" }))
                      }
                      className="flex-1 rounded-box border border-[#B9D9D3] bg-[#E8F2F0] px-2 py-1.5 text-body font-semibold text-success"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={reject}
                      disabled={!reason.trim()}
                      className="flex-1 rounded-box border border-[#EFC2C1] bg-[#FBEAEA] px-2 py-1.5 text-body font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
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

      <Dialog
        open={retouchedOpen}
        onClose={() => setRetouchedOpen(false)}
        title="보정본 업로드"
        description="리터처가 내보낸 파일을 올리면 파일명으로 원본과 짝을 맞춥니다."
        width="760px"
      >
        <RetouchedUpload content={content} photos={photos} />
      </Dialog>
    </div>
  );
}
