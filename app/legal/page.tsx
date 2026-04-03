import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal",
  description: `Privacy, terms, and affiliate disclosure for ${site.domain}.`,
};

const pages = [
  {
    href: "/privacy",
    title: "Privacy Policy",
    description:
      "What information we collect when you use the site, cookies, analytics, and your choices.",
  },
  {
    href: "/terms",
    title: "Terms & Conditions",
    description:
      "Rules for using the site, third-party links, disclaimers, and limitation of liability.",
  },
  {
    href: "/affiliate-disclosure",
    title: "Affiliate Disclosure",
    description:
      "How we earn commissions from partner links, FTC transparency, and what we do not do (we are not your travel agent).",
  },
] as const;

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
        Legal &amp; transparency
      </h1>
      <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
        {site.legalName} publishes these documents for visitors and partners.
        They work together: privacy covers data, terms cover use of the site,
        and the affiliate disclosure covers how we may be paid when you book
        through links.
      </p>

      <ul className="mt-12 space-y-4">
        {pages.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="block rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition hover:border-[var(--color-accent)] hover:shadow-md"
            >
              <span className="font-display text-lg font-semibold text-[var(--color-ink)]">
                {p.title}
              </span>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {p.description}
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-[var(--color-accent)]">
                Read document →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
