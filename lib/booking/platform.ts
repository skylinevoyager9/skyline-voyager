import { isDuffelConfigured } from "@/lib/duffel/config";
import type { GuideCategory } from "@/lib/guides/types";
import { HUB_EMPHASIS } from "@/lib/guides/hub-theme";
import type { PartnerKey } from "@/lib/partner-links";

/** Checkout on Skyline Voyager is flight-only via Duffel (no hotel OTA partners). */
export function usesDuffelFlightBooking(): boolean {
  return isDuffelConfigured();
}

/** Hide Booking.com / hotel OTA outbound partner CTAs. */
export function isHotelOtaPartnerEnabled(): boolean {
  return false;
}

export function visiblePartnerKeys(): PartnerKey[] {
  const keys: PartnerKey[] = ["flights", "booking", "cars", "viator", "getyourguide"];
  if (!isHotelOtaPartnerEnabled()) {
    return keys.filter((k) => k !== "booking");
  }
  return keys;
}

/** Which partner pill is primary on category hubs. */
export function hubBookingEmphasis(category: GuideCategory): PartnerKey {
  if (!isHotelOtaPartnerEnabled()) {
    return "flights";
  }
  return HUB_EMPHASIS[category];
}
