import { getDuffelMode } from "@/lib/duffel/config";
import { getStripeSecretKey } from "@/lib/stripe/config";

export type FlightRuntimeLabels = {
  duffelMode: "test" | "live";
  stripeMode: "test" | "live" | "off";
  isProductionBooking: boolean;
  searchHeadline: string;
  searchSubline: string;
  bookingConfirmedTitle: string;
};

export function getFlightRuntimeLabels(): FlightRuntimeLabels {
  const duffelMode = getDuffelMode();
  const sk = getStripeSecretKey();
  const stripeMode = !sk
    ? "off"
    : sk.startsWith("sk_live_")
      ? "live"
      : "test";
  const isProductionBooking = duffelMode === "live" && stripeMode === "live";

  if (isProductionBooking) {
    return {
      duffelMode,
      stripeMode,
      isProductionBooking: true,
      searchHeadline: "Search flights",
      searchSubline:
        "Compare live fares from airlines. Prices shown include our service fee — what you see is what you pay.",
      bookingConfirmedTitle: "Booking confirmed",
    };
  }

  if (duffelMode === "live") {
    return {
      duffelMode,
      stripeMode,
      isProductionBooking: false,
      searchHeadline: "Flight search",
      searchSubline:
        "Duffel live inventory — card checkout is still in test mode until you add Stripe live keys.",
      bookingConfirmedTitle: "Booking confirmed",
    };
  }

  return {
    duffelMode,
    stripeMode,
    isProductionBooking: false,
    searchHeadline: "Flight search (test)",
    searchSubline:
      "Duffel test inventory. Use test cards with Stripe or Duffel test balance — no real tickets charged.",
    bookingConfirmedTitle: "Booking confirmed (test)",
  };
}
