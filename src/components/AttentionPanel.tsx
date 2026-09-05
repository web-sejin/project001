"use client";

import { useState } from "react";
import Link from "next/link";
import { AxHighlight } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { findAttention, type AttentionItem } from "@/lib/attention";
import { useStore } from "@/store/MockStore";

const CHANNELS = ["슬랙", "카카오워크", "이메일"];

/**
 * 챙겨야 할 것.
 *
 * 사람이 화면을 열어봐야 알 수 있으면 자동화가 아니다.
 * 아무도 안 보고 있어도 매일 정해진 시각에 이 검사가 돌고,
 * 걸린 건은 담당자별로 묶여 알림으로 나간다.
 */
export function AttentionPanel() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const s = store.alerts;

  const items: AttentionItem[] = store.contents.flatMap((c) =>
    findAttention(c, store.publishProgress(c.id), s),
  );
  const danger = items.filter((i) => i.severity === "danger").length;

  return (
    <>
      <AxHighlight id="ax-08">
        <Panel>
          <PanelHeader
            title="챙겨야 할 것"
            description={`매일 ${s.notifyAt}에 검사해 담당자별로 ${s.channel} 알림을 보냅니다.`}
            right={
              <>
                {items.length > 0 ? (
                  <Badge variant={danger > 0 ? "danger" : "warn"}>
                    <span className="tnum">{items.length}</span>건
                  </Badge>
                ) : (
                  <Badge variant="success">없음</Badge>
                )}
                <Button size="sm" onClick={() => setOpen(true)}>
                  알림 기준
                </Button>
              </>
            }
          />

          <ul className="divide-y divide-line">
            {items.map((item, i) => {
              const content = store.contentOf(item.contentId);
              const acc = content
                ? store.accommodationOf(content.accommodationId)
                : undefined;
              return (
                <li key={`${item.contentId}-${item.kind}-${i}`}>
                  <Link
                    href={`/content/${item.contentId}`}
                    className="flex flex-wrap items-start gap-2 px-4 py-2.5 hover:bg-surface"
                  >
                    <Badge variant={item.severity === "danger" ? "danger" : "warn"}>
                      {item.kind}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-medium text-fg">
                        {acc?.name ?? "삭제된 숙소"}
                      </span>
                      <span className="mt-px block text-badge text-fg-muted">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-badge text-fg-muted">
                      {item.owner}
                    </span>
                  </Link>
                </li>
              );
            })}
            {items.length === 0 ? (
              <li className="px-4 py-3 text-body text-fg-muted">
                기준에 걸린 건이 없습니다.
              </li>
            ) : null}
          </ul>
        </Panel>
      </AxHighlight>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="알림 기준"
        description="며칠이 지나면 알릴지 정합니다. 바꾸면 위 목록이 바로 다시 계산됩니다."
        width="520px"
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            닫기
          </Button>
        }
      >
        <div className="space-y-3 p-4">
          <NumberField
            label="단계 정체 · 주의"
            suffix="일 이상 같은 단계"
            value={s.stuckWarnDays}
            onChange={(stuckWarnDays) => store.updateAlerts({ stuckWarnDays })}
          />
          <NumberField
            label="단계 정체 · 위험"
            suffix="일 이상 같은 단계"
            value={s.stuckDangerDays}
            onChange={(stuckDangerDays) => store.updateAlerts({ stuckDangerDays })}
          />
          <NumberField
            label="촬영일 경과"
            suffix="일 지나도록 사진이 없으면"
            value={s.uploadOverdueDays}
            onChange={(uploadOverdueDays) => store.updateAlerts({ uploadOverdueDays })}
          />
          <NumberField
            label="배정 대기"
            suffix="일 안에 리터처가 안 정해지면"
            value={s.assignWaitDays}
            onChange={(assignWaitDays) => store.updateAlerts({ assignWaitDays })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-badge font-semibold text-fg-muted">
                알림 시각
              </span>
              <input
                type="time"
                value={s.notifyAt}
                onChange={(e) => store.updateAlerts({ notifyAt: e.target.value })}
                className="tnum w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-badge font-semibold text-fg-muted">
                알림 채널
              </span>
              <select
                value={s.channel}
                onChange={(e) => store.updateAlerts({ channel: e.target.value })}
                className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body outline-none focus:border-ai"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="rounded-box bg-surface px-3 py-2 text-badge leading-[18px] text-fg-muted">
            매 건마다 알림을 쏘면 2주 만에 아무도 안 봅니다. 하루 한 번, 담당자별로
            묶어서 한 통만 보냅니다. 정해진 시각에 실행하는 스케줄러(cron)와 채널
            웹훅이면 되고 AI는 쓰지 않습니다.
          </p>
        </div>
      </Dialog>
    </>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 shrink-0 text-badge font-semibold text-fg-muted">
        {label}
      </span>
      <input
        value={value}
        inputMode="numeric"
        aria-label={label}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="tnum w-16 rounded-box border border-line-strong px-2 py-1 text-right text-body outline-none focus:border-ai"
      />
      <span className="text-body text-fg-muted">{suffix}</span>
    </div>
  );
}
