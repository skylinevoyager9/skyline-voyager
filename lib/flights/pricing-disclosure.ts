/**
 * How much fare breakdown to show under the customer price.
 *
 * - simple (default): "Includes service fee" — total price stays prominent
 * - full: percentage + base fare (operator/debug style)
 * - hidden: no subline (total only; fee still described on /affiliate-disclosure)
 *
 * Set NEXT_PUBLIC_FLIGHT_PRICE_DISCLOSURE=full|simple|hidden
 */

export type FlightPriceDisclosureMode = "full" | "simple" | "hidden";

export function getFlightPriceDisclosureMode(): FlightPriceDisclosureMode {
  const raw = process.env.NEXT_PUBLIC_FLIGHT_PRICE_DISCLOSURE?.trim().toLowerCase();
  if (raw === "full" || raw === "simple" || raw === "hidden") return raw;
  return "simple";
}

export function shouldShowMarkupBreakdown(): boolean {
  return getFlightPriceDisclosureMode() === "full";
}
