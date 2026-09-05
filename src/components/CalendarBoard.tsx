"use client";

import { useState } from "react";
import Link from "next/link";
import { ScheduleForm } from "@/components/ScheduleForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
  const [openDate, setOpenDate] = useState<string | null>(null);
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

  const move = (delta: number) =>
    setCursor((c) => {
      const m = c.m + delta;
      if (m < 1) return { y: c.y - 1, m: 12 };
      if (m > 12) return { y: c.y + 1, m: 1 };
      return { y: c.y, m };
    });

  const monthPrefix = `${cursor.y}-${pad(cursor.m)}`;
  const monthCount = store.contents.filter((c) =>
    c.shootDate.startsWith(monthPrefix),
  ).length;

  const close = () => {
    setOpenDate(null);
    setCreatedId(null);
  };

  return (
    <>
      <Panel>
        <PanelHeader
          title={`${cursor.y}년 ${cursor.m}월`}
          description="날짜 칸의 + 버튼으로 일정을 추가합니다. 하루에 여러 건도 등록됩니다."
          right={
            <>
              <Badge variant="neutral">
                촬영 <span className="tnum">{monthCount}</span>건
              </Badge>
              <Button size="sm" onClick={() => move(-1)}>
                이전 달
              </Button>
              <Button size="sm" onClick={() => move(1)}>
                다음 달
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-7 border-b border-line-strong bg-surface">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-1.5 text-badge font-semibold text-fg-muted">
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
            return (
              <div
                key={i}
                className={`group min-h-[116px] border-r border-b border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  date ? "" : "bg-surface/60"
                } ${isToday ? "bg-ai-bg" : ""}`}
              >
                {date ? (
                  <div className="mb-1 flex items-center gap-1">
                    <span
                      className={`tnum text-badge ${
                        isToday ? "font-semibold text-ai" : "text-fg-muted"
                      }`}
                    >
                      {Number(date.slice(8))}
                    </span>
                    {isToday ? (
                      <span className="text-badge font-semibold text-ai">오늘</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDate(date);
                        setCreatedId(null);
                      }}
                      aria-label={`${date} 일정 추가`}
                      title="일정 추가"
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-box border border-line-strong bg-canvas text-badge font-semibold text-fg-muted hover:border-ai hover:text-ai"
                    >
                      +
                    </button>
                  </div>
                ) : null}

                <div className="space-y-1">
                  {dayEvents.map((c) => {
                    const acc = store.accommodationOf(c.accommodationId);
                    return (
                      <Link
                        key={c.id}
                        href={`/content/${c.id}`}
                        className="block rounded-box border border-line-strong bg-canvas p-1.5 hover:border-ai"
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

      <Dialog
        open={Boolean(openDate)}
        onClose={close}
        title={openDate ? `${openDate} 촬영 일정 등록` : ""}
        description="숙소를 고르고 작가를 배정합니다. 같은 날짜에 여러 건을 등록할 수 있습니다."
        width="560px"
      >
        <div className="p-4">
          {createdId ? (
            <div className="space-y-3">
              <p className="text-body font-medium text-success">
                촬영 일정이 등록됐습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/content/${createdId}`}
                  className="rounded-box border border-ai bg-ai px-3 py-1.5 text-body font-semibold text-white"
                >
                  콘텐츠 상세 열기
                </Link>
                <Button onClick={() => setCreatedId(null)}>
                  이 날짜에 하나 더 등록
                </Button>
                <Button variant="quiet" onClick={close}>
                  닫기
                </Button>
              </div>
            </div>
          ) : openDate ? (
            <ScheduleForm
              fixedDate={openDate}
              onCreated={setCreatedId}
              onCancel={close}
            />
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
