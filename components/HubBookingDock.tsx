import Link from "next/link";
import { PartnerOutboundLink } from "@/components/PartnerOutboundLink";
import {
  type PartnerKey,
  isAffiliateLink,
  neutralPartnerCtaCopy,
} from "@/lib/partner-links";

const ORDER: PartnerKey[] = [
  "flights",
  "booking",
  "cars",
  "viator",
  "getyourguide",
];

const PILL: Record<PartnerKey, { emoji: string; short: string }> = {
  flights: { emoji: "✈", short: "Flights" },
  booking: { emoji: "🏨", short: "Stays" },
  cars: { emoji: "🚗", short: "Cars" },
  viator: { emoji: "🎟", short: "Tours" },
  getyourguide: { emoji: "🧭", short: "Experiences" },
};

/** Copy tuned for business & premium travelers; still honest (third-party checkout). */
const PRIMARY_LINE: Record<PartnerKey, { title: string; sub: string; cta: string }> = {
  flights: {
    title: "Compare cabins & fares",
    sub: "Business, premium economy & more—live pricing in a new window",
    cta: "Open flight search",
  },
  booking: {
    title: "Curate your stay",
    sub: "Five-star, boutique & suites—filters for the details that matter",
    cta: "Browse premium stays",
  },
  cars: {
    title: "Premium & SUV fleet",
    sub: "Executive classes and full-size SUVs where available",
    cta: "Compare vehicles",
  },
  viator: {
    title: "Private & small-group access",
    sub: "Skip-the-line and curated tours when you want zero guesswork",
    cta: "Explore tours",
  },
  getyourguide: {
    title: "Signature experiences",
    sub: "Highly rated activities—flexible policies on many bookings",
    cta: "View experiences",
  },
};

type Props = {
  primary: PartnerKey;
  /** `light` = pale hero (e.g. /guides). `dark` = dramatic hero on topic hubs. */
  variant?: "dark" | "light";
};

export function HubBookingDock({ primary, variant = "dark" }: Props) {
  const copy = isAffiliateLink(primary)
    ? PRIMARY_LINE[primary]
    : neutralPartnerCtaCopy(primary);
  const others = ORDER.filter((k) => k !== primary);
  const isLight = variant === "light";

  if (isLight) {
    return (
      <div
        id="book-now"
        className="relative mt-10 scroll-mt-24 overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-lg ring-1 ring-stone-100 sm:p-7"
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-100/50 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Reserve
          </p>
          <p className="mt-3 font-display text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            {copy.title}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {copy.sub}
          </p>

          <PartnerOutboundLink
            partner={primary}
            className="mt-6 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 px-6 py-4 text-base font-bold text-slate-900 shadow-md ring-1 ring-amber-300/40 transition hover:from-amber-50 hover:via-white hover:to-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span className="text-xl" aria-hidden>
              {PILL[primary].emoji}
            </span>
            <span>{copy.cta}</span>
            <span className="text-lg text-amber-800/90" aria-hidden>
              →
            </span>
          </PartnerOutboundLink>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">
              Complete your itinerary
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {others.map((key) => (
                <PartnerOutboundLink
                  key={key}
                  partner={key}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-amber-400/50 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                >
                  <span aria-hidden>{PILL[key].emoji}</span>
                  {PILL[key].short}
                </PartnerOutboundLink>
              ))}
            </div>
          </div>

          <Link
            href="#book-trip"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-4 transition hover:decoration-amber-900"
          >
            Full toolkit &amp; disclosure
            <span aria-hidden>↓</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      id="book-now"
      className="relative mt-10 scroll-mt-24 overflow-hidden rounded-3xl border border-amber-200/25 bg-black/25 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 90% 10%, rgba(251,191,36,0.12), transparent), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(255,255,255,0.06), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
          Reserve
        </p>
        <p className="mt-3 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
          {copy.title}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
          {copy.sub}
        </p>

        <PartnerOutboundLink
          partner={primary}
          className="mt-6 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 px-6 py-4 text-base font-bold text-slate-900 shadow-lg ring-1 ring-amber-400/35 transition hover:from-amber-50 hover:via-white hover:to-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <span className="text-xl" aria-hidden>
            {PILL[primary].emoji}
          </span>
          <span>{copy.cta}</span>
          <span className="text-lg text-amber-800/90" aria-hidden>
            →
          </span>
        </PartnerOutboundLink>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Complete your itinerary
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {others.map((key) => (
              <PartnerOutboundLink
                key={key}
                partner={key}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-amber-200/40 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
              >
                <span className="opacity-90" aria-hidden>
                  {PILL[key].emoji}
                </span>
                {PILL[key].short}
              </PartnerOutboundLink>
            ))}
          </div>
        </div>

        <Link
          href="#book-trip"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-200/90 underline decoration-amber-200/35 underline-offset-4 transition hover:text-white hover:decoration-white/80"
        >
          Full toolkit &amp; disclosure
          <span aria-hidden>↓</span>
        </Link>
      </div>
    </div>
  );
}
