import type { Metadata } from "next";
import Link from "next/link";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms for using ${site.domain} operated by ${site.legalName}.`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Terms &amp; Conditions
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-faint)]">
        Last updated: April 3, 2026
      </p>

      <div className="mt-10 space-y-6 text-[var(--color-ink-muted)] leading-relaxed">
        <p>
          By using{" "}
          <Link
            href={site.url}
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {site.domain}
          </Link>{" "}
          (the “Site”), operated by {site.legalName}, you agree to these terms.
          If you do not agree, do not use the Site.
        </p>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Informational content only
          </h2>
          <p className="mt-3">
            The Site provides general travel information and opinions. It is not
            professional travel, legal, financial, or safety advice. Conditions,
            prices, and rules change; verify details with airlines, hotels, and
            official sources before you book or travel.
          </p>
        </section>

        <section id="flight-cancellations">
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Flight bookings — changes &amp; cancellations
          </h2>
          <p className="mt-3">
            When you book flights on {site.domain}, tickets are issued through airline
            partners via our booking provider. <strong>Change and refund rules are set by
            the airline and fare type</strong>, not by {site.legalName}.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Cancellations:</strong> If online cancellation is offered, you will see an
              airline refund quote before you confirm. The quote may be $0 for non-refundable
              fares.
            </li>
            <li>
              <strong>Card refunds:</strong> When the airline returns a cash refund to us, we
              refund your card up to what you paid, capped by the airline amount. On{" "}
              <strong>partial</strong> airline refunds, service fees and non-refundable extras are
              generally not returned.
            </li>
            <li>
              <strong>Airline credit:</strong> If the airline issues travel credit instead of cash,
              we do not automatically refund your card; contact us for assistance.
            </li>
            <li>
              <strong>Timing:</strong> Card refunds typically post in 5–10 business days after we
              process them.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Third-party services &amp; affiliate links
          </h2>
          <p className="mt-3">
            The Site links to third-party booking platforms and merchants. Your
            use of those sites is governed by their terms and privacy policies.
            We may earn commissions from qualifying actions; see our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              affiliate disclosure
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            No warranties
          </h2>
          <p className="mt-3">
            The Site is provided “as is” without warranties of any kind, to the
            fullest extent permitted by law. We do not guarantee accuracy,
            completeness, or uninterrupted access.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Limitation of liability
          </h2>
          <p className="mt-3">
            To the fullest extent permitted by law, {site.legalName} and its
            owners will not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the Site or reliance
            on its content.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Intellectual property
          </h2>
          <p className="mt-3">
            Text, design, and branding on the Site are owned by {site.legalName}{" "}
            or used with permission. Do not copy or redistribute without written
            consent except as allowed by law.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Changes
          </h2>
          <p className="mt-3">
            We may update these terms. Continued use after changes means you
            accept the revised terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Contact
          </h2>
          <p className="mt-3">
            Questions:{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              {site.email}
            </a>{" "}
            or our{" "}
            <Link
              href="/contact"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              contact page
            </Link>
            .
          </p>
        </section>

        <p className="text-sm text-[var(--color-ink-faint)]">
          Have an attorney review these terms for your jurisdiction and business
          model.
        </p>
      </div>

      <LegalRelatedLinks except="/terms" />
    </main>
  );
}
