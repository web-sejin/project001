"use client";

import { useMemo, useRef, useState } from "react";
import { AiBadge } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { UNCLASSIFIED, countByLabel, guessLabel } from "@/lib/photoLabel";
import { useStore } from "@/store/MockStore";
import type { Content, UploadedPhoto } from "@/data/types";
import type { MissingItem } from "@/data/analysis";

/**
 * 재촬영분 · 누락분 추가 업로드.
 *
 * 첫 업로드만 되고 그 뒤가 없으면 재촬영 흐름이 끊긴다.
 * 누락으로 잡힌 컷을 다시 찍어 올리면 경고가 그 자리에서 해소돼야 한다.
 */
export function ReshootUpload({
  content,
  missing,
}: {
  content: Content;
  missing: MissingItem[];
}) {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const files = store.uploadsOf(content.id);
  const shotList = store.shotListOf(content.accommodationId);
  const labels = useMemo(() => shotList.map((s) => s.label), [shotList]);
  const counts = useMemo(() => countByLabel(files), [files]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const added: UploadedPhoto[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((f, i) => ({
        id: `${content.id}-re-${Date.now()}-${i}`,
        contentId: content.id,
        name: f.name,
        url: URL.createObjectURL(f),
        label: guessLabel(f.name, labels),
      }));
    store.addUploads(content.id, added);
  };

  return (
    <Panel>
      <PanelHeader
        title="추가 업로드"
        description="재촬영분이나 빠졌던 컷을 여기서 올립니다. 올리면 누락 경고가 다시 계산됩니다."
        right={
          files.length > 0 ? (
            <>
              <Badge variant="neutral">
                추가분 <span className="tnum">{files.length}</span>장
              </Badge>
              <Button
                size="sm"
                variant="quiet"
                onClick={() => store.clearUploads(content.id)}
              >
                비우기
              </Button>
            </>
          ) : null
        }
      />

      <div className="p-4">
        {missing.length > 0 ? (
          <p className="mb-3 rounded-box border border-[#EFC2C1] bg-[#FBEAEA] px-3 py-2 text-badge leading-[16px] text-fg-muted">
            아직 필요한 컷:{" "}
            <span className="font-semibold text-danger">
              {missing.map((m) => `${m.label} ${m.required - m.found}장`).join(", ")}
            </span>
          </p>
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
            사진을 끌어다 놓거나 선택하세요
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

        {files.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-body font-semibold text-fg">추가분 분류</span>
              <AiBadge label="파일명 기반 추정 (모의)" />
              {counts[UNCLASSIFIED] ? (
                <Badge variant="warn">
                  미분류 <span className="tnum">{counts[UNCLASSIFIED]}</span>장 · 직접
                  지정하세요
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {files.map((f) => (
                <figure key={f.id} className="min-w-0">
                  {/* 방금 고른 로컬 파일이라 next/image 를 쓰지 않는다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.name}
                    className="aspect-[4/3] w-full rounded-box border border-line object-cover"
                  />
                  <figcaption className="mt-1">
                    <select
                      value={f.label}
                      onChange={(e) =>
                        store.setUploadLabel(content.id, f.id, e.target.value)
                      }
                      aria-label={`${f.name} 분류`}
                      className={`w-full truncate rounded-box border bg-canvas px-1 py-0.5 text-badge outline-none focus:border-ai ${
                        f.label === UNCLASSIFIED
                          ? "border-warn text-warn"
                          : "border-line text-ai"
                      }`}
                    >
                      <option value={UNCLASSIFIED}>{UNCLASSIFIED}</option>
                      {labels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <span className="mt-px block truncate text-badge text-fg-subtle">
                      {f.name}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
