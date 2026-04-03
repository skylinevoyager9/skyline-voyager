/**
 * Partner URLs for CTAs.
 *
 * Today: leave env vars unset → neutral fallbacks (no commission tracking).
 * Later: when each company approves you, set the matching NEXT_PUBLIC_* URL in
 * `.env.local` and Vercel—no code change required; redeploy and CTAs + disclosure
 * copy update automatically (see hasAnyAffiliateTracking / isAffiliateLink).
 *
 * Template for env keys: `.env.example`
 */
export type PartnerKey =
  | "flights"
  | "booking"
  | "cars"
  | "viator"
  | "getyourguide";

const FALLBACKS: Record<PartnerKey, string> = {
  flights: "https://www.google.com/travel/flights",
  booking: "https://www.booking.com",
  cars: "https://www.rentalcars.com",
  viator: "https://www.viator.com",
  getyourguide: "https://www.getyourguide.com",
};

const ENV_KEYS: Record<PartnerKey, string | undefined> = {
  flights: process.env.NEXT_PUBLIC_FLIGHTS_AFFILIATE_URL,
  booking: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_URL,
  cars: process.env.NEXT_PUBLIC_CAR_RENTAL_AFFILIATE_URL,
  viator: process.env.NEXT_PUBLIC_VIATOR_AFFILIATE_URL,
  getyourguide: process.env.NEXT_PUBLIC_GETYOURGUIDE_AFFILIATE_URL,
};

function normalizeToHttps(url: string): string {
  const t = url.trim();
  if (t.startsWith("http://")) return `https://${t.slice(7)}`;
  return t;
}

export function partnerUrl(key: PartnerKey): string {
  const fromEnv = ENV_KEYS[key]?.trim();
  if (fromEnv && fromEnv.startsWith("http")) return normalizeToHttps(fromEnv);
  return FALLBACKS[key];
}

export function isAffiliateLink(key: PartnerKey): boolean {
  const v = ENV_KEYS[key];
  return Boolean(v && v.startsWith("http"));
}

/** Public destination name for neutral CTAs (no affiliate tracking configured). */
const PARTNER_BRAND: Record<PartnerKey, string> = {
  flights: "Google Flights",
  booking: "Booking.com",
  cars: "Rentalcars.com",
  viator: "Viator",
  getyourguide: "GetYourGuide",
};

export function partnerPublicBrandName(key: PartnerKey): string {
  return PARTNER_BRAND[key];
}

const PARTNER_KEYS: PartnerKey[] = [
  "flights",
  "booking",
  "cars",
  "viator",
  "getyourguide",
];

/** True when any `NEXT_PUBLIC_*_AFFILIATE_URL` is set (tracked / commission-eligible). */
export function hasAnyAffiliateTracking(): boolean {
  return PARTNER_KEYS.some((k) => isAffiliateLink(k));
}

/** Wording when outbound links are plain deep links, not yet affiliate-tracked. */
export function neutralPartnerCtaCopy(key: PartnerKey): {
  title: string;
  sub: string;
  cta: string;
} {
  const brand = partnerPublicBrandName(key);
  return {
    title: `Check prices on ${brand}`,
    sub: `See live options on ${brand} and complete checkout there. We do not add fees to their rates.`,
    cta: `Check prices on ${brand}`,
  };
}
