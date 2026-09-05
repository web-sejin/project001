"use client";

import Link from "next/link";
import { AttentionPanel } from "@/components/AttentionPanel";
import { AxHighlight } from "@/components/AxNote";
import { PageHeader } from "@/components/PageHeader";
import { StageBoard } from "@/components/StageBoard";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { STAGE_DURATIONS, TODAY, daysBetween } from "@/data/contents";
import { findAttention } from "@/lib/attention";
import { useStore } from "@/store/MockStore";

export default function DashboardPage() {
  const store = useStore();

  const inProgress = store.contents.filter((c) => c.status !== "발행");
  // 사람이 안 보고 있어도 걸리는 것들. 자동 점검 규칙이 잡아낸다.
  const attention = store.contents.flatMap((c) =>
    findAttention(c, store.publishProgress(c.id), store.alerts),
  );
  const upcoming = store.contents.filter(
    (c) =>
      c.status === "촬영예정" &&
      daysBetween(TODAY, c.shootDate) >= 0 &&
      daysBetween(TODAY, c.shootDate) <= 7,
  );
  const reshoots = store.contents.reduce((s, c) => s + c.reshootCount, 0);
  const maxDays = Math.max(...STAGE_DURATIONS.map((s) => s.days));

  return (
    <div>
      <PageHeader
        title="현황판"
        purpose={`촬영 건이 지금 어느 단계에 있는지 한눈에 봅니다. ${TODAY} 기준.`}
        right={
          <Link href="/calendar">
            <Button variant="primary">촬영 일정 등록</Button>
          </Link>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-px rounded-box border border-line-strong bg-line-strong lg:grid-cols-4">
          <Kpi label="진행 중" value={inProgress.length} unit="건" />
          <Kpi
            label="챙겨야 할 것"
            value={attention.length}
            unit="건"
            tone="danger"
            note="자동 점검에 걸린 건"
          />
          <Kpi label="이번 주 촬영" value={upcoming.length} unit="건" />
          <Kpi
            label="재촬영 누적"
            value={reshoots}
            unit="회"
            tone="warn"
            note="줄여야 하는 숫자"
          />
        </div>

        <AxHighlight
          id="ax-02"
          note={
            <>
              빠진 컷이 있는 건은 카드에 <span className="font-semibold text-danger">▲</span>,
              보정 검수에서 걸린 건은 <span className="font-semibold text-ai">◆</span> 로
              표시됩니다. 토글을 끄면 이 표시가 사라집니다.
            </>
          }
        >
        <Panel>
          <PanelHeader
            title="업무 흐름"
            description="촬영 일정 관리 → 촬영 사진 업로드 → 사진 보정 및 검수 → 채널별 콘텐츠 업로드"
          />
          <div className="p-4">
            <StageBoard />
          </div>
        </Panel>
        </AxHighlight>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="단계별 평균 소요일"
              description="최근 30일 완료 건 기준"
            />
            <div className="space-y-2.5 p-4">
              {STAGE_DURATIONS.map((s) => {
                const bottleneck = s.days === maxDays;
                return (
                  <div key={s.stage}>
                    <div className="flex items-baseline justify-between text-body">
                      <span
                        className={bottleneck ? "font-semibold text-fg" : "text-fg-muted"}
                      >
                        {s.stage}
                        {bottleneck ? (
                          <span className="ml-1.5 text-badge font-semibold text-danger">
                            병목
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`tnum ${
                          bottleneck ? "font-semibold text-danger" : "text-fg-muted"
                        }`}
                      >
                        {s.days.toFixed(1)}일
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-box bg-surface">
                      <div
                        className={bottleneck ? "h-full bg-danger" : "h-full bg-line-strong"}
                        style={{ width: `${(s.days / maxDays) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-line bg-surface px-4 py-2.5">
              <p className="text-badge leading-[18px] text-fg-muted">
                보정 구간이 나머지 세 단계를 합친 것보다 깁니다. 작업 시간보다 반려
                사유가 흩어져 생기는 왕복 지연이 큽니다.
              </p>
            </div>
          </Panel>

          <AttentionPanel />
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  tone = "neutral",
  note,
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "neutral" | "warn" | "danger";
  note?: string;
}) {
  const color =
    value === 0
      ? "text-fg"
      : tone === "danger"
        ? "text-danger"
        : tone === "warn"
          ? "text-warn"
          : "text-fg";
  return (
    <div className="rounded-box bg-canvas p-4">
      <p className="text-badge font-semibold text-fg-muted">{label}</p>
      <p className={`tnum mt-1 text-figure font-semibold ${color}`}>
        {value}
        <span className="ml-1 text-body font-normal text-fg-muted">{unit}</span>
      </p>
      {note ? <p className="mt-0.5 text-badge text-fg-subtle">{note}</p> : null}
    </div>
  );
}
