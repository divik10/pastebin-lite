# Pastebin-Lite

A small Pastebin-like application. Users can create a text paste, get a shareable URL, and view pastes. Pastes may optionally expire after a TTL or after a maximum view count.

## How to run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up persistence (Upstash Redis)**

   Create a Redis database at [Upstash](https://console.upstash.com/) and add the following environment variables (e.g. in `.env.local`):

   ```
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

   For deployment on Vercel, add the same variables in the project settings or connect the Upstash Redis integration from the Vercel marketplace (it will inject these for you).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build and run in production**

   ```bash
   npm run build
   npm start
   ```

## Persistence layer

**Upstash Redis** is used for storage. Paste data and view counts are stored in Redis so they survive across serverless invocations. This is required for deployment on Vercel (or any serverless platform), where in-memory storage would not persist between requests.

- Paste records are stored under keys `paste:<id>`.
- View counts (when `max_views` is set) are stored under `paste:<id>:views` and incremented atomically with Redis `INCR` so view limits are enforced correctly under concurrent access.

## Design decisions

- **Upstash Redis** was chosen for persistence because it works well with Vercel/serverless (HTTP-based, no long-lived connections) and is easy to attach via the Vercel marketplace. No database migrations or shell access are needed.
- **Deterministic time for testing:** When `TEST_MODE=1` is set, the `x-test-now-ms` request header is used as the current time for TTL/expiry checks only, so automated tests can assert expiry without waiting.
- **View counting:** View count is stored in a separate Redis key and updated with `INCR` so that under concurrent requests we do not serve a paste beyond its `max_views`.
- **Paste content on the HTML page** is escaped (HTML entities for `<`, `>`, `&`, etc.) so it is rendered safely and does not execute script.
- **404 for unavailable pastes:** Missing, expired, or view-limit-exceeded pastes all return HTTP 404 (both for `GET /api/pastes/:id` and `GET /p/:id`) so the behaviour is consistent and clients do not need to distinguish reasons.

## API summary

- `GET /api/healthz` — Health check; returns `{ "ok": true }` when the app can reach Redis.
- `POST /api/pastes` — Create a paste. Body: `{ "content": "string", "ttl_seconds"?: number, "max_views"?: number }`. Returns `{ "id", "url" }`.
- `GET /api/pastes/:id` — Fetch a paste (counts as a view when applicable). Returns `{ "content", "remaining_views", "expires_at" }` or 404.

## Production readiness

The app is suitable for production deployment (e.g. on Vercel) with the following in place:

- **Persistence:** Upstash Redis survives across serverless invocations; no in-memory state.
- **Security:** Paste content is escaped when rendered (no script execution); security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) are set.
- **Abuse prevention:** Paste content is limited to 512 KB per paste to avoid storage abuse.
- **Error handling:** Invalid input returns 4xx with JSON; storage failures return 503; unavailable pastes return 404.
- **No secrets in repo:** Credentials live in environment variables only.

Optional improvements for higher traffic or stricter requirements: rate limiting (e.g. Vercel or Upstash), Redis TTL for expired pastes to free memory, and monitoring/alerting on health check failures.

## Repository requirements

- No hardcoded absolute URLs (e.g. localhost) in committed code.
- No secrets or credentials in the repository; use environment variables.
- Server-side code does not rely on global mutable state; all persistence goes through Redis.
