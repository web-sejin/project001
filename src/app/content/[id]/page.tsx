import { ContentDetailRoute } from "@/components/content/ContentDetailRoute";
import type { TabKey } from "@/components/content/ContentDetail";

const TAB_KEYS: TabKey[] = ["shoot", "upload", "retouch", "publish"];

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const initialTab: TabKey = TAB_KEYS.includes(tab as TabKey)
    ? (tab as TabKey)
    : "shoot";

  return <ContentDetailRoute id={id} initialTab={initialTab} />;
}
