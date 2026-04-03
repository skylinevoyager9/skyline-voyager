import Link from "next/link";
import { GuideCardHero } from "@/components/GuideCardHero";
import { GuidePartnerStrip } from "@/components/GuidePartnerStrip";
import { CATEGORY_META, guides, guidesSortedByDate } from "@/lib/guides";
import { hasAnyAffiliateTracking } from "@/lib/partner-links";
import { site } from "@/lib/site";

const HERO_GLOW =
  "radial-gradient(ellipse 75% 50% at 85% 15%, rgba(212,175,55,0.14), transparent 55%), radial-gradient(ellipse 55% 40% at 10% 90%, rgba(56,189,248,0.08), transparent 50%)";

export default function Home() {
  const sorted = guidesSortedByDate();
  const featured = sorted.slice(0, 6);
  const affiliateOn = hasAnyAffiliateTracking();

  return (
    <main className="bg-stone-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-blue-950 to-black px-4 pb-24 pt-20 text-white sm:px-6 sm:pb-28 sm:pt-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: HERO_GLOW }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl sm:h-48 sm:w-48"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl sm:h-48 sm:w-48"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/95 backdrop-blur-sm">
            Business &amp; premium travelers
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80">
            <span>United States</span>
            <span className="text-white/35">·</span>
            <span>Flights &amp; stays</span>
            <span className="text-white/35">·</span>
            <span>Parks &amp; weekends</span>
          </div>

          <h1 className="font-display mt-5 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.35rem]">
            US travel with editorial clarity—cabins, stays, and routes that fit
            your standard
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/88 sm:text-lg">
            {site.legalName} publishes independent guides for travelers who read
            the details. Search flights, hotels, cars, and experiences through
            our partner tools—we may earn a commission at no extra cost to you.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="#book-trip"
              className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 px-8 py-4 text-base font-bold text-slate-900 shadow-lg ring-1 ring-amber-400/35 transition hover:from-amber-50 hover:via-white hover:to-amber-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Compare cabins &amp; stays — book in a new tab
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/guides"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/15"
              >
                {guides.length} editorial guides
              </Link>
              <Link
                href="/hotels"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/95 transition hover:border-amber-200/40 hover:bg-white/10"
              >
                Premium stays hub
              </Link>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm text-amber-100/80">
            Checkout always happens on the partner you choose. No Skyline Voyager
            account required to search.
          </p>

          <dl className="mt-14 grid grid-cols-1 gap-6 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-7 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:grid-cols-3 sm:gap-10 sm:px-10 sm:py-9">
            <div className="border-b border-white/10 pb-6 sm:border-b-0 sm:pb-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/75">
                Guides
              </dt>
              <dd className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
                {guides.length}+
              </dd>
            </div>
            <div className="border-b border-white/10 pb-6 sm:border-b-0 sm:border-l sm:border-white/10 sm:pb-0 sm:pl-10">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/75">
                Topics
              </dt>
              <dd className="font-display mt-2 text-2xl font-bold tabular-nums text-white">
                {CATEGORY_META.length}
              </dd>
            </div>
            <div className="sm:border-l sm:border-white/10 sm:pl-10">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/75">
                Focus
              </dt>
              <dd className="font-display mt-2 text-lg font-bold leading-snug text-white">
                United States
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Explore by topic
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">
              Each hub is built for business and premium trips—flights, five-star
              filters, weekends, parks, executive rental cars, and planning.
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
          {CATEGORY_META.map((c) => (
            <li key={c.id}>
              <Link
                href={c.path}
                className="group flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:border-amber-900/25 hover:shadow-xl"
              >
                <span className="text-2xl opacity-90" aria-hidden>
                  {c.icon}
                </span>
                <h3 className="font-display mt-3 text-lg font-bold text-stone-900 group-hover:text-amber-950">
                  {c.shortTitle}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {c.description}
                </p>
                <span className="mt-4 text-sm font-bold text-amber-900">
                  Open hub →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-stone-200 bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            Why discerning travelers use Skyline Voyager
          </h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Depth without noise",
                text: "Cabins, resort fees, timing, and tradeoffs—so you can decide fast without sales fluff.",
              },
              {
                title: "One place to branch out",
                text: "Air, stays, cars, parks, and weekends—each topic has its own hub and editorial guides.",
              },
              {
                title: "Transparent economics",
                text: "Partner links may pay us a commission. Fares and rates are set by airlines and OTAs—not inflated on our behalf.",
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
              Recently published across flights, premium stays, parks, and
              weekends.
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
          title="Private search — complete checkout on partner sites"
          className="mt-0"
          tone="prestige"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="font-display text-xl font-bold text-stone-900">
            {affiliateOn
              ? "Affiliate disclosure (summary)"
              : "Partner links (summary)"}
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">
            {affiliateOn ? (
              <>
                {site.legalName} may earn commissions from qualifying purchases
                or bookings made through links on this website. This does not
                increase the price you pay.
              </>
            ) : (
              <>
                Outbound links open partner booking sites in a new tab so you can
                compare prices and policies. Tracked affiliate links are not
                active yet; when they are, we will describe that in our
                disclosure—without changing the price you see on the partner site.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/affiliate-disclosure"
              className="inline-flex text-sm font-bold text-amber-900 hover:underline"
            >
              {affiliateOn
                ? "Full affiliate disclosure →"
                : "Partner & affiliate disclosure →"}
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
