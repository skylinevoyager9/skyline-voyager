import type { Metadata } from "next";
import Link from "next/link";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.legalName} collects and uses information on ${site.domain}.`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-faint)]">
        Last updated: April 9, 2026
      </p>

      <div className="mt-10 space-y-6 text-[var(--color-ink-muted)] leading-relaxed">
        <p>
          This policy describes how {site.legalName} (“we,” “us”) handles
          information when you visit{" "}
          <Link
            href={site.url}
            className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {site.domain}
          </Link>{" "}
          (the “Site”).
        </p>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Information we collect
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--color-ink)]">Usage data:</strong>{" "}
              When you browse the Site, our hosting and analytics tools may log
              technical data such as IP address, browser type, device type,
              pages viewed, and approximate location derived from IP.
            </li>
            <li>
              <strong className="text-[var(--color-ink)]">Email:</strong> If you
              email us at {site.email}, we receive the contents of your message
              and your email address.
            </li>
            <li>
              <strong className="text-[var(--color-ink)]">Cookies:</strong> We
              and our partners may use cookies or similar technologies for
              essential site operation, analytics, and (where applicable)
              affiliate attribution. You can control cookies through your browser
              settings.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            How we use information
          </h2>
          <p className="mt-3">
            We use information to operate and improve the Site, understand
            readership, respond to inquiries, comply with law, and protect our
            rights. Affiliate partners may use their own cookies when you
            leave our Site to complete a booking; their practices are governed
            by their respective policies.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Bookings and payments
          </h2>
          <p className="mt-3">
            We do <strong className="text-[var(--color-ink)]">not</strong> take
            payment for flights, hotels, or other travel services on this Site.
            When you book, you enter payment details on the{" "}
            <strong className="text-[var(--color-ink)]">partner&apos;s</strong>{" "}
            checkout page (for example an airline, hotel chain, online travel
            agency, or tour operator). We do{" "}
            <strong className="text-[var(--color-ink)]">not</strong> store your
            credit card or bank information for those transactions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Sharing
          </h2>
          <p className="mt-3">
            We may share data with service providers that host the Site, provide
            analytics, or process email on our behalf. We may disclose
            information if required by law or to protect safety and integrity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Your choices
          </h2>
          <p className="mt-3">
            Depending on where you live, you may have rights to access, delete,
            or opt out of certain processing. Contact us at{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              {site.email}
            </a>{" "}
            for privacy requests.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Children
          </h2>
          <p className="mt-3">
            The Site is not directed at children under 13, and we do not
            knowingly collect their personal information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            Changes
          </h2>
          <p className="mt-3">
            We may update this policy from time to time. The “Last updated” date
            at the top will change when we do.
          </p>
        </section>

        <p className="text-sm text-[var(--color-ink-faint)]">
          This page is for general information and is not legal advice. Have
          your counsel review it for your business.
        </p>
      </div>

      <LegalRelatedLinks except="/privacy" />
    </main>
  );
}
