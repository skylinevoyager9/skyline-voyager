import type { Metadata } from "next";
import Link from "next/link";
import { GuidePartnerStrip } from "@/components/GuidePartnerStrip";
import { GuidesSearchableList } from "@/components/GuidesSearchableList";
import { HubBookingDock } from "@/components/HubBookingDock";
import {
  CATEGORY_META,
  DESTINATION_META,
  getAllDestinationIds,
  guidesSortedByDate,
  getCategoryMeta,
  guideRegions,
  type GuideCategory,
  type GuideDestination,
} from "@/lib/guides";
import { LIBRARY_HUB_THEME } from "@/lib/guides/hub-theme";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Travel library",
  description:
    "Editorial travel guides for premium travelers—USA, Europe, UK, Australia, Bali, and more: flights, hotels, weekends, parks, cars, and trip planning from Skyline Voyager.",
};

const CATEGORY_IDS: GuideCategory[] = [
  "flights",
  "hotels",
  "weekends",
  "parks",
  "cars",
  "planning",
];

function isCategory(s: string): s is GuideCategory {
  return CATEGORY_IDS.includes(s as GuideCategory);
}

function isDestination(s: string): s is GuideDestination {
  return getAllDestinationIds().includes(s as GuideDestination);
}

function guidesListHref(cat: GuideCategory | null, dest: GuideDestination | null) {
  const p = new URLSearchParams();
  if (cat) p.set("cat", cat);
  if (dest) p.set("dest", dest);
  const q = p.toString();
  return q ? `/guides?${q}` : "/guides";
}

type Props = { searchParams: Promise<{ cat?: string; dest?: string }> };

