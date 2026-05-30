import { getDuffelMode } from "@/lib/duffel/config";
import { getStripeSecretKey } from "@/lib/stripe/config";

export type StayRuntimeLabels = {
  duffelMode: "test" | "live";
  stripeMode: "test" | "live" | "off";
  isProductionBooking: boolean;
  searchHeadline: string;
  searchSubline: string;
  bookingConfirmedTitle: string;
};

export function getStayRuntimeLabels(): StayRuntimeLabels {
  const duffelMode = getDuffelMode();
  const sk = getStripeSecretKey();
  const stripeMode = !sk ? "off" : sk.startsWith("sk_live_") ? "live" : "test";
  const isProductionBooking = duffelMode === "live" && stripeMode === "live";

  if (isProductionBooking) {
    return {
      duffelMode,
      stripeMode,
      isProductionBooking: true,
      searchHeadline: "Search hotels & stays",
      searchSubline:
        "Compare live availability. Prices include our service fee — what you see is what you pay.",
      bookingConfirmedTitle: "Stay confirmed",
    };
  }

  if (duffelMode === "live") {
    return {
      duffelMode,
      stripeMode,
      isProductionBooking: false,
      searchHeadline: "Search hotels & stays",
      searchSubline:
        "Duffel live inventory — add Stripe live keys for card checkout on production.",
      bookingConfirmedTitle: "Stay confirmed",
    };
  }

  return {
    duffelMode,
    stripeMode,
    isProductionBooking: false,
    searchHeadline: "Search hotels & stays (test)",
    searchSubline:
      "Duffel test properties. Use test Stripe keys or test balance — no real reservations charged.",
    bookingConfirmedTitle: "Stay confirmed (test)",
  };
}
