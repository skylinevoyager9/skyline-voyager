import Link from "next/link";
import { PartnerOutboundLink } from "@/components/PartnerOutboundLink";
import {
  type PartnerKey,
  hasAnyAffiliateTracking,
  isAffiliateLink,
  neutralPartnerCtaCopy,
  partnerPublicBrandName,
} from "@/lib/partner-links";

type StripProps = {
  title?: string;
  className?: string;
  sectionId?: string;
  emphasizePartner?: PartnerKey;
  /** Hub pages use prestige styling + copy for business / premium positioning. */
  tone?: "standard" | "prestige";
  /**
   * `library` = soft border + light mega CTA (e.g. /guides). Avoids the large
   * dark slate button that can read as “all black” on an otherwise pale page.
   */
  surface?: "default" | "library";
};

const ALL: PartnerKey[] = [
  "flights",
  "booking",
  "cars",
  "viator",
  "getyourguide",
];

const MEGA: Record<
  PartnerKey,
  { emoji: string; title: string; sub: string }
> = {
  flights: {
    emoji: "✈️",
    title: "Find flights — see fares side by side",
    sub: "Domestic & US routes · Opens in a new tab",
  },
  booking: {
    emoji: "🏨",
    title: "Find hotels & vacation stays",
    sub: "Millions of listings · Many rates with free cancellation",
  },
  cars: {
    emoji: "🚗",
    title: "Compare rental cars",
    sub: "Airport pickup · Compare major brands",
  },
  viator: {
    emoji: "🎟️",
    title: "Tours, tickets & day trips",
    sub: "Skip-the-line options · Activities worldwide",
  },
  getyourguide: {
    emoji: "🧭",
    title: "Experiences & guided activities",
    sub: "Highly rated local tours · Flexible policies on many bookings",
  },
};

const MEGA_PRESTIGE: Record<PartnerKey, { title: string; sub: string }> = {
  flights: {
    title: "Airfare — compare cabins in one place",
    sub: "Economy through business & first where offered · New tab",
  },
  booking: {
    title: "Stays — from boutique to five-star",
    sub: "Suites, club floors & resorts when you filter for them",
  },
  cars: {
    title: "Vehicles — premium & SUV classes",
    sub: "Airport pickup · Add insurance clarity before you sign",
  },
  viator: {
    title: "Access — tours & timed entries",
    sub: "Private and small-group options on select listings",
  },
  getyourguide: {
    title: "Experiences — editor-style activities",
    sub: "Top hosts · Flexible terms on many bookings",
  },
};

const MEGA_LABEL: Record<PartnerKey, string> = {
  flights: "Start with airfare",
  booking: "Lock in your stay",
  cars: "Add a rental car",
  viator: "Add tours & tickets",
  getyourguide: "Book experiences",
};

const MEGA_LABEL_PRESTIGE: Record<PartnerKey, string> = {
  flights: "Priority: your cabin & schedule",
  booking: "Priority: where you rest",
  cars: "Priority: how you arrive",
  viator: "Priority: access & time",
  getyourguide: "Priority: the experience",
};

const TILE: Record<
  PartnerKey,
  { icon: string; headline: string; sub: string; variant: "teal" | "outline" | "soft" }
> = {
  flights: {
    icon: "✈️",
    headline: "Flights",
    sub: "Compare airlines & times",
    variant: "outline",
  },
  booking: {
    icon: "🏨",
    headline: "Hotels & stays",
    sub: "Neighborhoods & deals",
    variant: "teal",
  },
  cars: {
    icon: "🚗",
    headline: "Car rental",
    sub: "Airport & city pickup",
    variant: "outline",
  },
  viator: {
    icon: "🎟️",
    headline: "Viator tours",
    sub: "Tickets & day trips",
    variant: "outline",
  },
  getyourguide: {
    icon: "🧭",
    headline: "GetYourGuide",
    sub: "Local experiences",
    variant: "soft",
  },
};

const TILE_PRESTIGE_SUB: Partial<Record<PartnerKey, string>> = {
  flights: "Cabins & fare tools",
  booking: "Luxury filters & suites",
  cars: "SUV & premium class",
  viator: "VIP-style access",
  getyourguide: "Curated local hosts",
};

