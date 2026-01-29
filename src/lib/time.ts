type HeadersLike = { get(name: string): string | null };

/**
 * Returns the current time in milliseconds since epoch.
 * When TEST_MODE=1 and x-test-now-ms header is present, uses that value for expiry logic.
 */
export function getCurrentTimeMs(headers?: HeadersLike | null): number {
  if (process.env.TEST_MODE === "1" && headers) {
    const header = headers.get("x-test-now-ms");
    if (header) {
      const ms = parseInt(header, 10);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  return Date.now();
}
