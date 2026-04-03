import Link from "next/link";
import { PartnerOutboundLink } from "@/components/PartnerOutboundLink";
import { isAffiliateLink, partnerPublicBrandName } from "@/lib/partner-links";

type Props = {
  className?: string;
};

/**
 * Stays CTA wired to the `booking` partner URL (env or public fallback).
 * Uses neutral “check prices” copy until a tracked affiliate URL is configured.
 */
export function AffiliateStaySearchCta({ className = "" }: Props) {
  const tracked = isAffiliateLink("booking");
  const brand = partnerPublicBrandName("booking");

  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
      aria-labelledby="affiliate-stay-cta-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Stays &amp; hotels
      </p>
      <h2
        id="affiliate-stay-cta-heading"
        className="font-display mt-2 text-xl font-bold text-stone-900 sm:text-2xl"
      >
        {tracked
          ? "Search rates and book accommodation"
          : `Check prices on ${brand}`}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
        {tracked ? (
          <>
            Compare live listings on our linked booking partner. You complete
            checkout on their site; prices and policies are set there.
          </>
        ) : (
          <>
            We link to {brand} so you can compare live listings, taxes, and
            cancellation rules. Checkout always happens on their site—we do not
            add fees to their rates.
          </>
        )}
      </p>
      <PartnerOutboundLink
        partner="booking"
        className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-3.5 text-center text-base font-bold text-white shadow-md transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[240px]"
      >
        <span aria-hidden>🏨</span>
        {tracked ? "Open stay search" : `Check prices on ${brand}`}
        <span className="text-teal-100" aria-hidden>
          →
        </span>
      </PartnerOutboundLink>
      <p className="mt-4 text-xs text-stone-500">
        <Link
          href="/affiliate-disclosure"
          className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
        >
          {tracked ? "Affiliate disclosure" : "Partner & affiliate disclosure"}
        </Link>
        <span className="text-stone-400"> · </span>
        Opens in a new tab
      </p>
    </section>
  );
}
