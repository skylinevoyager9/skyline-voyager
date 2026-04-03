import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
        404
      </p>
      <h1 className="font-display mt-4 text-3xl font-semibold text-[var(--color-ink)]">
        Page not found
      </h1>
      <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
        That URL does not exist or has moved. Start from the home page or browse
        guides.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          Home
        </Link>
        <Link
          href="/guides"
          className="rounded-full border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
        >
          Guides
        </Link>
      </div>
    </main>
  );
}
