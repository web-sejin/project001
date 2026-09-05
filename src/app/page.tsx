"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PipelineBoard } from "@/components/PipelineBoard";
import { StatusBadge, StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTip } from "@/components/ui/InfoTip";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import {
  STAGE_DURATIONS,
  STUCK_WARN_DAYS,
  TODAY,
  daysBetween,
} from "@/data/contents";
import { useStore } from "@/store/MockStore";

export default function DashboardPage() {
  const store = useStore();

  const inProgress = store.contents.filter((c) => c.status !== "발행");
  const stuck = store.contents
    .filter((c) => c.stuckDays >= STUCK_WARN_DAYS && c.status !== "발행")
    .sort((a, b) => b.stuckDays - a.stuckDays);
  const upcoming = store.contents.filter((c) => {
    const d = daysBetween(TODAY, c.shootDate);
    return c.status === "촬영예정" && d >= 0 && d <= 7;
  });
  const reshoots = store.contents.reduce((s, c) => s + c.reshootCount, 0);
  const maxDays = Math.max(...STAGE_DURATIONS.map((s) => s.days));

  return (
    <div>
      <PageHeader
        title="현황판"
        purpose={`지금 어디가 막혀 있는지 보고, 아래 보드에서 각 촬영 건의 단계를 확인합니다. ${TODAY} 기준.`}
        right={
          <Link href="/calendar">
            <Button variant="primary">촬영 일정 등록</Button>
          </Link>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-px rounded-box border border-line-strong bg-line-strong lg:grid-cols-4">
          <Kpi label="진행 중 콘텐츠" value={inProgress.length} unit="건" />
          <Kpi
            label="정체 건수"
            value={stuck.length}
            unit="건"
            tone="danger"
            note={`${STUCK_WARN_DAYS}일 초과`}
          />
          <Kpi label="이번 주 촬영 예정" value={upcoming.length} unit="건" />
          <Kpi
            label="이번 달 재촬영"
            value={reshoots}
            unit="회"
            tone="warn"
            note="이 시스템이 줄이려는 숫자"
            tip="재촬영 1회는 숙소 재방문 협의와 일정 재조정으로 며칠이 날아갑니다. 누락을 아는 시점을 철수 전으로 당기면 이 숫자가 0에 수렴합니다."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="단계별 평균 소요일"
              description="최근 30일 완료 건 기준. 어느 구간이 병목인지 드러납니다."
            />
            <div className="space-y-2.5 p-4">
              {STAGE_DURATIONS.map((s) => {
                const bottleneck = s.days === maxDays;
                return (
                  <div key={s.stage}>
                    <div className="flex items-baseline justify-between text-body">
                      <span className={bottleneck ? "font-semibold text-fg" : "text-fg-muted"}>
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
              <p className="text-badge leading-[16px] text-fg-muted">
                보정 구간이 나머지 세 단계를 합친 것보다 깁니다. 반려 사유가 카톡에
                흩어져 생기는 왕복 지연이 큽니다.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="정체 알림"
              description={`상태가 바뀐 지 ${STUCK_WARN_DAYS}일이 넘은 건입니다.`}
              right={
                stuck.length > 0 ? (
                  <Badge variant="danger">
                    <span className="tnum">{stuck.length}</span>건
                  </Badge>
                ) : (
                  <Badge variant="success">없음</Badge>
                )
              }
            />
            <ul className="divide-y divide-line">
              {stuck.map((c) => {
                const acc = store.accommodationOf(c.accommodationId);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/content/${c.id}`}
                      className="flex flex-wrap items-center gap-2 px-4 py-2.5 hover:bg-surface"
                    >
                      <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">
                        {acc?.name ?? "삭제된 숙소"}
                      </span>
                      <StatusBadge status={c.status} />
                      <StuckBadge days={c.stuckDays} />
                      <span className="w-16 shrink-0 text-right text-badge text-fg-muted">
                        {c.retoucher ?? c.photographer}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {stuck.length === 0 ? (
                <li className="px-4 py-3 text-body text-fg-muted">
                  정체된 건이 없습니다.
                </li>
              ) : null}
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="파이프라인"
            description="▲ 는 AI가 필수 컷 누락을 의심한 건, ◆ 는 AI 검수 플래그가 있는 건입니다. 클릭하면 해당 탭으로 이동합니다."
            right={
              <>
                <Badge variant="warn">3일 초과</Badge>
                <Badge variant="danger">7일 초과</Badge>
                <Badge variant="ai">AI 경고</Badge>
              </>
            }
          />
          <div className="p-4">
            <PipelineBoard />
          </div>
        </Panel>
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
  tip,
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "neutral" | "warn" | "danger";
  note?: string;
  tip?: string;
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
      <div className="flex items-center gap-1">
        <p className="text-badge font-semibold text-fg-muted">{label}</p>
        {tip ? <InfoTip>{tip}</InfoTip> : null}
      </div>
      <p className={`tnum mt-1 text-figure font-semibold ${color}`}>
        {value}
        <span className="ml-1 text-body font-normal text-fg-muted">{unit}</span>
      </p>
      {note ? <p className="mt-0.5 text-badge text-fg-subtle">{note}</p> : null}
    </div>
  );
}
