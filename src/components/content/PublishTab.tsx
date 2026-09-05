"use client";

import { useMemo, useState } from "react";
import { AiBadge, AxHighlight } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { CHANNELS, OPERATORS, TODAY } from "@/data/contents";
import { getChannelCopy } from "@/data/copy";
import { useStore } from "@/store/MockStore";
import type { Accommodation, Content, Photo, Publication } from "@/data/types";

/**
 * 발행 탭.
 *
 * 여기서 관리하는 건 자동 등록이 아니라 게시 기록이다.
 * 어느 채널에 올렸는지, 링크가 뭔지, 누가 언제 올렸는지.
 * 채널별 변환 결과(이미지 세트·카피 초안)는 사람이 붙여넣을 재료로 그 아래에 둔다.
 */
export function PublishTab({
  content,
  acc,
  photos,
}: {
  content: Content;
  acc: Accommodation;
  photos: Photo[];
}) {
  const store = useStore();
  const { axMode } = useStore();

  const approved = useMemo(
    () => photos.filter((p) => p.selected && p.approvalStatus === "승인"),
    [photos],
  );
  const pubs = store.publicationsOf(content.id);
  const pubOf = (channelId: string) => pubs.find((p) => p.channelId === channelId);
  const done = pubs.filter((p) => p.status === "발행완료").length;

  const [editing, setEditing] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const active = CHANNELS.find((c) => c.id === activeChannel) ?? CHANNELS[0];
  const copy = getChannelCopy(active.id, acc);
  const set = approved.slice(0, active.maxPhotos);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="채널별 게시 현황"
          description="어느 채널에 올렸고 링크가 무엇인지 기록합니다."
          right={
            <Badge variant={done === CHANNELS.length ? "success" : "warn"}>
              <span className="tnum">
                {done}/{CHANNELS.length}
              </span>{" "}
              채널 발행
            </Badge>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-body">
            <thead>
              <tr className="bg-surface text-left">
                <Th>채널</Th>
                <Th className="w-24">상태</Th>
                <Th className="w-28">발행일</Th>
                <Th className="w-24">담당</Th>
                <Th>링크</Th>
                <Th className="w-24 text-right">관리</Th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((ch) => {
                const pub = pubOf(ch.id);
                const published = pub?.status === "발행완료";
                return (
                  <tr key={ch.id} className="border-b border-line">
                    <td className="px-2.5 py-2">
                      <span className="font-semibold text-fg">{ch.name}</span>
                      <span className="tnum mt-px block text-badge text-fg-subtle">
                        {ch.ratio} · {ch.maxPhotos}장 · {ch.tone}
                      </span>
                    </td>
                    <td className="px-2.5 py-2">
                      {published ? (
                        <Badge variant="success">발행완료</Badge>
                      ) : (
                        <Badge variant="neutral">미발행</Badge>
                      )}
                    </td>
                    <td className="tnum px-2.5 py-2 text-fg-muted">
                      {pub?.publishedAt ?? "—"}
                    </td>
                    <td className="px-2.5 py-2 text-fg-muted">
                      {pub?.publishedBy ?? "—"}
                    </td>
                    <td className="max-w-0 px-2.5 py-2">
                      {published && pub?.url ? (
                        <a
                          href={pub.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-ai underline underline-offset-2"
                        >
                          {pub.url}
                        </a>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      <Button size="sm" onClick={() => setEditing(ch.id)}>
                        {published ? "수정" : "발행 등록"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-surface px-4 py-2.5">
          <p className="text-badge leading-[16px] text-fg-muted">
            채널마다 발행 방식이 다릅니다. 자사몰은 내부 시스템에서 바로 등록하고,
            나머지는 각 채널에서 게시한 뒤 링크를 여기에 남깁니다.
          </p>
        </div>
      </Panel>

      {approved.length === 0 ? (
        <Panel>
          <div className="p-4 text-body text-fg-muted">
            아직 승인된 컷이 없습니다. 검수에서 승인이 끝나면 채널별 변환 결과가 여기에
            생성됩니다.
          </div>
        </Panel>
      ) : axMode ? (
        <>
          <div className="flex flex-wrap gap-1">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={`rounded-box border px-2.5 py-1 text-body ${
                  ch.id === activeChannel
                    ? "border-ai bg-ai-bg font-semibold text-ai"
                    : "border-line-strong text-fg-muted hover:text-fg"
                }`}
              >
                {ch.name}
                <span className="tnum ml-1.5 text-fg-subtle">{ch.ratio}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <AxHighlight id="ax-06">
            <Panel tone="ai">
              <PanelHeader
                tone="ai"
                title={`${active.name} · ${active.ratio}`}
                description={`채널 규격 ${active.maxPhotos}장 중 ${set.length}장 생성됨`}
                right={<AiBadge label="피사체 인식 크롭" />}
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
            </AxHighlight>

            <div className="space-y-4">
              <AxHighlight id="ax-07">
              <Panel tone="ai">
                <PanelHeader
                  tone="ai"
                  title="카피 초안"
                  description={copy.meta}
                  right={<AiBadge label="AI 초안" />}
                />
                <div className="space-y-2 p-4">
                  <p className="text-body font-semibold text-fg">{copy.title}</p>
                  <textarea
                    rows={11}
                    value={drafts[active.id] ?? copy.body}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [active.id]: e.target.value }))
                    }
                    className="w-full resize-y rounded-box border border-line-strong p-2.5 text-body leading-[19px] outline-none focus:border-ai"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      navigator.clipboard?.writeText(drafts[active.id] ?? copy.body)
                    }
                  >
                    복사
                  </Button>
                </div>
              </Panel>
              </AxHighlight>
            </div>
          </div>
        </>
      ) : (
        <Panel>
          <PanelHeader
            title="승인된 사진"
            description={`${approved.length}장. 각 채널 규격에 맞춰 내보냅니다.`}
          />
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-8">
            {approved.map((p) => (
              <PhotoBox key={p.id} id={p.id} label={p.aiLabel} variant="retouched" />
            ))}
          </div>
        </Panel>
      )}

      <PublishDialog
        contentId={content.id}
        channelId={editing}
        existing={editing ? pubOf(editing) : undefined}
        onClose={() => setEditing(null)}
        onSave={(pub) => {
          store.savePublication(pub);
          setEditing(null);
        }}
      />
    </div>
  );
}

function PublishDialog({
  contentId,
  channelId,
  existing,
  onClose,
  onSave,
}: {
  contentId: string;
  channelId: string | null;
  existing?: Publication;
  onClose: () => void;
  onSave: (pub: Publication) => void;
}) {
  const channel = CHANNELS.find((c) => c.id === channelId);
  const [url, setUrl] = useState(existing?.url ?? "");
  const [at, setAt] = useState(existing?.publishedAt ?? TODAY);
  const [by, setBy] = useState(existing?.publishedBy ?? OPERATORS[0]);

  // 다른 채널을 열면 입력값을 그 채널 것으로 바꾼다
  const key = `${contentId}:${channelId}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setUrl(existing?.url ?? "");
    setAt(existing?.publishedAt ?? TODAY);
    setBy(existing?.publishedBy ?? OPERATORS[0]);
  }

  if (!channel || !channelId) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${channel.name} 발행 등록`}
      description="해당 채널에 게시한 뒤 링크를 남기면 현황판에도 반영됩니다."
      width="520px"
      footer={
        <>
          {existing?.status === "발행완료" ? (
            <Button
              variant="danger"
              onClick={() =>
                onSave({
                  contentId,
                  channelId,
                  status: "미발행",
                  url: "",
                  publishedAt: null,
                  publishedBy: null,
                })
              }
            >
              발행 취소
            </Button>
          ) : null}
          <Button onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            disabled={!url.trim()}
            onClick={() =>
              onSave({
                contentId,
                channelId,
                status: "발행완료",
                url: url.trim(),
                publishedAt: at,
                publishedBy: by,
              })
            }
          >
            발행 완료로 저장
          </Button>
        </>
      }
    >
      <div className="space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            게시 링크
          </span>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-badge font-semibold text-fg-muted">
              발행일
            </span>
            <input
              type="date"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              className="tnum w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-badge font-semibold text-fg-muted">
              담당자
            </span>
            <select
              value={by}
              onChange={(e) => setBy(e.target.value)}
              className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body outline-none focus:border-ai"
            >
              {OPERATORS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </Dialog>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-line-strong px-2.5 py-2 text-badge font-semibold text-fg-muted ${className}`}
    >
      {children}
    </th>
  );
}
