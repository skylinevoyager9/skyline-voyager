import type { Metadata } from "next";
import Link from "next/link";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { usesDuffelFlightBooking } from "@/lib/booking/platform";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How Skyline Voyager handles flight booking (Duffel), pricing, and optional partner links for cars and experiences.",
};

export default function AffiliateDisclosurePage() {
  const duffelOn = usesDuffelFlightBooking();

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Affiliate &amp; booking disclosure
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-faint)]">
        Last updated: April 9, 2026
      </p>

      <section className="mt-10 space-y-4 text-[var(--color-ink-muted)] leading-relaxed">
        <p>
          {site.legalName} (“{site.name},” “we,” “us”) operates{" "}
          <Link
            href={site.url}
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {site.domain}
          </Link>
          . This page explains how money flows when you use our site.
        </p>

        <h2 className="font-display pt-4 text-xl font-semibold text-[var(--color-ink)]">
          Flight booking on Skyline Voyager
        </h2>
        <p>
          {duffelOn ? (
            <>
              We offer <strong>live flight search and booking</strong> powered by
              Duffel. You search on our site, pay at checkout (Stripe), and we place
              the order with the airline through Duffel. You see one{" "}
              <strong>total price</strong> before you pay; that total includes our
              agency service fee on top of the fare we pay the airline. We do not add
              separate fees at the last step of checkout.
            </>
          ) : (
            <>
              When flight booking is enabled, checkout happens on Skyline Voyager
              using aviation inventory from Duffel—not on Booking.com or other OTAs.
            </>
          )}
        </p>
        <p>
          We are not the airline. Tickets are issued per the fare rules shown at
          booking time. Refunds and changes follow airline and fare conditions.
        </p>

        <h2 className="font-display pt-4 text-xl font-semibold text-[var(--color-ink)]">
          Hotels and stays
        </h2>
        <p>
          Our hotel, neighborhood, and lodging articles are{" "}
          <strong>editorial only</strong>. We do <strong>not</strong> link to
          Booking.com, Awin hotel programs, or other stay marketplaces for checkout.
          Plan where to stay using our guides; book flights here when you are ready.
        </p>

        <h2 className="font-display pt-4 text-xl font-semibold text-[var(--color-ink)]">
          Other partner links
        </h2>
        <p>
          Some pages may link to car rental or tour partners in a new tab. If those
          links are affiliate-tracked in the future, we may earn a commission at no
          extra cost to you. Those programs are separate from flight booking on this
          site.
        </p>
        <p>
          <strong>You do not pay extra</strong> because you used our link. The price
          you see at checkout is what we charge for flights on this site.
        </p>
        <p>
          We publish guides we believe are useful. Commercial relationships do not
          change our commitment to honest explanations about fees, timing, and
          tradeoffs in editorial content.
        </p>
      </section>

      <LegalRelatedLinks except="/affiliate-disclosure" />
    </main>
  );
}
