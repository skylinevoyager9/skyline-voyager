import { isStripeConfigured } from "@/lib/stripe/config";

export type FlightPaymentMode = "stripe" | "duffel_balance";

/** How the customer pays before we place the Duffel order. */
export function getFlightPaymentMode(): FlightPaymentMode {
  return isStripeConfigured() ? "stripe" : "duffel_balance";
}
