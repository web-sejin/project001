"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export interface CalendarEvent {
  id: string;
  date: string;
  name: string;
  photographer: string;
  status: string;
  reshoot: number;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarBoard({
  events,
  today,
  initialYear,
  initialMonth,
}: {
  events: CalendarEvent[];
  today: string;
  initialYear: number;
  initialMonth: number;
}) {
  const [cursor, setCursor] = useState({ y: initialYear, m: initialMonth });

  const first = new Date(Date.UTC(cursor.y, cursor.m - 1, 1));
  const startPad = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) =>
        `${cursor.y}-${String(cursor.m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta: number) => {
    setCursor((c) => {
      const m = c.m + delta;
      if (m < 1) return { y: c.y - 1, m: 12 };
      if (m > 12) return { y: c.y + 1, m: 1 };
      return { y: c.y, m };
    });
  };

  const monthEvents = events.filter((e) =>
    e.date.startsWith(`${cursor.y}-${String(cursor.m).padStart(2, "0")}`),
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          className="rounded-box border border-line px-2 py-1 text-body text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          이전
        </button>
        <span className="tnum text-section font-semibold text-fg">
          {cursor.y}년 {cursor.m}월
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          className="rounded-box border border-line px-2 py-1 text-body text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          다음
        </button>
        <span className="tnum ml-2 text-badge text-fg-subtle">
          촬영 {monthEvents.length}건
        </span>
      </div>

      <div className="overflow-hidden rounded-box border border-line">
        <div className="grid grid-cols-7 border-b border-line bg-surface">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-1.5 text-badge font-medium text-fg-muted"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const dayEvents = date ? events.filter((e) => e.date === date) : [];
            const isToday = date === today;
            return (
              <div
                key={i}
                className={`min-h-[104px] border-r border-b border-line p-1.5 last:border-r-0 ${
                  date ? "" : "bg-surface/50"
                } ${isToday ? "bg-surface" : ""}`}
              >
                {date ? (
                  <div className="mb-1 flex items-center gap-1">
                    <span
                      className={`tnum text-badge ${
                        isToday ? "font-semibold text-fg" : "text-fg-subtle"
                      }`}
                    >
                      {Number(date.slice(8))}
                    </span>
                    {isToday ? (
                      <span className="text-badge text-fg-subtle">오늘</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-1">
                  {dayEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={`/content/${e.id}`}
                      className="block rounded-box border border-line bg-canvas p-1.5 transition-colors hover:border-line-strong"
                    >
                      <p className="truncate text-badge font-medium text-fg">
                        {e.name}
                      </p>
                      <p className="mt-px truncate text-badge text-fg-subtle">
                        {e.photographer}
                      </p>
                      {e.reshoot > 0 ? (
                        <span className="mt-1 inline-block">
                          <Badge variant="danger">재촬영</Badge>
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
