import { isAffiliateLink, neutralPartnerCtaCopy } from "@/lib/partner-links";
import { shouldUseDuffelFlightSearch } from "@/lib/flights/links";

const DUFFEL_PRIMARY = {
  title: "Search live fares",
  sub: "Compare test inventory with transparent markup—checkout on Skyline Voyager",
  cta: "Search flights",
} as const;

const AFFILIATE_FLIGHTS = {
  title: "Compare cabins & fares",
  sub: "Business, premium economy & more—live pricing in a new window",
  cta: "Open flight search",
} as const;

/** Hero / dock copy for the flights primary CTA. */
export function flightsPrimaryCtaCopy(): { title: string; sub: string; cta: string } {
  if (shouldUseDuffelFlightSearch()) return { ...DUFFEL_PRIMARY };
  if (isAffiliateLink("flights")) return { ...AFFILIATE_FLIGHTS };
  return neutralPartnerCtaCopy("flights");
}
