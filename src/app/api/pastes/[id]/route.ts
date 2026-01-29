import { NextRequest, NextResponse } from "next/server";
import { getPaste, getViewCount, incrementViewCount } from "@/lib/kv";
import { getExpiresAt, isPasteExpired } from "@/lib/paste";
import { getCurrentTimeMs } from "@/lib/time";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getPaste(id);

  if (!record) {
    return NextResponse.json({ error: "Paste not found" }, { status: 404 });
  }

  const nowMs = getCurrentTimeMs(request.headers);

  if (isPasteExpired(record, nowMs)) {
    return NextResponse.json({ error: "Paste not found" }, { status: 404 });
  }

  if (record.maxViews != null) {
    const viewCount = await getViewCount(id);
    if (viewCount >= record.maxViews) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 });
    }
    const newCount = await incrementViewCount(id);
    if (newCount > record.maxViews) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 });
    }
    const remainingViews = record.maxViews - newCount;

    return NextResponse.json({
      content: record.content,
      remaining_views: remainingViews,
      expires_at: getExpiresAt(record),
    });
  }

  return NextResponse.json({
    content: record.content,
    remaining_views: null,
    expires_at: getExpiresAt(record),
  });
}
