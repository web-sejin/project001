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

/** 단계 순서. 상태값만으로 어디까지 왔는지 가늠할 때 쓴다 */
const STATUS_ORDER: Array<Content["status"]> = [
  "촬영예정",
  "촬영완료",
  "보정중",
  "검수",
  "발행",
];

/** 보정 흐름의 한 단계. 누가 하는 일인지가 라벨만큼 중요하다 */
export interface RetouchStep {
  label: string;
  actor: "시스템" | "사람" | "시스템 밖";
  hint: string;
  done: boolean;
}

/**
 * 이 건이 보정 흐름의 어디까지 왔는지 계산한다.
 *
 * 단계를 글로 설명하는 대신 실제 데이터에서 완료 여부를 뽑는다.
 * 배정 기록, 도착한 보정본 수, 짝을 못 찾은 수, 상태. 전부 이미 갖고 있는 값이라
 * 여기에 AI가 낄 자리는 없다.
 */
export function retouchSteps(
  content: Content,
  retouchedCount: number,
  unmatchedCount: number,
): RetouchStep[] {
  // 목업에서 보정본을 실제로 올리지 않아도 상태가 이미 넘어가 있는 건이 있다.
  // 그래서 올라온 파일뿐 아니라 상태값으로도 완료 여부를 판단한다.
  const rank = STATUS_ORDER.indexOf(content.status);
  const past = (status: Content["status"]) => rank >= STATUS_ORDER.indexOf(status);
  const assigned = Boolean(content.retoucher) || past("보정중");
  const arrived = retouchedCount > 0 || past("검수");
  const matched = past("검수") ? unmatchedCount === 0 : arrived && unmatchedCount === 0;
  return [
    {
      label: "리터처 배정",
      actor: "시스템",
      hint: "누구에게 언제 맡겼는지 기록합니다. 여기서 정체 일수가 시작됩니다.",
      done: assigned,
    },
    {
      label: "원본 전달",
      actor: "시스템",
      hint: "셀렉한 원본을 리터처가 내려받습니다. 배정과 동시에 열립니다.",
      done: assigned,
    },
    {
      label: "Lightroom 보정",
      actor: "시스템 밖",
      hint: "리터처가 직접 합니다. 시스템은 여기에 관여하지 않습니다.",
      done: arrived,
    },
    {
      label: "보정본 업로드 · 짝짓기",
      actor: "시스템",
      hint: "올린 보정본을 파일명으로 원본과 맞춰 짝지어 둡니다.",
      done: matched,
    },
    {
      label: "검수 승인 · 반려",
      actor: "사람",
      hint: "사진 단위로 판단합니다. 반려 사유는 이력에 남습니다.",
      done: content.status === "발행",
    },
  ];
}

/** 헤더에 붙일 "지금 3/5 · 리터처 작업 중" 한 줄 */
export function retouchNow(steps: RetouchStep[], unmatchedCount: number) {
  const index = steps.findIndex((s) => !s.done);
  if (index === -1) {
    return { index: steps.length, total: steps.length, label: "보정·검수 끝" };
  }
  const label = [
    "배정 대기",
    "원본 전달",
    "리터처 작업 중",
    unmatchedCount > 0 ? "짝짓기 필요" : "보정본 대기",
    "검수 중",
  ][index];
  return { index: index + 1, total: steps.length, label };
}

/**
 * 보정 흐름.
 *
 * 설명용 그림이 아니라 이 건의 진행 상태다.
 * 단계마다 주체를 붙여서 어디부터가 시스템 밖인지 보이게 하고,
 * 지금 어디에 멈춰 있는지를 표시한다. 그래야 다음에 뭘 해야 하는지가 나온다.
 */
export function RetouchFlow({
  content,
  retouchedCount,
  unmatchedCount,
}: {
  content: Content;
  retouchedCount: number;
  unmatchedCount: number;
}) {
  const steps = retouchSteps(content, retouchedCount, unmatchedCount);
  const current = steps.findIndex((s) => !s.done);

  return (
    <ol>
      {steps.map((s, i) => {
        const isCurrent = i === current;
        return (
          <li
            key={s.label}
            className={`flex gap-2 rounded-box border px-2.5 py-2 ${
              isCurrent ? "border-line-strong bg-surface" : "border-transparent"
            }`}
          >
            <span className="flex flex-col items-center">
              <span
                aria-hidden
                className={`text-badge leading-[18px] ${
                  s.done ? "text-success" : isCurrent ? "text-fg" : "text-fg-subtle"
                }`}
              >
                {s.done ? "●" : "○"}
              </span>
              {i < steps.length - 1 ? (
                <span aria-hidden className="w-px flex-1 bg-line-strong" />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="tnum text-badge text-fg-subtle">{i + 1}</span>
                <span
                  className={`text-body ${
                    isCurrent
                      ? "font-semibold text-fg"
                      : s.done
                        ? "text-fg"
                        : "text-fg-muted"
                  }`}
                >
                  {s.label}
                </span>
                <ActorTag actor={s.actor} />
                {isCurrent ? (
                  <span className="text-badge font-semibold text-warn">지금 여기</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-badge leading-[18px] text-fg-subtle">{s.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** 시스템 밖 단계만 점선으로. 나머지와 다른 종류의 일이라는 표시다 */
function ActorTag({ actor }: { actor: RetouchStep["actor"] }) {
  if (actor === "시스템 밖") {
    return (
      <span className="rounded-box border border-dashed border-line-strong bg-surface px-1.5 py-0.5 text-badge text-fg-subtle">
        시스템 밖
      </span>
    );
  }
  return <Badge variant={actor === "사람" ? "neutral" : "outline"}>{actor}</Badge>;
}
