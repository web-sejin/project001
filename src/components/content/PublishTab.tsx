"use client";

import { useState } from "react";
import { AiBadge, Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import type { ChannelCopy } from "@/data/copy";
import type { ChannelProfile, Photo, PublishMode } from "@/data/types";

const MODE_VARIANT: Record<PublishMode, "success" | "warn" | "neutral"> = {
  "자동 발행": "success",
  "심사 필요": "warn",
  "수동 발행": "neutral",
};

export function PublishTab({
  channels,
  copies,
  photos,
  approvedCount,
}: {
  channels: ChannelProfile[];
  copies: Record<string, ChannelCopy>;
  photos: Photo[];
  approvedCount: number;
}) {
  const [activeId, setActiveId] = useState(channels[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(copies).map(([k, v]) => [k, v.body])),
  );
  const [published, setPublished] = useState<Record<string, boolean>>({});

  const active = channels.find((c) => c.id === activeId) ?? channels[0];
  const copy = copies[active.id];
  const set = photos.slice(0, active.maxPhotos);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="채널별 변환"
          description={`승인된 원본 ${approvedCount}장에서 채널 규격에 맞춰 자동 생성됩니다.`}
          right={<AiBadge label="크롭 · 카피 (모의)" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-body">
            <thead>
              <tr className="bg-surface text-left text-fg-muted">
                <th className="border-b border-line px-2.5 py-2 font-medium">채널</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">비율</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">장수</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">문구 톤</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">발행 방식</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr
                  key={ch.id}
                  onClick={() => setActiveId(ch.id)}
                  className={`h-9 cursor-pointer ${
                    ch.id === activeId ? "bg-surface" : "hover:bg-surface/60"
                  }`}
                >
                  <td className="border-b border-line px-2.5 font-medium text-fg">
                    {ch.name}
                  </td>
                  <td className="tnum border-b border-line px-2.5 text-fg-muted">
                    {ch.ratio}
                  </td>
                  <td className="tnum border-b border-line px-2.5 text-fg-muted">
                    {ch.maxPhotos}장
                  </td>
                  <td className="border-b border-line px-2.5 text-fg-muted">
                    {ch.tone}
                  </td>
                  <td className="border-b border-line px-2.5">
                    <span className="flex items-center gap-1.5">
                      <Badge variant={MODE_VARIANT[ch.publishMode]}>
                        {ch.publishMode}
                      </Badge>
                      <InfoTip align="right">{ch.apiNote}</InfoTip>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-surface px-4 py-2.5">
          <p className="text-badge leading-[16px] text-fg-muted">
            자동 발행이 막힌 채널이 있어도 이 시스템의 가치는 대부분 유지됩니다. 진짜
            반복 노동은 업로드 버튼을 누르는 것이 아니라{" "}
            <span className="text-fg">
              채널마다 사진을 자르고 고르고 문구를 쓰는 것
            </span>
            이고, 그 부분은 API 없이도 전부 자동화됩니다.
          </p>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-1">
        {channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setActiveId(ch.id)}
            className={`rounded-box border px-2.5 py-1 text-body transition-colors ${
              ch.id === activeId
                ? "border-line-strong bg-surface font-medium text-fg"
                : "border-line text-fg-muted hover:text-fg"
            }`}
          >
            {ch.name}
            <span className="tnum ml-1.5 text-fg-subtle">{ch.ratio}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader
            title={`${active.name} · ${active.ratio}`}
            description={`채널 규격 ${active.maxPhotos}장 중 ${set.length}장 생성됨`}
            right={
              <Badge variant="ai">
                피사체 인식 크롭 적용
                <InfoTip align="right">
                  객체 검출로 피사체 영역을 계산한 뒤 그 영역을 유지하며 자릅니다.
                  단순 중앙 크롭이 아닙니다. 전용 모델이면 충분해 LLM을 쓰지 않습니다.
                </InfoTip>
              </Badge>
            }
          />
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {set.map((p) => (
              <PhotoBox
                key={p.id}
                id={p.id}
                label={p.aiLabel}
                aspect={active.ratio.replace(":", "/")}
                variant="retouched"
              />
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="border-ai/25">
            <PanelHeader
              title="카피 초안"
              description={copy?.meta}
              right={<AiBadge label="AI 초안" />}
            />
            <div className="space-y-2 p-4">
              <p className="text-body font-medium text-fg">{copy?.title}</p>
              <textarea
                rows={12}
                value={drafts[active.id] ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [active.id]: e.target.value }))
                }
                className="w-full resize-y rounded-box border border-line-strong p-2.5 text-body leading-[19px] outline-none focus:border-fg-subtle"
              />
              <p className="text-badge leading-[16px] text-fg-subtle">
                LLM이 채널 톤 프로필에 맞춰 생성한 초안입니다. 사람이 고쳐서 확정합니다.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="발행" />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={MODE_VARIANT[active.publishMode]}>
                  {active.publishMode}
                </Badge>
                {published[active.id] ? (
                  <Badge variant="success">발행 완료</Badge>
                ) : (
                  <Badge variant="neutral">발행 대기</Badge>
                )}
              </div>

              <p className="text-badge leading-[16px] text-fg-muted">
                {active.apiNote}
              </p>

              {active.publishMode === "자동 발행" ? (
                <button
                  type="button"
                  onClick={() =>
                    setPublished((prev) => ({ ...prev, [active.id]: !prev[active.id] }))
                  }
                  className="w-full rounded-box border border-line-strong bg-surface px-2 py-1.5 text-body font-medium text-fg"
                >
                  {published[active.id] ? "발행 취소" : "발행하기"}
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-box border border-line-strong bg-surface px-2 py-1.5 text-body font-medium text-fg"
                >
                  규격 맞춤 패키지 다운로드
                </button>
              )}

              {active.publishMode !== "자동 발행" ? (
                <p className="text-badge leading-[16px] text-fg-subtle">
                  {active.ratio}로 변환된 이미지 {active.maxPhotos}장과 카피 초안을 zip
                  으로 묶어 내려받습니다. 사람은 붙여넣기만 하면 됩니다.
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
