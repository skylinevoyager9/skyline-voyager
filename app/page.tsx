import type { Metadata } from "next";
import Link from "next/link";
import { GuideCardHero } from "@/components/GuideCardHero";
import { HomeFlightHero } from "@/components/home/HomeFlightHero";
import { PRODUCT_NAV } from "@/lib/site-nav";
import { guidesSortedByDate } from "@/lib/guides";
import { shouldUseDuffelFlightSearch } from "@/lib/flights/links";
import { getStaysNavHref } from "@/lib/stays/links";
import { getFlightsNavHref } from "@/lib/flights/links";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Flights, stays & cars — USA road trip guides",
  description:
    "Book flights, hotel stays, and rental cars on Skyline Voyager. Long-form USA road trip itineraries for the Pacific Coast, Southwest, and East Coast.",
};

const ROAD_TRIP_SLUGS = [
  "pacific-coast-highway-road-trip-7-days",
  "grand-canyon-las-vegas-road-trip-route",
  "west-coast-road-trip-san-francisco-los-angeles",
  "east-coast-road-trip-nyc-to-miami",
  "southwest-road-trip-denver-grand-canyon-phoenix",
];

const PRODUCT_COPY: Record<string, { blurb: string; cta: string }> = {
  flights: {
    blurb: "Search live airfares and book tickets with clear pricing before checkout.",
    cta: "Search flights",
  },
  stays: {
    blurb: "Find hotel stays for your road-trip overnights and city stopovers.",
    cta: "Search stays",
  },
  cars: {
    blurb: "Compare rental cars, one-way drop fees, and airport pickup tips.",
    cta: "Car rental guides",
  },
};

export default function Home() {
  const liveSearch = shouldUseDuffelFlightSearch();
  const flightsHref = getFlightsNavHref();
  const staysHref = getStaysNavHref();

  const products = PRODUCT_NAV.map((item) => {
    let href: string = item.href;
    if (item.id === "flights") href = flightsHref;
    if (item.id === "stays") href = staysHref;
    return { ...item, href };
  });

  const roadTrips = ROAD_TRIP_SLUGS.map((slug) =>
    guidesSortedByDate().find((g) => g.slug === slug),
  ).filter(Boolean);

  return (
    <main className="w-full min-w-0 bg-stone-100">
      <HomeFlightHero liveSearch={liveSearch} />

      <section className="border-b border-stone-200 bg-white px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            Book your trip
          </h2>
          <p className="mt-2 max-w-2xl text-stone-600">
            Flights, stays, and cars — the three things you need before you hit the road.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {products.map((p) => {
              const copy = PRODUCT_COPY[p.id];
              const isFlights = p.id === "flights";
              return (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    className={`group flex h-full flex-col rounded-3xl border bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${
                      isFlights
                        ? "border-sky-300/80 ring-2 ring-sky-400/20"
                        : "border-stone-200 hover:border-amber-900/20"
                    }`}
                  >
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      {p.label}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
                      {copy.blurb}
                    </p>
                    <span
                      className={`mt-5 text-sm font-bold ${isFlights ? "text-sky-800" : "text-amber-900"}`}
                    >
                      {copy.cta} →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              USA road trip guides
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              Long, detailed itineraries — Pacific Coast Highway, Grand Canyon, East Coast,
              Southwest, and West Coast routes.
            </p>
          </div>
          <Link
            href="/guides?cat=planning"
            className="shrink-0 text-sm font-bold text-amber-900 hover:underline"
          >
            All planning guides →
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roadTrips.map((g) =>
            g ? (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md transition hover:-translate-y-0.5 hover:border-amber-900/25 hover:shadow-xl"
                >
                  <GuideCardHero
                    guide={g}
                    className="relative h-28 sm:h-32"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <time dateTime={g.date} className="text-xs text-stone-500">
                      {g.date} · {g.readTime}
                    </time>
                    <h3 className="font-display mt-2 text-lg font-bold text-stone-900 group-hover:text-amber-950">
                      {g.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                      {g.description}
                    </p>
                    <span className="mt-4 text-sm font-bold text-amber-900">Read guide →</span>
                  </div>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="font-display text-xl font-bold text-stone-900">
            {site.name}
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">
            Book flights and stays on {site.name}. Editorial road-trip guides help you plan
            routes, budgets, and rental cars.{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-amber-950 underline decoration-amber-900/35 underline-offset-2"
            >
              Affiliate disclosure
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
