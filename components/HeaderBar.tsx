"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SiteSearchForm } from "@/components/SiteSearchForm";
import { PRODUCT_NAV } from "@/lib/site-nav";
import { site } from "@/lib/site";

type HeaderBarProps = {
  flightsHref?: string;
  staysHref?: string;
};

export function HeaderBar({
  flightsHref = "/flights",
  staysHref = "/hotels",
}: HeaderBarProps) {
  const [open, setOpen] = useState(false);

  const primary = PRODUCT_NAV.map((item) => {
    if (item.id === "flights") return { href: flightsHref, label: item.label };
    if (item.id === "stays") return { href: staysHref, label: item.label };
    return { href: item.href, label: item.label };
  });

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]"
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
          <span className="hidden truncate sm:inline">{site.name}</span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main"
        >
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-ink-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden w-full max-w-[14rem] md:block lg:max-w-[16rem]">
          <SiteSearchForm compact iconSubmit inputId="header-site-search" className="w-full" />
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
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
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 md:hidden"
        >
          <div className="mb-4">
            <SiteSearchForm compact inputId="mobile-drawer-site-search" className="w-full" />
          </div>
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-3 text-base font-semibold text-[var(--color-ink)] hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/guides"
            className="mt-2 block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04]"
            onClick={() => setOpen(false)}
          >
            Travel guides
          </Link>
          <Link
            href="/about"
            className="block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04]"
            onClick={() => setOpen(false)}
          >
            About
          </Link>
        </div>
      ) : null}
    </header>
  );
}
