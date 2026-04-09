"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SiteSearchForm } from "@/components/SiteSearchForm";
import { DESTINATION_META } from "@/lib/guides";
import { CATEGORY_META } from "@/lib/guides/types";
import { site } from "@/lib/site";

const primary = [
  { href: "/hotels", label: "Hotels & stays" },
  { href: "/flights", label: "Flights" },
  { href: "/weekend-trips", label: "Weekends" },
  { href: "/national-parks", label: "Parks" },
  { href: "/car-rentals", label: "Cars" },
  { href: "/travel-planning", label: "Planning" },
  { href: "/guides", label: "All guides" },
  { href: "/destinations", label: "Destinations" },
];

const secondary = [
  { href: "/about#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/legal", label: "Legal" },
];

export function HeaderBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-[auto_minmax(0,15rem)_minmax(0,1fr)] lg:items-center lg:gap-x-4 xl:grid-cols-[auto_minmax(0,17rem)_minmax(0,1fr)] xl:gap-x-5 2xl:grid-cols-[auto_minmax(0,18rem)_minmax(0,1fr)]">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--color-ink)] lg:gap-1.5 xl:gap-2.5"
        >
          <span className="sr-only">{site.name}</span>
          <Image
            src={site.logoPath}
            alt=""
            width={156}
            height={100}
            className="h-9 w-auto shrink-0 object-contain object-left"
            priority
          />
          {/* Visual wordmark only; sr-only duplicate keeps a11y stable (avoids display:none + hydration quirks). */}
          <span
            aria-hidden
            className="truncate lg:hidden xl:inline xl:max-w-[11rem] 2xl:max-w-none"
          >
            {site.name}
          </span>
        </Link>

        <div className="relative z-0 mx-2 hidden min-w-0 max-w-full flex-1 overflow-hidden md:block md:max-w-sm lg:col-start-2 lg:mx-0 lg:w-full lg:min-w-0 lg:max-w-full lg:flex-none">
          <SiteSearchForm
            compact
            iconSubmit
            inputId="header-site-search"
            className="w-full"
          />
        </div>

        <Link
          href="/search"
          className="rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] md:hidden"
        >
          Search
        </Link>

        <nav
          className="relative z-10 hidden min-h-10 min-w-0 justify-self-end lg:col-start-3 lg:flex lg:flex-nowrap lg:items-center lg:justify-end lg:gap-x-0.5 lg:overflow-x-auto lg:overflow-y-hidden lg:pl-3 lg:whitespace-nowrap lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden xl:gap-x-1"
          aria-label="Main"
        >
          <Link
            href="/"
            className="shrink-0 rounded-md px-1.5 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] xl:px-2 xl:text-sm"
          >
            Home
          </Link>
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-1.5 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] xl:px-2 xl:text-sm"
            >
              {item.label}
            </Link>
          ))}
          {secondary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-1.5 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)] xl:px-2 xl:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          {open ? (
            <span className="text-xl leading-none">×</span>
          ) : (
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          )}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 lg:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            <div className="mb-3 border-b border-[var(--color-border)] pb-4">
              <SiteSearchForm
                compact
                inputId="mobile-drawer-site-search"
                className="w-full"
              />
            </div>
            <Link
              href="/"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Topics
            </p>
            {CATEGORY_META.map((c) => (
              <Link
                key={c.id}
                href={c.path}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
                onClick={() => setOpen(false)}
              >
                <span className="mr-2" aria-hidden>
                  {c.icon}
                </span>
                {c.shortTitle}
              </Link>
            ))}
            <Link
              href="/guides"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}
            >
              All guides
            </Link>
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Destinations
            </p>
            {DESTINATION_META.map((d) => (
              <Link
                key={d.id}
                href={d.path}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
                onClick={() => setOpen(false)}
              >
                <span className="mr-2" aria-hidden>
                  {d.icon}
                </span>
                {d.shortTitle}
              </Link>
            ))}
            <Link
              href="/destinations"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-accent)] hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}
            >
              All destinations →
            </Link>
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Company
            </p>
            {secondary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
