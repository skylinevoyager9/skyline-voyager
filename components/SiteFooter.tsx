import Image from "next/image";
import Link from "next/link";
import { CATEGORY_META, DESTINATION_META } from "@/lib/guides";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface-warm)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="lg:col-span-1">
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
              Independent US travel guides with a stays-first lens—hotels and
              lodging, then flights, weekends, parks, and planning—plus select
              international frames. We may earn a commission from partner
              links—see our{" "}
              <Link
                href="/affiliate-disclosure"
                className="text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                affiliate disclosure
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
              Topics
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {CATEGORY_META.map((c) => (
                <li key={c.path}>
                  <Link
                    href={c.path}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/guides"
                  className="font-medium text-[var(--color-accent)] hover:underline"
                >
                  All guides →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Destinations
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/destinations"
                  className="font-medium text-[var(--color-accent)] hover:underline"
                >
                  All destinations →
                </Link>
              </li>
              {DESTINATION_META.map((d) => (
                <li key={d.id}>
                  <Link
                    href={d.path}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                  >
                    <span className="mr-1.5" aria-hidden>
                      {d.icon}
                    </span>
                    {d.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Company
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              <li>
                <Link href="/about" className="hover:text-[var(--color-accent)]">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/about#how-it-works"
                  className="hover:text-[var(--color-accent)]"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/about#partnerships"
                  className="hover:text-[var(--color-accent)]"
                >
                  Partnerships &amp; press
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--color-accent)]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Legal
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              <li>
                <Link href="/legal" className="hover:text-[var(--color-accent)]">
                  Legal overview
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-accent)]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--color-accent)]">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/affiliate-disclosure"
                  className="hover:text-[var(--color-accent)]"
                >
                  Affiliate Disclosure
                </Link>
              </li>
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
