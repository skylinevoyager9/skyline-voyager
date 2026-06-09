import { isDuffelConfigured } from "@/lib/duffel/config";

export const STAYS_HUB_PATH = "/hotels";
export const STAYS_SEARCH_PATH = "/stays/search";

/** Primary nav when live Duffel stays search is enabled. */
export function getStaysNavHref(): string {
  return isDuffelConfigured() ? STAYS_SEARCH_PATH : STAYS_HUB_PATH;
}
