import { isDuffelConfigured } from "@/lib/duffel/config";

export const FLIGHTS_HUB_PATH = "/flights";
export const FLIGHTS_SEARCH_PATH = "/flights/search";

/** Primary nav / booking CTA when live search is enabled. */
export function getFlightsNavHref(): string {
  return isDuffelConfigured() ? FLIGHTS_SEARCH_PATH : FLIGHTS_HUB_PATH;
}

export function shouldUseDuffelFlightSearch(): boolean {
  return isDuffelConfigured();
}
