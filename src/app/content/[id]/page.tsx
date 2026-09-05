import { notFound } from "next/navigation";
import { ContentDetail, type TabKey } from "@/components/content/ContentDetail";
import { getAccommodation } from "@/data/accommodations";
import { getAnalysis } from "@/data/analysis";
import { CHANNELS, CONTENTS, getContent } from "@/data/contents";
import { getChannelCopy } from "@/data/copy";
import { getPhotos } from "@/data/photos";

const TAB_KEYS: TabKey[] = ["shoot", "upload", "retouch", "publish"];

export function generateStaticParams() {
  return CONTENTS.map((c) => ({ id: c.id }));
}

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const content = getContent(id);
  if (!content) notFound();

  const acc = getAccommodation(content.accommodationId);
  const analysis = getAnalysis(id);
  if (!acc || !analysis) notFound();

  const photos = getPhotos(id);
  const copies = Object.fromEntries(
    CHANNELS.map((ch) => [ch.id, getChannelCopy(ch.id, acc)]),
  );

  const initialTab: TabKey = TAB_KEYS.includes(tab as TabKey)
    ? (tab as TabKey)
    : "shoot";

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
