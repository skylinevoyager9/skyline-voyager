import type { Metadata } from "next";
import Link from "next/link";
import { SiteSearchForm } from "@/components/SiteSearchForm";
import { searchSite, type SearchItemType } from "@/lib/search/site-search";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search",
  description: `Search ${site.name} for guides, destination hubs, topics, and pages.`,
  robots: { index: true, follow: true },
};

const TYPE_LABEL: Record<SearchItemType, string> = {
  guide: "Guide",
  destination: "Destination",
  hub: "Topic hub",
  page: "Page",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = searchSite(query);

  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
          <Link
            href="/"
            className="font-medium text-stone-700 hover:text-amber-950 hover:underline"
          >
            Home
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="text-stone-600">Search</span>
        </nav>

        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900 sm:text-4xl">
          Search the site
        </h1>
        <p className="mt-3 text-stone-600">
          Guides, destination hubs, topic pages (flights, hotels, …), and legal
          pages—all in one index.
        </p>

        <div className="mt-8">
          <SiteSearchForm defaultQuery={query} inputId="site-search-main" />
        </div>

        {query ? (
          <div className="mt-10">
            <p className="text-sm text-stone-500">
              {results.length === 0
                ? `No results for “${query}”. Try different words or browse `
                : `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”. Also try `}
              <Link
                href="/guides"
                className="font-semibold text-amber-900 hover:underline"
              >
                /guides
              </Link>
              {results.length === 0 ? "." : " for filters."}
            </p>

            {results.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {results.map((item) => (
                  <li key={`${item.type}-${item.href}`}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-800/25 hover:shadow-md"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wide text-amber-900/85">
                        {TYPE_LABEL[item.type]}
                        {item.hint ? ` · ${item.hint}` : ""}
                      </span>
                      <span className="mt-1 block font-display text-lg font-semibold text-stone-900">
                        {item.title}
                      </span>
                      <span className="mt-2 line-clamp-2 text-sm text-stone-600">
                        {item.description}
                      </span>
                      <span className="mt-3 text-xs font-mono text-stone-400">
                        {item.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-10 text-sm text-stone-500">
            Enter a keyword to search. You can match{" "}
            <strong className="font-medium text-stone-700">multiple words</strong>{" "}
            (all must appear somewhere in the title, description, or path).
          </p>
        )}
      </div>
    </main>
  );
}
