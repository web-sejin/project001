"use client";

import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
 *
 * 어떤 기준으로 짝지었는지도 함께 남긴다. 검수자가 "이게 정말 그 컷의
 * 보정본인가"를 확인할 근거가 있어야 한다.
 */
export function RetouchedUpload({
  content,
  photos,
}: {
  content: Content;
  photos: Photo[];
}) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

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
      const hit = matchOriginal(f.name, originals, taken);
      if (hit) taken.add(hit.id);
      added.push({
        id: `${content.id}-rt-${(seqRef.current += 1)}`,
        contentId: content.id,
        name: f.name,
        url: URL.createObjectURL(f),
        originalId: hit?.id ?? null,
        matchedBy: hit?.how ?? null,
      });
    }
    store.addRetouched(content.id, added);
  };

  const matched = retouched.filter((r) => r.originalId);
  const unmatched = retouched.filter((r) => !r.originalId);
  const usedIds = new Set(
    matched.map((r) => r.originalId).filter((v): v is string => Boolean(v)),
  );
  const comparing = retouched.find((r) => r.id === compareId) ?? null;

  return (
    <>
      <div className="p-4">
        {retouched.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="success">
              짝 지음 <span className="tnum">{matched.length}</span>
            </Badge>
            {unmatched.length > 0 ? (
              <Badge variant="warn">
                못 찾음 <span className="tnum">{unmatched.length}</span>
              </Badge>
            ) : null}
            <Button
              size="sm"
              variant="quiet"
              className="ml-auto"
              onClick={() =>
                retouched.forEach((r) => store.removeRetouched(content.id, r.id))
              }
            >
              비우기
            </Button>
          </div>
        ) : null}

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
            <ul className="space-y-2">
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

                    <dl className="min-w-0 flex-1 text-badge">
                      <div className="flex gap-1.5">
                        <dt className="w-12 shrink-0 text-fg-subtle">원본</dt>
                        <dd className="min-w-0 flex-1 truncate text-fg">
                          {originalName(oid)}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="w-12 shrink-0 text-fg-subtle">보정본</dt>
                        <dd className="min-w-0 flex-1 truncate text-fg">{r.name}</dd>
                      </div>
                      <div className="mt-0.5">
                        <Badge
                          variant={r.matchedBy === "직접 지정" ? "outline" : "neutral"}
                        >
                          {r.matchedBy}
                        </Badge>
                      </div>
                    </dl>

                    <Button size="sm" onClick={() => setCompareId(r.id)}>
                      비교
                    </Button>
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

        <p className="mt-4 rounded-box bg-surface px-3 py-2 text-badge leading-[18px] text-fg-muted">
          짝짓기는 파일명 비교입니다. AI가 아닙니다. 파일명을 못 믿는 현장이라면 사진끼리
          지문을 만들어 가장 닮은 것을 찾는 방법도 있습니다. 보정해도 구도는 그대로라
          지문이 거의 같고, 셀렉의 중복 판정에 쓰는 것과 같은 방법입니다.
        </p>
      </div>

      <Dialog
        open={Boolean(comparing)}
        onClose={() => setCompareId(null)}
        title="원본 · 보정본 비교"
        description={comparing ? `짝짓기 기준: ${comparing.matchedBy}` : undefined}
        width="760px"
      >
        {comparing ? (
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <figure>
                <figcaption className="mb-1 text-badge font-semibold text-fg-muted">
                  원본
                </figcaption>
                {originalUrl(comparing.originalId as string) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={originalUrl(comparing.originalId as string)}
                    alt="원본"
                    className="aspect-[3/2] w-full rounded-box border border-line object-cover"
                  />
                ) : (
                  <PhotoBox
                    id={comparing.originalId as string}
                    label="원본 파일 없음"
                    aspect="3/2"
                  />
                )}
              </figure>

              <figure>
                <figcaption className="mb-1 text-badge font-semibold text-ai">
                  보정본
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comparing.url}
                  alt="보정본"
                  className="aspect-[3/2] w-full rounded-box border border-ai object-cover"
                />
              </figure>
            </div>

            <dl className="mt-4 divide-y divide-line rounded-box border border-line-strong text-body">
              <Row label="원본" value={originalName(comparing.originalId as string)} />
              <Row label="보정본" value={comparing.name} />
              <Row
                label="짝짓기 기준"
                value={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        comparing.matchedBy === "직접 지정" ? "outline" : "neutral"
                      }
                    >
                      {comparing.matchedBy}
                    </Badge>
                    <span className="text-badge text-fg-muted">
                      {comparing.matchedBy === "직접 지정"
                        ? "자동으로 못 찾아서 사람이 골랐습니다"
                        : "파일명을 비교해 찾았습니다. AI가 아닙니다"}
                    </span>
                  </span>
                }
              />
            </dl>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <dt className="w-20 shrink-0 text-fg-subtle">{label}</dt>
      <dd className="min-w-0 flex-1 text-fg">{value}</dd>
    </div>
  );
}
