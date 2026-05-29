import { FLIGHTS_SEARCH_PATH } from "@/lib/flights/links";
import type { CabinClass, FlightSearchSlice, TripType } from "@/lib/duffel/types";
import { inferTripType } from "@/lib/flights/trip-types";

export type FlightSearchQuery = {
  tripType?: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  slices?: FlightSearchSlice[];
  adults?: number;
  children?: number;
  cabinClass?: CabinClass;
};

/** Deep-link into live search with prefilled fields. */
export function buildFlightSearchUrl(query: FlightSearchQuery): string {
  const params = new URLSearchParams();
  const tripType = query.tripType ?? inferTripType(undefined, query.returnDate);

  params.set("tripType", tripType);

  if (tripType === "multi_city" && query.slices?.length) {
    params.set("slices", JSON.stringify(query.slices));
    const first = query.slices[0]!;
    params.set("origin", first.origin.trim().toUpperCase());
    params.set("destination", first.destination.trim().toUpperCase());
    params.set("departureDate", first.departureDate.trim());
  } else {
    params.set("origin", query.origin.trim().toUpperCase());
    params.set("destination", query.destination.trim().toUpperCase());
    params.set("departureDate", query.departureDate.trim());
    if (tripType === "return" && query.returnDate?.trim()) {
      params.set("returnDate", query.returnDate.trim());
    }
  }

  if (query.adults != null) params.set("adults", String(query.adults));
  if (query.children != null && query.children > 0) {
    params.set("children", String(query.children));
  }
  if (query.cabinClass) params.set("cabinClass", query.cabinClass);
  return `${FLIGHTS_SEARCH_PATH}?${params.toString()}`;
}

function parseSlicesParam(raw: string | null): FlightSearchSlice[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    const slices: FlightSearchSlice[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const origin = typeof o.origin === "string" ? o.origin.trim().toUpperCase() : "";
      const destination =
        typeof o.destination === "string" ? o.destination.trim().toUpperCase() : "";
      const departureDate =
        typeof o.departureDate === "string" ? o.departureDate.trim() : "";
      if (origin && destination && departureDate) {
        slices.push({ origin, destination, departureDate });
      }
    }
    return slices.length >= 2 ? slices : undefined;
  } catch {
    return undefined;
  }
}

export function parseFlightSearchParams(
  params: URLSearchParams,
): Partial<FlightSearchQuery> | null {
  const tripType = inferTripType(params.get("tripType"), params.get("returnDate") ?? undefined);
  const slices = parseSlicesParam(params.get("slices"));

  if (tripType === "multi_city" && slices) {
    const adultsRaw = params.get("adults");
    const childrenRaw = params.get("children");
    const cabinClass = params.get("cabinClass")?.trim() as CabinClass | undefined;
    const first = slices[0]!;
    return {
      tripType,
      origin: first.origin,
      destination: first.destination,
      departureDate: first.departureDate,
      slices,
      adults: adultsRaw ? Number.parseInt(adultsRaw, 10) : undefined,
      children: childrenRaw ? Number.parseInt(childrenRaw, 10) : undefined,
      cabinClass,
    };
  }

  const origin = params.get("origin")?.trim().toUpperCase();
  const destination = params.get("destination")?.trim().toUpperCase();
  const departureDate = params.get("departureDate")?.trim();
  if (!origin || !destination || !departureDate) return null;

  const returnDate =
    tripType === "return" ? params.get("returnDate")?.trim() || undefined : undefined;
  const adultsRaw = params.get("adults");
  const childrenRaw = params.get("children");
  const cabinClass = params.get("cabinClass")?.trim() as CabinClass | undefined;

  return {
    tripType,
    origin,
    destination,
    departureDate,
    returnDate,
    adults: adultsRaw ? Number.parseInt(adultsRaw, 10) : undefined,
    children: childrenRaw ? Number.parseInt(childrenRaw, 10) : undefined,
    cabinClass,
  };
}
