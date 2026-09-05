"use client";

import { useState } from "react";
import { AxTag } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { RETOUCHERS, TODAY, daysBetween } from "@/data/contents";
import { useStore } from "@/store/MockStore";
import type { Content } from "@/data/types";

/**
 * 리터처 배정.
 *
 * 배정은 자동이 아니다. 사람이 고른다.
 * 다만 누구한테 줄지 판단하려면 각자 지금 몇 건을 들고 있는지가 보여야 해서
 * 진행 중 건수를 옆에 붙였다. 이건 쿼리지 AI가 아니다.
 *
 * 배정 시각이 기록돼야 정체 일수가 계산된다. 대시보드의 병목 숫자가 여기서 나온다.
 */
export function AssignPanel({ content }: { content: Content }) {
  const store = useStore();
  const [retoucher, setRetoucher] = useState(content.retoucher ?? "");
  const [dueDate, setDueDate] = useState(content.dueDate ?? "");

  const assigned = Boolean(content.retoucher);
  const load = (name: string) =>
    store.contents.filter(
      (c) => c.retoucher === name && (c.status === "보정중" || c.status === "검수"),
    ).length;

  const overdue =
    content.dueDate && daysBetween(content.dueDate, TODAY) > 0
      ? daysBetween(content.dueDate, TODAY)
      : 0;

  const assign = () => {
    if (!retoucher) return;
    store.updateContent(content.id, {
      retoucher,
      dueDate: dueDate || undefined,
      // 배정하면 보정 단계로 넘어간다
      status: content.status === "촬영완료" ? "보정중" : content.status,
      statusChangedAt: content.status === "촬영완료" ? TODAY : content.statusChangedAt,
      stuckDays: content.status === "촬영완료" ? 0 : content.stuckDays,
    });
  };

  return (
    <Panel>
      <PanelHeader
        title="리터처 배정"
        description={
          assigned
            ? "담당자를 바꾸거나 마감일을 조정할 수 있습니다."
            : "보정을 맡길 리터처를 고릅니다. 배정하면 보정 단계로 넘어갑니다."
        }
        right={
          assigned ? (
            <Badge variant="success">배정됨</Badge>
          ) : (
            <Badge variant="warn">미배정</Badge>
          )
        }
      />

      <div className="space-y-3 p-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-badge font-semibold text-fg-muted">
            담당자
            <AxTag id="ax-08" align="left" />
          </p>
          <div className="space-y-1">
            {RETOUCHERS.map((name) => {
              const picked = retoucher === name;
              const n = load(name);
              return (
                <label
                  key={name}
                  className={`flex cursor-pointer items-center gap-2 rounded-box border px-2.5 py-1.5 text-body ${
                    picked
                      ? "border-ai bg-ai-bg text-ai"
                      : "border-line text-fg hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name={`retoucher-${content.id}`}
                    checked={picked}
                    onChange={() => setRetoucher(name)}
                    className="h-3.5 w-3.5 accent-[#6940A5]"
                  />
                  <span className="min-w-0 flex-1 font-medium">{name}</span>
                  <span
                    className={`tnum text-badge ${
                      n >= 2 ? "font-semibold text-warn" : "text-fg-muted"
                    }`}
                  >
                    진행 중 {n}건
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-badge leading-[18px] text-fg-subtle">
            진행 중 건수는 상태가 보정중·검수인 건을 센 값입니다. 한 명에게 몰리는 걸
            막으려고 옆에 붙였습니다.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            보정 마감일
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="tnum w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={assign} disabled={!retoucher}>
            {assigned ? "배정 변경" : "배정하기"}
          </Button>
          {assigned ? (
            <span className="text-badge text-fg-muted">
              {content.statusChangedAt} 배정 · {content.stuckDays}일 경과
            </span>
          ) : null}
          {overdue > 0 ? (
            <Badge variant="danger">마감 {overdue}일 초과</Badge>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line bg-surface px-4 py-2.5">
        <p className="text-badge leading-[18px] text-fg-muted">
          보정 작업 자체는 라이트룸·포토샵에서 사람이 합니다. 시스템은 배정과 전달,
          결과 수령, 검수 이력만 관리합니다.
        </p>
      </div>
    </Panel>
  );
}

/** 어디까지가 시스템이고 어디부터 사람인지 한 줄로 */
export function RetouchFlow() {
  const steps: Array<{ label: string; outside?: boolean }> = [
    { label: "리터처 배정" },
    { label: "원본 전달" },
    { label: "Lightroom 보정", outside: true },
    { label: "결과 업로드" },
    { label: "1차 검수 · 자동" },
    { label: "2차 검수 · 사람" },
    { label: "승인 · 반려" },
  ];

  return (
    <div className="thin-scroll flex items-center gap-1 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={s.label} className="flex shrink-0 items-center gap-1">
          <span
            className={`rounded-box border px-2 py-1 text-badge ${
              s.outside
                ? "border-dashed border-line-strong bg-surface text-fg-subtle"
                : "border-line-strong bg-canvas text-fg-muted"
            }`}
          >
            {s.label}
            {s.outside ? <span className="ml-1 text-fg-subtle">시스템 밖</span> : null}
          </span>
          {i < steps.length - 1 ? (
            <span aria-hidden className="text-fg-subtle">
              ›
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
