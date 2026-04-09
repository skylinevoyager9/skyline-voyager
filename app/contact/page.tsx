import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.legalName} — general questions, media, partnerships, and affiliate disclosure. Email ${site.email}.`,
};

export default function ContactPage() {
  const contactFormEnabled = Boolean(process.env.RESEND_API_KEY);

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Contact
      </h1>
      <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
        <strong className="text-[var(--color-ink)]">{site.legalName}</strong>{" "}
        publishes editorial travel guides for US and international business and
        premium leisure travelers, with a stays-first focus and transparent
        partner links. We are not a travel agency and do not process bookings or
        payments on this site.
      </p>
      <p className="mt-6 text-[var(--color-ink-muted)] leading-relaxed">
        For questions about this website, media, or our affiliate disclosure,
        send a message using the form below.
      </p>
      <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
        <strong className="text-[var(--color-ink)]">Partnerships, networks, and press:</strong>{" "}
        use the same form, or read{" "}
        <Link
          href="/about#partnerships"
          className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          Partnerships &amp; press on About
        </Link>{" "}
        for how we describe the publisher and how to reach us for verification.
      </p>

      <div className="mt-10">
        <ContactForm
          enabled={contactFormEnabled}
          fallbackEmail={site.email}
        />
      </div>

      <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
          Privacy, terms &amp; disclosure
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <Link
              href="/legal"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Legal overview
            </Link>
            {" — "}
            <span className="text-[var(--color-ink-muted)]">
              all documents in one place
            </span>
          </li>
          <li>
            <Link
              href="/privacy"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </li>
          <li>
            <Link
              href="/affiliate-disclosure"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Affiliate Disclosure
            </Link>
          </li>
        </ul>
      </div>

    </main>
  );
}
