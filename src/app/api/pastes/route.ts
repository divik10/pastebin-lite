import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { setPaste } from "@/lib/kv";
import type { CreatePasteInput } from "@/lib/paste";
import type { PasteRecord } from "@/lib/paste";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") ?? "";
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

const MAX_CONTENT_BYTES = 512 * 1024; // 512 KB

function validateBody(body: unknown): { error?: string; data?: CreatePasteInput } {
  if (body == null || typeof body !== "object" || !("content" in body)) {
    return { error: "Missing or invalid body" };
  }
  const { content, ttl_seconds, max_views } = body as Record<string, unknown>;
  if (typeof content !== "string" || content.trim() === "") {
    return { error: "content is required and must be a non-empty string" };
  }
  const trimmed = content.trim();
  if (new TextEncoder().encode(trimmed).length > MAX_CONTENT_BYTES) {
    return { error: `content must be at most ${MAX_CONTENT_BYTES / 1024} KB` };
  }
  if (ttl_seconds !== undefined) {
    if (typeof ttl_seconds !== "number" || !Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
      return { error: "ttl_seconds must be an integer >= 1" };
    }
  }
  if (max_views !== undefined) {
    if (typeof max_views !== "number" || !Number.isInteger(max_views) || max_views < 1) {
      return { error: "max_views must be an integer >= 1" };
    }
  }
  return {
    data: {
      content: trimmed,
      ttl_seconds: ttl_seconds as number | undefined,
      max_views: max_views as number | undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const validated = validateBody(body);
  if (validated.error) {
    return NextResponse.json(
      { error: validated.error },
      { status: 400 }
    );
  }

  const { content, ttl_seconds, max_views } = validated.data!;
  const id = randomUUID();
  const now = Date.now();

  const record: PasteRecord = {
    content,
    createdAt: now,
    ttlSeconds: ttl_seconds,
    maxViews: max_views,
    viewCount: 0,
  };

  try {
    await setPaste(id, record);
  } catch (e) {
    console.error("Failed to store paste:", e);
    return NextResponse.json(
      { error: "Storage unavailable" },
      { status: 503 }
    );
  }

  const baseUrl = getBaseUrl(request);
  const url = `${baseUrl}/p/${id}`;

  return NextResponse.json({ id, url }, { status: 201 });
}
