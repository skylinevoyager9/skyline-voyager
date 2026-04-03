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
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={`flex min-w-0 max-w-full items-center gap-2 ${iconSubmit ? "gap-1.5" : ""} ${className}`}
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
        } ${iconSubmit ? "min-w-0 px-2.5 sm:px-3" : ""}`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-xl bg-[var(--color-accent)] font-semibold text-white transition hover:bg-[var(--color-accent-hover)] ${
          iconSubmit
            ? "flex h-9 w-9 items-center justify-center p-0 sm:h-9 sm:w-9"
            : compact
              ? "px-3 py-2 text-xs sm:text-sm"
              : "px-4 py-2.5 text-sm"
        }`}
        {...(iconSubmit ? { "aria-label": "Search" } : {})}
      >
        {iconSubmit ? (
          <SearchIcon className="shrink-0" />
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