function CtaTile({
  partner,
  tone,
}: {
  partner: PartnerKey;
  tone: "standard" | "prestige";
}) {
  const t = TILE[partner];
  const tracked = isAffiliateLink(partner);
  const headline = tracked ? t.headline : partnerPublicBrandName(partner);
  const displaySub = tracked
    ? tone === "prestige" && TILE_PRESTIGE_SUB[partner]
      ? TILE_PRESTIGE_SUB[partner]!
      : t.sub
    : "Check prices · Opens in a new tab";

  const styles =
    tone === "prestige"
      ? {
          teal: "border border-stone-300/80 bg-white text-stone-900 hover:border-amber-700/40 hover:shadow-md focus-visible:ring-amber-600/50",
          outline:
            "border border-stone-300/80 bg-stone-50/80 text-stone-900 hover:border-amber-700/35 hover:bg-white focus-visible:ring-amber-600/50",
          soft: "border border-stone-200 bg-stone-100/60 text-stone-800 hover:border-amber-700/30 hover:bg-white focus-visible:ring-amber-600/50",
        }[t.variant]
      : {
          teal: "border-2 border-teal-600 bg-teal-50/80 text-teal-900 hover:bg-teal-100 hover:border-teal-500 focus-visible:ring-teal-500",
          outline:
            "border-2 border-slate-200 bg-white text-slate-900 hover:border-teal-500 hover:shadow-md focus-visible:ring-teal-500",
          soft: "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white hover:border-teal-400 hover:shadow-sm focus-visible:ring-teal-500",
        }[t.variant];

  return (
    <li className="min-w-0">
      <PartnerOutboundLink
        partner={partner}
        className={`group flex min-h-[5.5rem] flex-col justify-center gap-0.5 rounded-2xl px-4 py-4 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles}`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm ring-1 ${
              tone === "prestige"
                ? "bg-white ring-stone-200/80"
                : "bg-white ring-black/5"
            }`}
            aria-hidden
          >
            {t.icon}
          </span>
          <span className="font-display text-base font-bold leading-tight group-hover:underline group-hover:decoration-2 group-hover:underline-offset-2">
            {headline}
          </span>
        </span>
        <span
          className={`pl-11 text-xs font-medium leading-snug ${
            tone === "prestige"
              ? "text-stone-600 group-hover:text-stone-800"
              : "text-slate-600 group-hover:text-slate-800"
          }`}
        >
          {displaySub}
        </span>
      </PartnerOutboundLink>
    </li>
  );
}

export function GuidePartnerStrip({
  title = "Ready when you are — book in a few clicks",
  className = "mt-10",
  sectionId = "book-trip",
  emphasizePartner = "flights",
  tone = "standard",
  surface = "default",
}: StripProps) {
  const isLibrary = surface === "library";
  const affiliateOn = hasAnyAffiliateTracking();
  const megaBase = MEGA[emphasizePartner];
  const prestige = MEGA_PRESTIGE[emphasizePartner];
  const neutral = neutralPartnerCtaCopy(emphasizePartner);

  const mega = !isAffiliateLink(emphasizePartner)
    ? {
        emoji: megaBase.emoji,
        title: neutral.title,
        sub: neutral.sub,
      }
    : tone === "prestige"
      ? {
          emoji: megaBase.emoji,
          title: prestige.title,
          sub: prestige.sub,
        }
      : megaBase;

  const megaLabel = !isAffiliateLink(emphasizePartner)
    ? "Compare on partner site"
    : tone === "prestige"
      ? MEGA_LABEL_PRESTIGE[emphasizePartner]
      : MEGA_LABEL[emphasizePartner];

  const gridPartners = ALL.filter((k) => k !== emphasizePartner);

  const frameClass = isLibrary
    ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-200/70 via-stone-200/90 to-teal-200/60 p-[2px] shadow-lg shadow-stone-900/10 ring-1 ring-stone-200/80"
    : tone === "prestige"
      ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600/90 via-stone-800 to-slate-950 p-[2px] shadow-2xl shadow-black/25 ring-1 ring-amber-900/20"
      : "relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-sky-700 p-[3px] shadow-xl shadow-teal-900/15 ring-1 ring-black/5";

  const innerClass = isLibrary
    ? "relative rounded-[22px] bg-white px-5 py-7 sm:px-8 sm:py-9"
    : tone === "prestige"
      ? "relative rounded-[22px] bg-stone-50 px-5 py-7 sm:px-8 sm:py-9"
      : "relative rounded-[22px] bg-white px-5 py-7 sm:px-8 sm:py-9";

  const badgeClass =
    tone === "prestige"
      ? "inline-flex items-center rounded-full border border-amber-800/20 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950"
      : "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900";

  const megaBtnClass = isLibrary
    ? "mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 px-6 py-5 text-center text-slate-900 shadow-md ring-1 ring-amber-300/40 transition hover:from-amber-50 hover:via-white hover:to-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:flex-row sm:gap-4 sm:py-6"
    : tone === "prestige"
      ? "mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 px-6 py-5 text-center text-white shadow-xl ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:flex-row sm:gap-4 sm:py-6"
      : "mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-center text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:flex-row sm:gap-4 sm:py-6";

  const megaSubClass = isLibrary
    ? "text-sm font-medium text-stone-600"
    : tone === "prestige"
      ? "text-sm font-medium text-amber-100/90"
      : "text-sm font-medium text-teal-200/95";

  const arrowClass = isLibrary
    ? "mt-1 text-lg font-bold text-amber-800/90 sm:ml-auto sm:mt-0 sm:text-2xl"
    : tone === "prestige"
      ? "mt-1 text-lg font-bold text-amber-200/90 sm:ml-auto sm:mt-0 sm:text-2xl"
      : "mt-1 text-lg font-bold text-teal-300 sm:ml-auto sm:mt-0 sm:text-2xl";

  const linkClass =
    tone === "prestige"
      ? "font-semibold text-amber-900 underline decoration-amber-700/35 underline-offset-2 hover:decoration-amber-800"
      : "font-semibold text-teal-700 underline decoration-teal-600/40 underline-offset-2 hover:decoration-teal-600";

  return (
    <section
      id={sectionId}
      aria-labelledby="sv-cta-heading"
      className={`scroll-mt-24 ${className}`}
    >
      <div className={frameClass}>
        <div className={innerClass}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={badgeClass}>
              {tone === "prestige" ? "Preferred traveler tools" : "Free to use"}
            </span>
            <span
              className={
                tone === "prestige"
                  ? "text-xs font-medium text-stone-600"
                  : "text-xs font-medium text-slate-500"
              }
            >
              {affiliateOn
                ? "You never pay extra for using our links"
                : "Checkout on partner sites—we don’t add fees"}
            </span>
          </div>

          <h2
            id="sv-cta-heading"
            className={`font-display mt-4 text-2xl font-bold tracking-tight sm:text-3xl ${
              tone === "prestige" ? "text-stone-900" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-2 max-w-2xl text-base sm:text-lg ${
              tone === "prestige" ? "text-stone-600" : "text-slate-600"
            }`}
          >
            {affiliateOn ? (
              <>
                {tone === "prestige"
                  ? "Live inventory and published fares on partner sites—you complete checkout where the brand requires it. We may earn a commission; it does not increase your price. "
                  : "Compare live prices, pick what fits your dates, and check out on the site you trust. We may earn a commission; it never raises your price. "}
              </>
            ) : (
              <>
                Compare live prices on partner sites, then complete checkout
                where the provider requires it. Tracked affiliate links are not
                active on this site yet; our disclosure explains how we handle
                links.{" "}
              </>
            )}
            <Link href="/affiliate-disclosure" className={linkClass}>
              How that works
            </Link>
          </p>

          <div className="mt-8">
            <p
              className={`text-center text-xs font-bold uppercase tracking-widest sm:text-left ${
                tone === "prestige" ? "text-stone-500" : "text-slate-500"
              }`}
            >
              {megaLabel}
            </p>
            <PartnerOutboundLink
              partner={emphasizePartner}
              className={megaBtnClass}
            >
              <span className="text-2xl sm:text-3xl" aria-hidden>
                {mega.emoji}
              </span>
              <span className="flex flex-col sm:items-start">
                <span className="font-display text-lg font-bold sm:text-xl">
                  {mega.title}
                </span>
                <span className={megaSubClass}>{mega.sub}</span>
              </span>
              <span className={arrowClass} aria-hidden>
                →
              </span>
            </PartnerOutboundLink>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {gridPartners.map((p) => (
              <CtaTile key={p} partner={p} tone={tone} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
