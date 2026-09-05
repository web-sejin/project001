"use client";

import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { PhotoBox } from "@/components/ui/PhotoBox";
import { matchOriginal, type MatchCandidate } from "@/lib/matchRetouched";
import { useStore } from "@/store/MockStore";
import type { Content, Photo, RetouchedPhoto } from "@/data/types";

/**
 * 보정본 업로드.
 *
 * 리터처가 라이트룸에서 내보낸 파일을 올리면 원본과 짝을 맞춘다.
 * 짝은 파일명으로 찾는다. 라이트룸이 원본 이름을 유지해서 내보내기 때문이다.
 * 못 찾은 건 사람이 직접 고른다 — 자동으로 아무 데나 붙이면
 * 엉뚱한 사진을 승인하게 된다.
 */
export function RetouchedUpload({
  content,
  photos,
  onPick,
}: {
  content: Content;
  photos: Photo[];
  /** 짝지은 쌍을 클릭하면 위 비교 뷰에서 열리도록 */
  onPick?: (originalId: string) => void;
}) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  // 올린 파일에 붙일 일련번호
  const seqRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const uploads = store.uploadsOf(content.id);
  const retouched = store.retouchedOf(content.id);

  // 촬영 사진을 직접 올렸으면 그게 원본이고, 없으면 시드 더미의 추천 컷을 쓴다
  const originals: MatchCandidate[] = useMemo(
    () =>
      uploads.length > 0
        ? uploads.map((u) => ({ id: u.id, name: u.name }))
        : photos
            .filter((p) => p.selected)
            .map((p) => ({ id: p.id, name: p.rawPath.split("/")[1] ?? p.id })),
    [uploads, photos],
  );

  const originalName = (id: string) =>
    originals.find((o) => o.id === id)?.name ?? "알 수 없음";
  const originalUrl = (id: string) => uploads.find((u) => u.id === id)?.url;

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const taken = new Set(
      retouched.map((r) => r.originalId).filter((v): v is string => Boolean(v)),
    );
    const added: RetouchedPhoto[] = [];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("image/")) continue;
      const originalId = matchOriginal(f.name, originals, taken);
      if (originalId) taken.add(originalId);
      added.push({
        id: `${content.id}-rt-${(seqRef.current += 1)}`,
        contentId: content.id,
        name: f.name,
        url: URL.createObjectURL(f),
        originalId,
      });
    }
    store.addRetouched(content.id, added);
  };

  const matched = retouched.filter((r) => r.originalId);
  const unmatched = retouched.filter((r) => !r.originalId);
  const usedIds = new Set(
    matched.map((r) => r.originalId).filter((v): v is string => Boolean(v)),
  );

  return (
    <Panel>
      <PanelHeader
        title="보정본 업로드"
        description="리터처가 내보낸 파일을 올리면 파일명으로 원본과 짝을 맞춥니다."
        right={
          retouched.length > 0 ? (
            <>
              <Badge variant="success">
                짝 지음 <span className="tnum">{matched.length}</span>
              </Badge>
              {unmatched.length > 0 ? (
                <Badge variant="warn">
                  못 찾음 <span className="tnum">{unmatched.length}</span>
                </Badge>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="p-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`rounded-box border border-dashed px-4 py-5 text-center transition-colors ${
            dragOver ? "border-ai bg-ai-bg" : "border-line-strong bg-surface"
          }`}
        >
          <p className="text-body font-semibold text-fg">
            보정본을 끌어다 놓거나 선택하세요
          </p>
          <p className="mt-1 text-badge leading-[18px] text-fg-muted">
            원본 파일명을 그대로 두고 내보내면 자동으로 짝이 맞습니다.
            {originals.length > 0 ? (
              <>
                {" "}
                지금 기다리는 원본:{" "}
                <span className="text-fg">
                  {originals
                    .slice(0, 3)
                    .map((o) => o.name)
                    .join(", ")}
                  {originals.length > 3 ? " …" : ""}
                </span>
              </>
            ) : null}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="mt-2.5">
            <Button variant="primary" onClick={() => inputRef.current?.click()}>
              파일 선택
            </Button>
          </div>
        </div>

        {unmatched.length > 0 ? (
          <div className="mt-4 rounded-box border border-warn/40 bg-[#FBF0E2] p-3">
            <p className="text-body font-semibold text-warn">
              짝을 못 찾은 파일 {unmatched.length}건
            </p>
            <p className="mt-1 text-badge leading-[18px] text-fg-muted">
              파일명이 원본과 달라 자동으로 맞추지 못했습니다. 어느 원본의 보정본인지
              직접 골라 주세요. 시스템이 임의로 붙이면 엉뚱한 사진을 승인하게 됩니다.
            </p>
            <ul className="mt-2 space-y-2">
              {unmatched.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  {/* 방금 고른 로컬 파일이라 next/image 를 쓰지 않는다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.url}
                    alt={r.name}
                    className="h-12 w-16 shrink-0 rounded-box border border-line object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-badge text-fg">
                    {r.name}
                  </span>
                  <select
                    aria-label={`${r.name} 원본 지정`}
                    value=""
                    onChange={(e) =>
                      store.setRetouchedOriginal(content.id, r.id, e.target.value)
                    }
                    className="w-40 shrink-0 rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge outline-none focus:border-ai"
                  >
                    <option value="">원본 선택</option>
                    {originals
                      .filter((o) => !usedIds.has(o.id))
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => store.removeRetouched(content.id, r.id)}
                  >
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {matched.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-body font-semibold text-fg">
              짝지은 쌍 <span className="tnum">{matched.length}</span>
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {matched.map((r) => {
                const oid = r.originalId as string;
                const beforeUrl = originalUrl(oid);
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 rounded-box border border-line p-2"
                  >
                    <div className="flex shrink-0 items-center gap-1">
                      {beforeUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={beforeUrl}
                          alt="원본"
                          className="h-12 w-16 rounded-box border border-line object-cover"
                        />
                      ) : (
                        <PhotoBox
                          id={oid}
                          label="원본"
                          aspect="4/3"
                          className="h-12 w-16"
                        />
                      )}
                      <span aria-hidden className="text-fg-subtle">
                        ›
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.url}
                        alt="보정본"
                        className="h-12 w-16 rounded-box border border-ai object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-badge text-fg">{originalName(oid)}</p>
                      <p className="truncate text-badge text-fg-subtle">{r.name}</p>
                    </div>
                    {onPick ? (
                      <Button size="sm" onClick={() => onPick(oid)}>
                        비교
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => store.removeRetouched(content.id, r.id)}
                    >
                      삭제
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line bg-surface px-4 py-2.5">
        <p className="text-badge leading-[18px] text-fg-muted">
          짝짓기는 파일명 비교입니다. AI가 아닙니다. 파일명을 못 믿는 현장이라면
          사진끼리 지문을 만들어 가장 닮은 것을 찾는 방법도 있습니다. 보정해도 구도는
          그대로라 지문이 거의 같고, 셀렉의 중복 판정에 쓰는 것과 같은 방법입니다.
        </p>
      </div>
    </Panel>
  );
}
