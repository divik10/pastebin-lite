export interface PasteRecord {
  content: string;
  createdAt: number;
  ttlSeconds?: number;
  maxViews?: number;
  viewCount: number;
}

export interface CreatePasteInput {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export function pasteKey(id: string): string {
  return `paste:${id}`;
}

export function isPasteExpired(
  record: PasteRecord,
  nowMs: number
): boolean {
  if (!record.ttlSeconds) return false;
  const expiresAt = record.createdAt + record.ttlSeconds * 1000;
  return nowMs >= expiresAt;
}

export function isViewLimitExceeded(record: PasteRecord): boolean {
  if (record.maxViews == null) return false;
  return record.viewCount >= record.maxViews;
}

export function getExpiresAt(record: PasteRecord): string | null {
  if (!record.ttlSeconds) return null;
  const expiresAt = record.createdAt + record.ttlSeconds * 1000;
  return new Date(expiresAt).toISOString();
}

export function getRemainingViews(record: PasteRecord): number | null {
  if (record.maxViews == null) return null;
  return Math.max(0, record.maxViews - record.viewCount);
}
