import type { Metadata } from "next";
import Link from "next/link";
import { GuideCardHero } from "@/components/GuideCardHero";
import { GuidePartnerStrip } from "@/components/GuidePartnerStrip";
import { HomeFlightHero } from "@/components/home/HomeFlightHero";
import { CATEGORY_META, DESTINATION_META, guides, guidesSortedByDate } from "@/lib/guides";
import { shouldUseDuffelFlightSearch } from "@/lib/flights/links";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live flight search & US travel guides",
  description:
    "Search live airfares and book flights on Skyline Voyager. Editorial US travel guides for hotels, weekends, and national parks.",
};

export default function Home() {
  const sorted = guidesSortedByDate();
  const featured = sorted.slice(0, 6);
  const liveSearch = shouldUseDuffelFlightSearch();

  const topics = [
    ...CATEGORY_META.filter((c) => c.id === "flights"),
    ...CATEGORY_META.filter((c) => c.id !== "flights"),
  ];

  return (
    <main className="w-full min-w-0 bg-stone-100">
      <HomeFlightHero liveSearch={liveSearch} />

      <section className="border-b border-stone-200 bg-white px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-xl font-bold text-stone-900 sm:text-2xl">
            Explore by destination
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
            Plan your route, then{" "}
            <Link
              href={liveSearch ? "/flights/search" : "/flights"}
              className="font-semibold text-sky-800 underline decoration-sky-800/30 underline-offset-2 hover:decoration-sky-800"
            >
              search live airfares
            </Link>{" "}
            or browse stay guides by region.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            {DESTINATION_META.map((d) => (
              <li key={d.id}>
                <Link
                  href={d.path}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-sky-800/35 hover:bg-white"
                >
                  <span className="mr-2" aria-hidden>
                    {d.icon}
                  </span>
                  {d.shortTitle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/destinations"
                className="inline-flex min-h-[44px] items-center rounded-full border border-sky-900/25 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950 transition hover:bg-sky-100/90"
              >
                All destinations →
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Explore by topic
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              Flights and live fares first—then hotels, weekends, parks, cars, and
              planning guides.
            </p>
          </div>
          <Link
            href="/guides"
            className="shrink-0 text-sm font-bold text-amber-900 hover:underline"
          >
            Full library →
          </Link>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((c) => {
            const isFlights = c.id === "flights";
            const href = isFlights && liveSearch ? "/flights/search" : c.path;
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  className={`group flex h-full flex-col rounded-3xl border bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${
                    isFlights
                      ? "border-sky-300/80 ring-2 ring-sky-400/25 hover:border-sky-500/50"
                      : "border-stone-200 hover:border-amber-900/25"
                  }`}
                >
                  {isFlights ? (
                    <span className="mb-2 inline-flex w-fit rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                      Live search
                    </span>
                  ) : null}
                  <span className="text-2xl opacity-90" aria-hidden>
                    {c.icon}
                  </span>
                  <h3 className="font-display mt-3 text-lg font-bold text-stone-900 group-hover:text-sky-950">
                    {c.shortTitle}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                    {isFlights && liveSearch
                      ? "Search real-time fares and book on Skyline Voyager."
                      : c.description}
                  </p>
                  <span
                    className={`mt-4 text-sm font-bold ${isFlights ? "text-sky-800" : "text-amber-900"}`}
                  >
                    {isFlights && liveSearch ? "Search flights →" : "Open hub →"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-stone-200 bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            Why book flights on Skyline Voyager
          </h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Live airline inventory",
                text: "See current offers and prices—not stale screenshots or outdated lists.",
              },
              {
                title: "Clear total price",
                text: "Base fare plus a stated service fee before you pay. No surprise markup at checkout.",
              },
              {
                title: "Guides when you need them",
                text: "Cabins, bags, and timing—editorial hubs for hotels, parks, and weekends too.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
              >
                <h3 className="font-display text-lg font-bold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Latest editorial guides
            </h2>
            <p className="mt-2 max-w-lg text-stone-600">
              Recently published across flights, premium stays, parks, and weekends.
            </p>
          </div>
          <Link
            href="/guides"
            className="text-sm font-bold text-amber-900 hover:underline"
          >
            Browse all →
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((g) => {
            const cat = CATEGORY_META.find((c) => c.id === g.category);
            return (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md transition hover:-translate-y-0.5 hover:border-amber-900/25 hover:shadow-xl"
                >
                  <GuideCardHero
                    guide={g}
                    className="relative h-24 sm:h-28"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900/80">
                      {cat?.shortTitle}
                    </span>
                    <time
                      dateTime={g.date}
                      className="mt-2 text-xs text-stone-500"
                    >
                      {g.date}
                    </time>
                    <h3 className="font-display mt-2 text-lg font-bold text-stone-900 group-hover:text-amber-950">
                      {g.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                      {g.description}
                    </p>
                    <span className="mt-4 text-sm font-bold text-amber-900">
                      Read →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <GuidePartnerStrip
          title={
            liveSearch
              ? "Book flights on Skyline Voyager"
              : "Private search — complete checkout on partner sites"
          }
          emphasizePartner="flights"
          className="mt-0"
          tone="prestige"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="font-display text-xl font-bold text-stone-900">
            Booking &amp; disclosure (summary)
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">
            <>
              <strong className="text-stone-900">Flights</strong> are booked on
              Skyline Voyager with live Duffel fares (service fee shown before
              checkout). <strong className="text-stone-900">Hotel guides</strong> are
              editorial—we do not use Booking.com or similar stay marketplaces.{" "}
              <Link
                href="/affiliate-disclosure"
                className="font-semibold text-amber-950 underline decoration-amber-900/35 underline-offset-2 hover:decoration-amber-900"
              >
                Full disclosure
              </Link>
              .
            </>
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/affiliate-disclosure"
              className="inline-flex text-sm font-bold text-amber-900 hover:underline"
            >
              Full disclosure →
            </Link>
            <Link
              href="/legal"
              className="inline-flex text-sm font-semibold text-stone-600 hover:text-amber-950 hover:underline"
            >
              Privacy, terms &amp; legal →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
