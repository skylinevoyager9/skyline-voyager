import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    `${site.name} (${site.legalName}) helps premium travelers research and book stays and flights through trusted partners including Booking.com—editorial guides first, checkout on partner sites.`,
};

const HERO_GLOW =
  "radial-gradient(ellipse 70% 50% at 75% 15%, rgba(212,175,55,0.12), transparent 50%), radial-gradient(ellipse 45% 40% at 20% 90%, rgba(255,255,255,0.06), transparent 45%)";

export default function AboutPage() {
  return (
    <main className="bg-stone-100">
      <section className="relative overflow-hidden px-4 pb-12 pt-10 text-white sm:px-6 sm:pb-14 sm:pt-12 bg-gradient-to-br from-slate-950 via-zinc-900 to-black">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: HERO_GLOW }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl">
          <nav className="text-sm text-white/65" aria-label="Breadcrumb">
            <Link href="/" className="font-medium hover:text-white hover:underline">
              Home
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <span className="text-white/90">About</span>
          </nav>

          <p className="mt-8 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/95 backdrop-blur-sm">
            Business &amp; premium travelers
          </p>

          <h1 className="font-display mt-5 text-3xl font-bold leading-tight sm:text-4xl">
            About {site.name}
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-white/85">
            US publisher of independent travel guidance—lodging and trips first,
            honest tradeoffs, not brochure copy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <section
            id="how-it-works"
            className="border-b border-stone-200 pb-8"
            aria-labelledby="how-it-works-heading"
          >
            <h2
              id="how-it-works-heading"
              className="font-display text-xl font-bold text-stone-900"
            >
              How this site works
            </h2>
            <p className="mt-3 text-stone-700 leading-relaxed">
              We help premium travelers <strong className="text-stone-900">research</strong>{" "}
              destinations and cabin or room choices, then{" "}
              <strong className="text-stone-900">book flights, hotels, and stays</strong>{" "}
              through trusted booking partners—including{" "}
              <strong className="text-stone-900">Booking.com</strong> for hotel and
              vacation-rental search when you use our stay tools. Editorial guides
              explain fees, timing, and tradeoffs;{" "}
              <strong className="text-stone-900">checkout always happens on the partner</strong>{" "}
              you choose (new tab). We are working toward formal affiliate
              relationships with major booking platforms and use tracking links only
              in line with their brand-safety and disclosure rules—see our{" "}
              <Link
                href="/affiliate-disclosure"
                className="font-bold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
              >
                affiliate disclosure
              </Link>
              .
            </p>
          </section>

          <p className="mt-8 text-stone-700 leading-relaxed">
            {site.legalName} is a United States–based publisher of independent
            guides for travelers who care about{" "}
            <strong className="text-stone-900">premium and boutique stays</strong>
            , <strong className="text-stone-900">neighborhood fit and total stay cost</strong>
            , <strong className="text-stone-900">cabins and fare classes</strong>
            , <strong className="text-stone-900">short elevated breaks</strong>,{" "}
            <strong className="text-stone-900">national parks</strong>,{" "}
            <strong className="text-stone-900">rental cars</strong> (including
            larger and premium categories where available), and{" "}
            <strong className="text-stone-900">time-efficient trip planning</strong>
            . The goal is practical advice you can use quickly—without filler or
            hidden agendas in the writing.
          </p>
          <p className="mt-5 text-stone-700 leading-relaxed">
            This site is supported in part through affiliate relationships with
            booking platforms, flight search tools, and experience providers.
            When you use our links, we may receive a commission.{" "}
            <strong className="text-stone-900">
              That does not increase the price you pay.
            </strong>{" "}
            Read the full details on our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-bold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
            >
              affiliate disclosure
            </Link>{" "}
            page.
          </p>
          <p className="mt-5 text-stone-700 leading-relaxed">
            We are <strong className="text-stone-900">not a travel agency</strong>{" "}
            and we do not issue airline tickets or take payment for your bookings.
            You complete checkout on the partner site you choose—always in a new
            tab when you use our tools from this site.
          </p>

          <section
            id="partnerships"
            className="mt-10 border-t border-stone-200 pt-10"
            aria-labelledby="partnerships-heading"
          >
            <h2
              id="partnerships-heading"
              className="font-display text-lg font-bold text-stone-900"
            >
              Brands, networks &amp; press
            </h2>
            <p className="mt-3 text-stone-700 leading-relaxed">
              {site.legalName} is a US-based editorial travel publisher. Primary
              focus: <strong className="text-stone-900">domestic lodging and trips</strong>{" "}
              for business and premium leisure readers. We surface live search and
              booking through partner programs where disclosed;{" "}
              <strong className="text-stone-900">checkout always happens on the partner</strong>
              . For media kits, verification, or partnership questions, email{" "}
              <a
                href={`mailto:${site.email}?subject=Partnership%20inquiry`}
                className="font-bold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
              >
                {site.email}
              </a>
              —include your network or program name in the subject line so we can
              respond quickly.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-stone-200 pt-8">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Contact
            </Link>
            <Link
              href="/guides"
              className="inline-flex rounded-full border border-stone-300 px-5 py-2.5 text-sm font-bold text-stone-800 transition hover:border-amber-800/40"
            >
              Browse guides
            </Link>
            <Link
              href="/legal"
              className="inline-flex items-center text-sm font-semibold text-amber-900 hover:underline"
            >
              Legal &amp; privacy →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
