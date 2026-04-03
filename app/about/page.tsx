import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    `${site.name} publishes US travel guides for business and premium travelers—editorial depth, transparent partner links, checkout on the brands you trust.`,
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
            Editorial US travel guidance—honest tradeoffs, not brochure copy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-stone-700 leading-relaxed">
            {site.legalName} publishes independent guides for travelers who care
            about <strong className="text-stone-900">cabins and fare classes</strong>
            , <strong className="text-stone-900">premium and boutique stays</strong>
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
            flight search tools, booking platforms, and experience providers.
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
