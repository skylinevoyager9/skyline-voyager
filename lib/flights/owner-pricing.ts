import type { FlightOfferSummary, FlightSearchResponse } from "@/lib/duffel/types";

const OWNER_KEY_STORAGE = "sv_owner_pricing_key";

/** Server-only secret — never use NEXT_PUBLIC_. */
export function isOwnerPricingKeyValid(key: string | null | undefined): boolean {
  const secret = process.env.OWNER_PRICING_KEY?.trim();
  if (!secret || !key?.trim()) return false;
  return key.trim() === secret;
}

export function stripOwnerFieldsFromOffer(offer: FlightOfferSummary): FlightOfferSummary {
  return {
    ...offer,
    baseAmount: "0",
    markupAmount: "0",
    paymentAmount: "0",
    // Keep markupPercent + customerAmount so checkout uses the same fee % as search.
  };
}

export function sanitizeFlightSearchResponse(
  data: FlightSearchResponse,
  includeOwnerFields: boolean,
): FlightSearchResponse {
  if (includeOwnerFields) {
    return { ...data, pricingView: "owner" };
  }
  return {
    ...data,
    pricingView: "public",
    offers: data.offers.map(stripOwnerFieldsFromOffer),
  };
}

/** Client session helper (stores key only after server validated URL). */
export function readStoredOwnerPricingKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(OWNER_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function storeOwnerPricingKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(OWNER_KEY_STORAGE, key);
  } catch {
    /* ignore */
  }
}

export function clearStoredOwnerPricingKey(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(OWNER_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}
