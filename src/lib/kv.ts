import { Redis } from "@upstash/redis";
import type { PasteRecord } from "./paste";
import { pasteKey } from "./paste";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const VIEWS_SUFFIX = ":views";

export async function getPaste(id: string): Promise<PasteRecord | null> {
  if (!redis) return null;
  const key = pasteKey(id);
  const data = await redis.get<PasteRecord>(key);
  return data;
}

export async function setPaste(id: string, record: PasteRecord): Promise<void> {
  if (!redis) throw new Error("Redis not configured");
  const key = pasteKey(id);
  await redis.set(key, record);
  if (record.maxViews != null) {
    await redis.set(`${key}${VIEWS_SUFFIX}`, 0);
  }
}

/**
 * Atomically increment view count and return the new count.
 * Uses a separate key for view count so INCR is atomic.
 */
export async function incrementViewCount(id: string): Promise<number> {
  if (!redis) throw new Error("Redis not configured");
  const key = `${pasteKey(id)}${VIEWS_SUFFIX}`;
  const newCount = await redis.incr(key);
  return newCount;
}

export async function getViewCount(id: string): Promise<number> {
  if (!redis) return 0;
  const key = `${pasteKey(id)}${VIEWS_SUFFIX}`;
  const count = await redis.get<number>(key);
  return count ?? 0;
}

export async function ping(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
