import type { Metadata } from "next";
import Link from "next/link";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { hasAnyAffiliateTracking } from "@/lib/partner-links";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How Skyline Voyager may earn commissions from partner links—including planned Booking.com and OTA tracking—with FTC-style transparency and checkout on partner sites.",
};

export default function AffiliateDisclosurePage() {
  const affiliateOn = hasAnyAffiliateTracking();

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Affiliate Disclosure
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-faint)]">
        Last updated: April 9, 2026
      </p>

      <section className="mt-10 space-y-4 text-[var(--color-ink-muted)] leading-relaxed">
        {affiliateOn ? (
          <p>
            {site.legalName} (“{site.name},” “we,” “us”) operates{" "}
            <Link
              href={site.url}
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              {site.domain}
            </Link>
            . Some links on this website are <strong>affiliate links</strong>.
            If you click an affiliate link and make a qualifying purchase or
            booking, we may earn a commission or referral fee from the partner.
            We intend to participate in major hotel and OTA programs—including{" "}
            <strong>Booking.com</strong> where available—and to label partner
            links clearly so readers know when a click may support our work.
          </p>
        ) : (
          <>
            <p>
              {site.legalName} (“{site.name},” “we,” “us”) operates{" "}
              <Link
                href={site.url}
                className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                {site.domain}
              </Link>{" "}
              as a <strong>booking-friendly travel research site</strong>: we
              publish editorial guides, then link to trusted partners (including{" "}
              <strong>Booking.com</strong> for hotel and vacation-rental search)
              so you can complete checkout on the brand you choose.
            </p>
            <p>
              <strong>Tracked affiliate links are not active on this site right
              now,</strong> so we do not yet earn a commission when you use
              outbound links. We <strong>intend to add</strong> partner tracking
              links—including for hotel and booking platforms such as{" "}
              <strong>Booking.com</strong> via networks like Awin—in line with
              each program&apos;s brand-safety and disclosure requirements. When
              tracking goes live, we will update this page and surface short
              disclosures near outbound booking buttons where appropriate.
            </p>
          </>
        )}
        <p>
          <strong>You do not pay extra</strong> because you used our link. The
          price you see comes from the merchant or booking platform.
        </p>
        <p>
          We may participate in programs operated by hotels and online travel
          agencies, airlines and flight search platforms, tour and activity
          marketplaces, rental car companies, and similar travel-related
          services. Specific partners may change over time.
        </p>
        <p>
          We publish guides we believe are useful.{" "}
          {affiliateOn ? (
            <>
              Affiliate relationships can influence <em>which</em> partners we
              link to, but they do not change our commitment to honest,
              reader-first explanations (fees, timing, tradeoffs) in our
              editorial content.
            </>
          ) : (
            <>
              If we add monetized partner links later, those relationships could
              influence <em>which</em> partners we link to; they will not change
              our commitment to honest, reader-first explanations (fees, timing,
              tradeoffs) in our editorial content.
            </>
          )}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          FTC transparency
        </h2>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          The Federal Trade Commission (FTC) expects clear disclosure of
          material connections. We place this disclosure on our site and
          summarize the relationship near recommendations where it makes sense.
          If you ever feel a page is unclear, please{" "}
          <Link
            href="/contact"
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            contact us
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Not travel agency services
        </h2>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          {site.name} provides general information and links to third-party
          sites. We do not operate as your travel agent, we do not hold your
          funds for bookings, and we do not control partner cancellation or
          refund policies. Always read the terms on the provider’s checkout page.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Questions
        </h2>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          Email questions about this disclosure through our{" "}
          <Link
            href="/contact"
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            contact page
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Privacy &amp; site terms
        </h2>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          How we handle data is described in our{" "}
          <Link
            href="/privacy"
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          . Rules for using the site are in our{" "}
          <Link
            href="/terms"
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Secure connections (HTTPS)
        </h2>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          We intend for {site.domain} to be served over HTTPS in production.
          Many third-party affiliate programs require a secure public site and
          secure outbound tracking links; configure TLS with your hosting
          provider (for example, the default setup on Vercel) before you point
          your production domain at this project.
        </p>
      </section>

      <LegalRelatedLinks except="/affiliate-disclosure" />
    </main>
  );
}
