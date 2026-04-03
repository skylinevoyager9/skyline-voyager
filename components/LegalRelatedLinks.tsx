import Link from "next/link";

const links = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
] as const;

type Props = {
  /** Hide this path in the list (you are already on that page). */
  except?: (typeof links)[number]["href"];
};

export function LegalRelatedLinks({ except }: Props) {
  const items = except ? links.filter((l) => l.href !== except) : [...links];

  return (
    <aside className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-6">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
        Legal &amp; transparency
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--color-ink-faint)] leading-relaxed">
        Overview:{" "}
        <Link href="/legal" className="text-[var(--color-accent)] hover:underline">
          All legal pages
        </Link>
      </p>
    </aside>
  );
}
