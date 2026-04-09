type Props = {
  defaultQuery?: string;
  inputId: string;
  /** Tighter layout for the header */
  compact?: boolean;
  /** Icon-only submit (saves width in capped header columns; use with compact) */
  iconSubmit?: boolean;
  className?: string;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SiteSearchForm({
  defaultQuery = "",
  inputId,
  compact = false,
  iconSubmit = false,
  className = "",
}: Props) {
  /** Icon-inside-input keeps width inside the grid column (avoids overlapping the nav). */
  if (iconSubmit) {
    return (
      <form
        action="/search"
        method="get"
        role="search"
        className={`relative min-w-0 max-w-full ${className}`}
      >
        <label htmlFor={inputId} className="sr-only">
          Search {compact ? "site" : "guides, destinations, and pages"}
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={compact ? "Search…" : "Guides, destinations, topics…"}
          autoComplete="off"
          className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white py-2 pl-3 pr-11 text-sm text-[var(--color-ink)] outline-none ring-teal-600/0 transition placeholder:text-[var(--color-ink-faint)] focus:border-teal-600/40 focus:ring-2 focus:ring-teal-600/20"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1/2 flex h-8 w-8 shrink-0 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <SearchIcon className="shrink-0" />
        </button>
      </form>
    );
  }

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={`flex min-w-0 max-w-full items-center gap-2 ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search {compact ? "site" : "guides, destinations, and pages"}
      </label>
      <input
        id={inputId}
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder={compact ? "Search…" : "Guides, destinations, topics…"}
        autoComplete="off"
        className={`min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] outline-none ring-teal-600/0 transition placeholder:text-[var(--color-ink-faint)] focus:border-teal-600/40 focus:ring-2 focus:ring-teal-600/20 ${
          compact ? "py-2" : "py-2.5 sm:px-4"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-xl bg-[var(--color-accent)] font-semibold text-white transition hover:bg-[var(--color-accent-hover)] ${
          compact
            ? "px-3 py-2 text-xs sm:text-sm"
            : "px-4 py-2.5 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
