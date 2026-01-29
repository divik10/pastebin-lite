"use client";

import { useState } from "react";
import Link from "next/link";

type CreateResponse = { id: string; url: string };
type ErrorResponse = { error: string };

export default function Home() {
  const [content, setContent] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUrl(null);
    if (!content.trim()) {
      setError("Content is required and must be non-empty.");
      return;
    }
    setLoading(true);
    try {
      const body: { content: string; ttl_seconds?: number; max_views?: number } = {
        content: content.trim(),
      };
      if (ttlSeconds) {
        const n = parseInt(ttlSeconds, 10);
        if (isNaN(n) || n < 1) {
          setError("ttl_seconds must be an integer >= 1");
          setLoading(false);
          return;
        }
        body.ttl_seconds = n;
      }
      if (maxViews) {
        const n = parseInt(maxViews, 10);
        if (isNaN(n) || n < 1) {
          setError("max_views must be an integer >= 1");
          setLoading(false);
          return;
        }
        body.max_views = n;
      }
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as ErrorResponse).error ?? "Failed to create paste");
        setLoading(false);
        return;
      }
      setUrl((data as CreateResponse).url);
      setContent("");
      setTtlSeconds("");
      setMaxViews("");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-6">
          Pastebin-Lite
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Create a paste and share the link. Optionally set expiry (TTL) or a view limit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 font-mono text-sm"
              placeholder="Paste your text here..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ttl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                TTL (seconds, optional)
              </label>
              <input
                id="ttl"
                type="number"
                min={1}
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                placeholder="e.g. 60"
              />
            </div>
            <div>
              <label htmlFor="max_views" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Max views (optional)
              </label>
              <input
                id="max_views"
                type="number"
                min={1}
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create paste"}
          </button>
        </form>

        {url && (
          <div className="mt-8 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
              Paste created. Share this link:
            </p>
            <Link
              href={url}
              className="block break-all text-green-700 dark:text-green-400 hover:underline font-mono text-sm"
            >
              {url}
            </Link>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
              }}
              className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
