import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, StuckBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { getAccommodation } from "@/data/accommodations";
import {
  CONTENTS,
  STAGE_DURATIONS,
  STUCK_WARN_DAYS,
  TODAY,
  daysBetween,
} from "@/data/contents";

export default function DashboardPage() {
  const inProgress = CONTENTS.filter((c) => c.status !== "발행");
  const stuck = CONTENTS.filter((c) => c.stuckDays >= STUCK_WARN_DAYS).sort(
    (a, b) => b.stuckDays - a.stuckDays,
  );
  const thisWeek = CONTENTS.filter((c) => {
    const d = daysBetween(TODAY, c.shootDate);
    return c.status === "촬영예정" && d >= 0 && d <= 7;
  });
  const reshoots = CONTENTS.reduce((s, c) => s + c.reshootCount, 0);
  const maxDays = Math.max(...STAGE_DURATIONS.map((s) => s.days));

  return (
    <div>
      <PageHeader
        title="대시보드"
        description={`${TODAY} 기준. 지금 어디가 막혀 있는지부터 봅니다.`}
      />

      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-box border border-line bg-line lg:grid-cols-4">
          <Kpi label="진행 중 콘텐츠" value={inProgress.length} unit="건" />
          <Kpi
            label="정체 건수"
            value={stuck.length}
            unit="건"
            tone="danger"
            note={`${STUCK_WARN_DAYS}일 초과`}
          />
          <Kpi label="이번 주 촬영 예정" value={thisWeek.length} unit="건" />
          <Kpi
            label="이번 달 재촬영"
            value={reshoots}
            unit="회"
            tone={reshoots > 0 ? "warn" : "neutral"}
            note="이 시스템이 줄이려는 숫자"
            tip="재촬영 1회는 숙소 재방문 협의와 일정 재조정으로 며칠이 날아갑니다. 촬영 누락을 현장에서 잡으면 이 숫자가 0에 수렴합니다. 시간 단축은 누구나 말하지만, 재촬영을 없애는 건 프로세스를 본 사람만 말할 수 있습니다."
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="단계별 평균 소요일"
              description="최근 30일 완료 건 기준"
            />
            <div className="space-y-2.5 p-4">
              {STAGE_DURATIONS.map((s) => {
                const isBottleneck = s.days === maxDays;
                return (
                  <div key={s.stage}>
                    <div className="flex items-baseline justify-between text-body">
                      <span
                        className={
                          isBottleneck ? "font-medium text-fg" : "text-fg-muted"
                        }
                      >
                        {s.stage}
                        {isBottleneck ? (
                          <span className="ml-1.5 text-badge text-danger">병목</span>
                        ) : null}
                      </span>
                      <span
                        className={`tnum ${
                          isBottleneck ? "font-semibold text-danger" : "text-fg-muted"
                        }`}
                      >
                        {s.days.toFixed(1)}일
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-box bg-surface">
                      <div
                        className={isBottleneck ? "h-full bg-danger" : "h-full bg-line-strong"}
                        style={{ width: `${(s.days / maxDays) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-line bg-surface px-4 py-2.5">
              <p className="text-badge leading-[16px] text-fg-muted">
                보정 구간이 나머지 세 단계를 합친 것보다 깁니다. 작업 시간 자체보다
                반려 사유가 카톡에 흩어져 생기는 왕복 지연이 큽니다. 반려 이력을
                시스템에 남기는 이유입니다.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="정체 알림"
              description="기준일을 넘긴 건. 클릭하면 해당 콘텐츠로 이동합니다."
              right={<Badge variant="danger">{stuck.length}건</Badge>}
            />
            <ul className="divide-y divide-line">
              {stuck.map((c) => {
                const acc = getAccommodation(c.accommodationId);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/content/${c.id}`}
                      className="flex flex-wrap items-center gap-2 px-4 py-2.5 transition-colors hover:bg-surface"
                    >
                      <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">
                        {acc?.name}
                      </span>
                      <StatusBadge status={c.status} />
                      <StuckBadge days={c.stuckDays} />
                      <span className="w-20 shrink-0 text-right text-badge text-fg-subtle">
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

        <Panel className="mt-4">
          <PanelHeader
            title="이번 주 촬영"
            description="캘린더는 미래를, 파이프라인은 현재를 봅니다."
          />
          <ul className="divide-y divide-line">
            {thisWeek.map((c) => {
              const acc = getAccommodation(c.accommodationId);
              return (
                <li key={c.id}>
                  <Link
                    href={`/content/${c.id}`}
                    className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface"
                  >
                    <span className="tnum w-20 shrink-0 text-body text-fg-muted">
                      {c.shootDate.slice(5)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body text-fg">
                      {acc?.name}
                    </span>
                    <span className="shrink-0 text-badge text-fg-subtle">
                      {c.photographer}
                    </span>
                  </Link>
                </li>
              );
            })}
            {thisWeek.length === 0 ? (
              <li className="px-4 py-3 text-body text-fg-muted">
                이번 주 촬영 예정이 없습니다.
              </li>
            ) : null}
          </ul>
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
    tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-fg";
  return (
    <div className="bg-canvas p-4">
      <div className="flex items-center gap-1">
        <p className="text-badge text-fg-muted">{label}</p>
        {tip ? <InfoTip>{tip}</InfoTip> : null}
      </div>
      <p className={`tnum mt-1 text-page font-semibold ${color}`}>
        {value}
        <span className="ml-0.5 text-body font-normal text-fg-subtle">{unit}</span>
      </p>
      {note ? <p className="mt-0.5 text-badge text-fg-subtle">{note}</p> : null}
    </div>
  );
}
