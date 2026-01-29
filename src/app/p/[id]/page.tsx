import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPaste, getViewCount, incrementViewCount } from "@/lib/kv";
import { isPasteExpired } from "@/lib/paste";
import { getCurrentTimeMs } from "@/lib/time";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

export default async function PastePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const record = await getPaste(id);

  if (!record) notFound();

  const nowMs = getCurrentTimeMs(headersList);

  if (isPasteExpired(record, nowMs)) notFound();

  if (record.maxViews != null) {
    const viewCount = await getViewCount(id);
    if (viewCount >= record.maxViews) notFound();
    await incrementViewCount(id);
  }

  const safeContent = escapeHtml(record.content);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
          {safeContent}
        </pre>
      </div>
    </div>
  );
}
