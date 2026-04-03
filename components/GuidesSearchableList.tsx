"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GuideCardHero } from "@/components/GuideCardHero";
import { getCategoryMeta, type Guide } from "@/lib/guides";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Every token in the query must appear somewhere in the guide’s searchable text. */
function guideMatchesQuery(guide: Guide, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const meta = getCategoryMeta(guide.category);
  const blob = normalize(
    `${guide.title} ${guide.description} ${guide.slug.replaceAll("-", " ")} ${meta.shortTitle} ${meta.title}`,
  );
  return q.split(/\s+/).every((token) => token.length > 0 && blob.includes(token));
}

type Props = {
  guides: Guide[];
};

export function GuidesSearchableList({ guides }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => guides.filter((g) => guideMatchesQuery(g, query)),
    [guides, query],
  );

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  return (
    <div>
      <div
        className="mt-10 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        role="search"
        aria-label="Search guides"
      >
        <label
          htmlFor="guides-search"
          className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500"
        >
          Search guides
        </label>
        <input
          id="guides-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, topic, or keywords…"
          autoComplete="off"
          className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-base text-stone-900 outline-none ring-teal-600/0 transition placeholder:text-stone-400 focus:border-teal-600/40 focus:bg-white focus:ring-2 focus:ring-teal-600/25"
        />
        <p className="mt-2 text-xs text-stone-500">
          {searching ? (
            <>
              {filtered.length === 0
                ? "No matches — try fewer words or a topic filter."
                : `${filtered.length} ${filtered.length === 1 ? "guide matches" : "guides match"} “${trimmed}”.`}
            </>
          ) : (
            <>Searching titles, descriptions, and topics. No extra cost or signup.</>
          )}
        </p>
      </div>

      {searching && filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
          <p className="font-display text-xl font-semibold text-stone-800">
            No guides match your search
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Clear the box or try a topic filter above.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {filtered.map((g) => {
            const catMeta = getCategoryMeta(g.category);
            return (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-md transition hover:-translate-y-0.5 hover:border-amber-900/25 hover:shadow-xl"
                >
                  <GuideCardHero guide={g} />
                  <div className="flex flex-1 flex-col p-6">
                    <time
                      dateTime={g.date}
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                    >
                      {g.date} · {g.readTime}
                    </time>
                    <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900/85">
                      {catMeta.shortTitle}
                    </span>
                    <h3 className="font-display mt-2 text-xl font-bold text-stone-900 group-hover:text-amber-950">
                      {g.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                      {g.description}
                    </p>
                    <span className="mt-5 inline-flex items-center text-sm font-bold text-amber-900">
                      Continue reading
                      <span
                        className="ml-1 transition group-hover:translate-x-0.5"
                        aria-hidden
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
