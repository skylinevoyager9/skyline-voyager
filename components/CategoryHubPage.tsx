import type { ReactNode } from "react";
import Link from "next/link";
import { GuidePartnerStrip } from "@/components/GuidePartnerStrip";
import { HubBookingDock } from "@/components/HubBookingDock";
import { GuideCardHero } from "@/components/GuideCardHero";
import { HUB_EMPHASIS, HUB_THEME } from "@/lib/guides/hub-theme";
import {
  getCategoryMeta,
  getGuidesByCategory,
  guidesSortedByDate,
  type GuideCategory,
} from "@/lib/guides";

export function CategoryHubPage({
  category,
  prePartnerSlot,
}: {
  category: GuideCategory;
  /** Shown above the partner strip (e.g. hotels hub compliance / future embeds). */
  prePartnerSlot?: ReactNode;
}) {
  const meta = getCategoryMeta(category);
  const theme = HUB_THEME[category];
  const emphasis = HUB_EMPHASIS[category];
  const posts = getGuidesByCategory(category).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const related = guidesSortedByDate()
    .filter((g) => g.category !== category)
    .slice(0, 4);

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
            <Link href="/" className="font-medium hover:text-white hover:underline">
              Home
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <Link
              href="/guides"
              className="font-medium hover:text-white hover:underline"
            >
              Guides
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <span className="text-white/90">{meta.shortTitle}</span>
          </nav>

          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/95 backdrop-blur-sm">
            Business &amp; premium travelers
          </p>

          <p className="mt-6 text-sm font-medium tracking-wide text-amber-200/85">
            {theme.eyebrow}
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.35rem]">
            <span className="mr-3 inline-block opacity-95" aria-hidden>
              {meta.icon}
            </span>
            {meta.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/88 sm:text-lg">
            {theme.bookingHook}
          </p>

          <HubBookingDock primary={emphasis} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Editorial guides
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              Written for travelers who read the fine print—fees, timing, cabin
              choice, and where quality actually shows up.
            </p>
          </div>
          <Link
            href="/guides"
            className="shrink-0 text-sm font-bold text-amber-900/90 hover:underline"
          >
            All topics →
          </Link>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {posts.map((g) => (
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
                  <h3 className="font-display mt-3 text-xl font-bold text-stone-900 group-hover:text-amber-950">
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
          ))}
        </ul>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-stone-600">
            More guides for this topic are on the way. Browse{" "}
            <Link
              href="/guides"
              className="font-bold text-amber-900 hover:underline"
            >
              all guides
            </Link>
            .
          </p>
        ) : null}
      </section>

      <section className="border-t border-stone-200 bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-xl font-bold text-stone-900 sm:text-2xl">
            Other journeys
          </h2>
          <p className="mt-2 max-w-xl text-sm text-stone-600">
            Cross-topic picks for a fuller itinerary.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="block rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-sm font-semibold text-stone-800 transition hover:border-amber-800/30 hover:bg-white hover:text-amber-950"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {prePartnerSlot ? (
          <div className="mb-12 space-y-6">{prePartnerSlot}</div>
        ) : null}
        <GuidePartnerStrip
          emphasizePartner={emphasis}
          title="Private search — complete checkout on partner sites"
          className="mt-0"
          sectionId="book-trip"
          tone="prestige"
        />
      </section>
    </main>
  );
}