export default async function GuidesPage({ searchParams }: Props) {
  const { cat, dest } = await searchParams;
  const active = cat && isCategory(cat) ? cat : null;
  const activeDest = dest && isDestination(dest) ? dest : null;
  const sorted = guidesSortedByDate();
  let list = sorted;
  if (active) list = list.filter((g) => g.category === active);
  if (activeDest) {
    list = list.filter((g) => guideRegions(g).includes(activeDest));
  }

  const activeLabel = active ? getCategoryMeta(active).shortTitle : null;
  const activeDestLabel = activeDest
    ? DESTINATION_META.find((d) => d.id === activeDest)?.shortTitle ?? null
    : null;
  const theme = LIBRARY_HUB_THEME;

  return (
    <main className="bg-stone-100">
      <section
        className={`relative overflow-hidden px-4 pb-16 pt-10 text-white sm:px-6 sm:pb-20 sm:pt-14 ${theme.gradient}`}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.heroGlow }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <nav className="text-sm text-white/65" aria-label="Breadcrumb">
            <Link
              href="/"
              className="font-medium hover:text-white hover:underline"
            >
              Home
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <span className="text-white/90">Guides</span>
          </nav>

          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/95 backdrop-blur-sm">
            Business &amp; premium travelers
          </p>

          <p className="mt-6 text-sm font-medium tracking-wide text-amber-200/85">
            {theme.eyebrow}
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.35rem]">
            <span className="mr-3 inline-block opacity-95" aria-hidden>
              📚
            </span>
            Travel library
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/88 sm:text-lg">
            {theme.bookingHook}
          </p>
          <p className="mt-3 text-sm text-white/55">From {site.name}.</p>

          <p className="mt-5 text-sm text-white/60">
            <Link
              href="/destinations"
              className="font-semibold text-amber-200/95 underline decoration-amber-200/35 underline-offset-4 hover:text-white hover:decoration-white/40"
            >
              Browse by destination
            </Link>
            <span className="text-white/35"> · </span>
            USA, Australia, Bali, Europe, UK
          </p>

          <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
            {CATEGORY_META.map((c) => (
              <Link
                key={c.path}
                href={c.path}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/95 shadow-sm backdrop-blur-sm transition hover:border-amber-300/40 hover:bg-white/15 hover:text-white"
              >
                <span aria-hidden>{c.icon}</span>
                {c.shortTitle}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm text-white/60">
            <Link
              href="/#book-trip"
              className="font-semibold text-amber-200/95 underline decoration-amber-200/35 underline-offset-4 hover:text-white hover:decoration-white/40"
            >
              Full toolkit on the homepage
            </Link>
            <span className="text-white/35"> · </span>
            <span>or reserve below</span>
          </p>

          <HubBookingDock primary="flights" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              {activeLabel && activeDestLabel
                ? `${activeLabel} · ${activeDestLabel}`
                : activeLabel
                  ? `${activeLabel} guides`
                  : activeDestLabel
                    ? `${activeDestLabel} guides`
                    : "Every article"}
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              {activeLabel || activeDestLabel
                ? `Filtered${activeLabel ? ` by topic (${activeLabel})` : ""}${activeDest && activeDestLabel ? ` and destination (${activeDestLabel})` : ""}. Open a hub or destination page for more context.`
                : "Written for travelers who read the fine print—fees, timing, cabin choice, and where quality actually shows up."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {active || activeDest ? (
              <Link
                href="/guides"
                className="shrink-0 text-sm font-bold text-amber-900 hover:underline"
              >
                Clear filters →
              </Link>
            ) : null}
          </div>
        </div>

        <h3 className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-stone-500">
          Filter by destination
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={guidesListHref(active, null)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
              !activeDest
                ? "bg-teal-900 text-white shadow-md ring-1 ring-teal-800"
                : "border border-stone-300 bg-white text-stone-600 hover:border-teal-700/30 hover:text-stone-900"
            }`}
          >
            All regions ({sorted.length})
          </Link>
          {DESTINATION_META.map((d) => {
            const count = sorted.filter((g) =>
              guideRegions(g).includes(d.id),
            ).length;
            const isOn = activeDest === d.id;
            return (
              <Link
                key={d.id}
                href={guidesListHref(active, d.id)}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  isOn
                    ? "bg-teal-900 text-white shadow-md ring-1 ring-teal-800"
                    : "border border-stone-300 bg-white text-stone-600 hover:border-teal-700/30 hover:text-stone-900"
                }`}
              >
                <span className="mr-1.5" aria-hidden>
                  {d.icon}
                </span>
                {d.shortTitle} ({count})
              </Link>
            );
          })}
        </div>

        <h3 className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-stone-500">
          Filter by topic
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={guidesListHref(null, activeDest)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
              !active
                ? "bg-slate-900 text-white shadow-md ring-1 ring-slate-700"
                : "border border-stone-300 bg-white text-stone-600 hover:border-amber-800/30 hover:text-stone-900"
            }`}
          >
            All topics (
            {activeDest
              ? sorted.filter((g) => guideRegions(g).includes(activeDest))
                  .length
              : sorted.length}
            )
          </Link>
          {CATEGORY_META.map((c) => {
            const pool = activeDest
              ? sorted.filter((g) => guideRegions(g).includes(activeDest))
              : sorted;
            const count = pool.filter((g) => g.category === c.id).length;
            const isOn = active === c.id;
            return (
              <Link
                key={c.id}
                href={guidesListHref(c.id, activeDest)}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  isOn
                    ? "bg-slate-900 text-white shadow-md ring-1 ring-slate-700"
                    : "border border-stone-300 bg-white text-stone-600 hover:border-amber-800/30 hover:text-stone-900"
                }`}
              >
                {c.shortTitle} ({count})
              </Link>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="font-display text-xl font-semibold text-stone-800">
              No guides in this filter yet
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Try another topic or view the full library.
            </p>
            <Link
              href="/guides"
              className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
            >
              View all guides
            </Link>
          </div>
        ) : (
          <GuidesSearchableList guides={list} />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <GuidePartnerStrip
          emphasizePartner="flights"
          title="Private search — complete checkout on partner sites"
          className="mt-0"
          sectionId="book-trip"
          tone="prestige"
        />
      </section>
    </main>
  );
}
