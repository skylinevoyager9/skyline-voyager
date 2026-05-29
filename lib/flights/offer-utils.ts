import type { FlightOfferSummary } from "@/lib/duffel/types";

export type OfferSortKey = "price" | "duration" | "departure";

export type OfferFilters = {
  directOnly: boolean;
  maxStops: number | null;
  airline: string | null;
};

export type PriceInsights = {
  count: number;
  min: number;
  max: number;
  currency: string;
  cheapestId: string | null;
  fastestId: string | null;
};

export function parseDurationMinutes(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (Number(m[1] ?? 0) || 0) * 60 + (Number(m[2] ?? 0) || 0);
}

export function getOfferStops(offer: FlightOfferSummary): number {
  let max = 0;
  for (const slice of offer.slices) {
    const stops = Math.max(0, slice.segments.length - 1);
    if (stops > max) max = stops;
  }
  return max;
}

export function getOfferDurationMinutes(offer: FlightOfferSummary): number {
  let total = 0;
  for (const slice of offer.slices) {
    for (const seg of slice.segments) {
      total += parseDurationMinutes(seg.duration);
    }
  }
  return total;
}

export function getOfferFirstDepartureMs(offer: FlightOfferSummary): number {
  const first = offer.slices[0]?.segments[0]?.departingAt;
  if (!first) return 0;
  const t = new Date(first).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function getOfferAirlines(offer: FlightOfferSummary): string[] {
  const set = new Set<string>();
  for (const slice of offer.slices) {
    for (const seg of slice.segments) {
      if (seg.marketingCarrier) set.add(seg.marketingCarrier);
    }
  }
  return [...set];
}

export function getCustomerPrice(offer: FlightOfferSummary): number {
  return Number.parseFloat(offer.customerAmount);
}

export function getPriceInsights(offers: FlightOfferSummary[]): PriceInsights {
  if (offers.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      currency: "USD",
      cheapestId: null,
      fastestId: null,
    };
  }

  let min = Infinity;
  let max = 0;
  let cheapestId: string | null = null;
  let fastestId: string | null = null;
  let fastestMin = Infinity;

  for (const offer of offers) {
    const price = getCustomerPrice(offer);
    if (price < min) {
      min = price;
      cheapestId = offer.id;
    }
    if (price > max) max = price;
    const dur = getOfferDurationMinutes(offer);
    if (dur > 0 && dur < fastestMin) {
      fastestMin = dur;
      fastestId = offer.id;
    }
  }

  return {
    count: offers.length,
    min: min === Infinity ? 0 : min,
    max,
    currency: offers[0]!.currency,
    cheapestId,
    fastestId,
  };
}

export function filterOffers(
  offers: FlightOfferSummary[],
  filters: OfferFilters,
): FlightOfferSummary[] {
  return offers.filter((offer) => {
    const stops = getOfferStops(offer);
    if (filters.directOnly && stops > 0) return false;
    if (filters.maxStops !== null && stops > filters.maxStops) return false;
    if (filters.airline) {
      const airlines = getOfferAirlines(offer);
      if (!airlines.some((a) => a.toLowerCase().includes(filters.airline!.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });
}

export function sortOffers(
  offers: FlightOfferSummary[],
  sortBy: OfferSortKey,
): FlightOfferSummary[] {
  const copy = [...offers];
  copy.sort((a, b) => {
    if (sortBy === "price") {
      return getCustomerPrice(a) - getCustomerPrice(b);
    }
    if (sortBy === "duration") {
      return getOfferDurationMinutes(a) - getOfferDurationMinutes(b);
    }
    return getOfferFirstDepartureMs(a) - getOfferFirstDepartureMs(b);
  });
  return copy;
}

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function stopsLabel(stops: number): string {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}
