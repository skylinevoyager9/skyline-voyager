import type { FlightSearchRequest, FlightSearchSlice } from "@/lib/duffel/types";

export type TripType = "one_way" | "return" | "multi_city";

export type FlightLeg = FlightSearchSlice;

export const MAX_MULTI_CITY_LEGS = 4;
export const MIN_MULTI_CITY_LEGS = 2;

export const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: "one_way", label: "One way" },
  { value: "return", label: "Return" },
  { value: "multi_city", label: "Multi-city" },
];

export function inferTripType(
  tripTypeRaw: string | null | undefined,
  returnDate?: string,
): TripType {
  if (tripTypeRaw === "one_way" || tripTypeRaw === "return" || tripTypeRaw === "multi_city") {
    return tripTypeRaw;
  }
  return returnDate ? "return" : "one_way";
}

export function defaultDepartureDate(daysFromNow = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function defaultReturnDate(departureDate: string, daysAfter = 2): string {
  const d = new Date(`${departureDate}T00:00:00`);
  d.setDate(d.getDate() + daysAfter);
  return d.toISOString().slice(0, 10);
}

export function emptyLeg(departureDate = defaultDepartureDate()): FlightLeg {
  return { origin: "", destination: "", departureDate };
}

export function buildDuffelSlicesFromRequest(search: FlightSearchRequest): Array<{
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: { from?: string; to?: string };
  arrival_time?: { from?: string; to?: string };
}> {
  const mapSlice = (
    s: FlightSearchSlice,
    index: number,
  ): {
    origin: string;
    destination: string;
    departure_date: string;
    departure_time?: { from?: string; to?: string };
    arrival_time?: { from?: string; to?: string };
  } => {
    const base = {
      origin: s.origin.toUpperCase(),
      destination: s.destination.toUpperCase(),
      departure_date: s.departureDate,
    };
    if (index !== 0) return base;

    const departureTime =
      s.departureTime ??
      (search.outboundDepartureTime?.from || search.outboundDepartureTime?.to
        ? search.outboundDepartureTime
        : undefined);
    const arrivalTime =
      s.arrivalTime ??
      (search.outboundArrivalTime?.from || search.outboundArrivalTime?.to
        ? search.outboundArrivalTime
        : undefined);

    return {
      ...base,
      ...(departureTime ? { departure_time: departureTime } : {}),
      ...(arrivalTime ? { arrival_time: arrivalTime } : {}),
    };
  };

  if (search.tripType === "multi_city" && search.slices?.length) {
    return search.slices.map((s, i) => mapSlice(s, i));
  }

  const slices = [mapSlice(
    {
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departureDate,
    },
    0,
  )];

  if (search.tripType === "return" && search.returnDate) {
    slices.push(
      mapSlice(
        {
          origin: search.destination,
          destination: search.origin,
          departureDate: search.returnDate,
        },
        1,
      ),
    );
  }

  return slices;
}
