import Image from "next/image";
import Link from "next/link";
import { PRODUCT_NAV, FOOTER_COMPANY_LINKS, FOOTER_LEGAL_LINKS } from "@/lib/site-nav";
import { getFlightsNavHref } from "@/lib/flights/links";
import { getStaysNavHref } from "@/lib/stays/links";
import { site } from "@/lib/site";

export function SiteFooter() {
  const flightsHref = getFlightsNavHref();
  const staysHref = getStaysNavHref();

  const products = PRODUCT_NAV.map((item) => {
    if (item.id === "flights") return { href: flightsHref, label: item.label };
    if (item.id === "stays") return { href: staysHref, label: item.label };
    return { href: item.href, label: item.label };
  });

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface-warm)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-base font-semibold text-[var(--color-ink)] hover:opacity-90"
            >
              <Image
                src={site.logoPath}
                alt=""
                width={124}
                height={80}
                className="h-8 w-auto shrink-0 object-contain object-left"
              />
              {site.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Book flights, stays, and cars — plus USA road-trip guides. We may earn a
              commission from partner links.{" "}
              <Link
                href="/affiliate-disclosure"
                className="text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                Disclosure
              </Link>
              .
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              {site.email}
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Book
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {products.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/guides"
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                >
                  Travel guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Company
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[var(--color-accent)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Legal
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[var(--color-accent)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-[var(--color-border)] pt-8 text-xs text-[var(--color-ink-faint)]">
          © {new Date().getFullYear()} {site.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
