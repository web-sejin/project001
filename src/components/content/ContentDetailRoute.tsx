"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ContentDetail, type TabKey } from "./ContentDetail";
import { CHANNELS } from "@/data/contents";
import { getChannelCopy } from "@/data/copy";
import { useStore } from "@/store/MockStore";

/**
 * 상세 화면의 데이터 조립부.
 * 라우트 파라미터만 서버에서 받고, 실제 데이터는 목업 스토어에서 읽는다.
 * 화면에서 새로 등록한 촬영 건도 그대로 열려야 하기 때문이다.
 */
export function ContentDetailRoute({
  id,
  initialTab,
}: {
  id: string;
  initialTab: TabKey;
}) {
  const store = useStore();
  const content = store.contentOf(id);
  const acc = content ? store.accommodationOf(content.accommodationId) : undefined;
  const analysis = store.analysisOf(id);
  const photos = store.photosOf(id);

  const copies = useMemo(
    () =>
      acc
        ? Object.fromEntries(CHANNELS.map((ch) => [ch.id, getChannelCopy(ch.id, acc)]))
        : {},
    [acc],
  );

  if (!content || !acc || !analysis) {
    return (
      <div className="p-6">
        <h1 className="text-page font-semibold text-fg">
          콘텐츠를 찾을 수 없습니다
        </h1>
        <p className="mt-1 text-body text-fg-muted">
          삭제됐거나, 새로고침으로 목업 데이터가 초기화된 뒤의 주소일 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-box border border-line-strong bg-surface px-3 py-1.5 text-body font-semibold text-fg"
        >
          현황판으로 이동
        </Link>
      </div>
    );
  }

  return (
    <ContentDetail
      content={content}
      acc={acc}
      analysis={analysis}
      photos={photos}
      channels={CHANNELS}
      copies={copies}
      initialTab={initialTab}
    />
  );
}
