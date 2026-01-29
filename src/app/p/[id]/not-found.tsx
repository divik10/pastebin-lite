import Link from "next/link";

export default function PasteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
          404 — Paste not found
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This paste does not exist or is no longer available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Create a new paste
        </Link>
      </div>
    </div>
  );
}
