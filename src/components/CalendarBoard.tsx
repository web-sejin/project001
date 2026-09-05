"use client";

import { useState } from "react";
import Link from "next/link";
import { ScheduleForm } from "@/components/ScheduleForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CalendarBoard() {
  const store = useStore();
  const [cursor, setCursor] = useState({ y: 2026, m: 9 });
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const startPad = new Date(Date.UTC(cursor.y, cursor.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${cursor.y}-${pad(cursor.m)}-${pad(i + 1)}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta: number) => {
    setPickedDate(null);
    setCreatedId(null);
    setCursor((c) => {
      const m = c.m + delta;
      if (m < 1) return { y: c.y - 1, m: 12 };
      if (m > 12) return { y: c.y + 1, m: 1 };
      return { y: c.y, m };
    });
  };

  const monthPrefix = `${cursor.y}-${pad(cursor.m)}`;
  const monthCount = store.contents.filter((c) =>
    c.shootDate.startsWith(monthPrefix),
  ).length;

  const pick = (date: string) => {
    setPickedDate(date);
    setCreatedId(null);
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={`${cursor.y}년 ${cursor.m}월`}
          description="빈 날짜를 클릭하면 그 날짜로 촬영 일정을 등록합니다. 일정 카드를 클릭하면 해당 콘텐츠 상세로 이동합니다."
          right={
            <>
              <Badge variant="neutral">
                촬영 <span className="tnum">{monthCount}</span>건
              </Badge>
              <button
                type="button"
                onClick={() => move(-1)}
                className="rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge font-semibold text-fg-muted hover:text-fg"
              >
                이전 달
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge font-semibold text-fg-muted hover:text-fg"
              >
                다음 달
              </button>
            </>
          }
        />

        <div className="grid grid-cols-7 border-b border-line-strong bg-surface">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-1.5 text-badge font-semibold text-fg-muted"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const dayEvents = date
              ? store.contents.filter((c) => c.shootDate === date)
              : [];
            const isToday = date === TODAY;
            const isPicked = date === pickedDate;
            return (
              <div
                key={i}
                className={`min-h-[112px] border-r border-b border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  date ? "" : "bg-surface/60"
                } ${isPicked ? "bg-ai-bg" : isToday ? "bg-surface" : ""}`}
              >
                {date ? (
                  <button
                    type="button"
                    onClick={() => pick(date)}
                    className="mb-1 flex w-full items-center gap-1 text-left"
                  >
                    <span
                      className={`tnum text-badge ${
                        isToday ? "font-semibold text-fg" : "text-fg-muted"
                      }`}
                    >
                      {Number(date.slice(8))}
                    </span>
                    {isToday ? (
                      <span className="text-badge font-semibold text-fg">오늘</span>
                    ) : null}
                    <span className="ml-auto text-badge text-fg-subtle opacity-0 transition-opacity hover:opacity-100 focus:opacity-100">
                      + 등록
                    </span>
                  </button>
                ) : null}

                <div className="space-y-1">
                  {dayEvents.map((c) => {
                    const acc = store.accommodationOf(c.accommodationId);
                    return (
                      <Link
                        key={c.id}
                        href={`/content/${c.id}`}
                        className="block rounded-box border border-line-strong bg-canvas p-1.5 hover:border-fg-subtle"
                      >
                        <p className="truncate text-badge font-semibold text-fg">
                          {acc?.name ?? "삭제된 숙소"}
                        </p>
                        <p className="mt-px truncate text-badge text-fg-muted">
                          {c.photographer}
                        </p>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <StatusBadge status={c.status} />
                          {c.reshootCount > 0 ? (
                            <Badge variant="danger">재촬영</Badge>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {pickedDate ? (
        <Panel>
          <PanelHeader
            title={`${pickedDate} 촬영 일정 등록`}
            description="날짜를 먼저 정하고 숙소를 고르는 경로입니다. 숙소 관리에서 숙소를 저장한 직후에도 같은 폼으로 등록할 수 있습니다."
            right={
              <button
                type="button"
                onClick={() => setPickedDate(null)}
                className="rounded-box border border-line-strong px-2 py-1 text-badge text-fg-muted hover:text-fg"
              >
                닫기
              </button>
            }
          />
          <div className="p-4">
            {createdId ? (
              <div className="space-y-2">
                <p className="text-body font-medium text-success">
                  {pickedDate} 촬영 일정이 등록됐습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/content/${createdId}`}
                    className="rounded-box border border-line-strong bg-surface px-3 py-1.5 text-body font-semibold text-fg"
                  >
                    콘텐츠 상세 열기
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPickedDate(null)}
                    className="rounded-box border border-line-strong px-3 py-1.5 text-body text-fg-muted hover:text-fg"
                  >
                    캘린더로 돌아가기
                  </button>
                </div>
              </div>
            ) : (
              <ScheduleForm
                fixedDate={pickedDate}
                onCreated={setCreatedId}
                onCancel={() => setPickedDate(null)}
              />
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
