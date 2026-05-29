import type { FlightSearchRequest, TripType } from "@/lib/duffel/types";
import type { FlightSearchQuery } from "@/lib/flights/search-url";
import type { FlightLeg } from "@/lib/flights/trip-types";
import { defaultDepartureDate, defaultReturnDate } from "@/lib/flights/trip-types";

export type FlightSearchFormState = {
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  legs: FlightLeg[];
  adults: number;
  children: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  /** Search outbound ±1 or ±3 days to surface lower fares. */
  flexDays: 0 | 1 | 3;
  /** When true, Duffel max_connections = 0. */
  directOnly: boolean;
};

export function createDefaultSearchForm(
  overrides?: Partial<FlightSearchFormState>,
): FlightSearchFormState {
  const departureDate = defaultDepartureDate();
  return {
    tripType: "return",
    origin: "LHR",
    destination: "JFK",
    departureDate,
    returnDate: defaultReturnDate(departureDate),
    legs: [
      { origin: "LHR", destination: "JFK", departureDate },
      {
        origin: "JFK",
        destination: "LAX",
        departureDate: defaultReturnDate(departureDate, 5),
      },
    ],
    adults: 1,
    children: 0,
    cabinClass: "economy",
    flexDays: 0,
    directOnly: false,
    ...overrides,
  };
}

function searchOptionsFromForm(form: FlightSearchFormState): Pick<
  FlightSearchRequest,
  "maxConnections" | "flexDays"
> {
  return {
    maxConnections: form.directOnly ? 0 : 1,
    flexDays: form.tripType === "multi_city" ? 0 : form.flexDays,
  };
}

export function formStateToSearchRequest(form: FlightSearchFormState): FlightSearchRequest {
  const options = searchOptionsFromForm(form);

  if (form.tripType === "multi_city") {
    return {
      tripType: "multi_city",
      origin: form.legs[0]?.origin ?? "",
      destination: form.legs[0]?.destination ?? "",
      departureDate: form.legs[0]?.departureDate ?? "",
      slices: form.legs,
      adults: form.adults,
      children: form.children > 0 ? form.children : undefined,
      cabinClass: form.cabinClass,
      maxConnections: options.maxConnections,
    };
  }

  return {
    tripType: form.tripType,
    origin: form.origin,
    destination: form.destination,
    departureDate: form.departureDate,
    returnDate: form.tripType === "return" ? form.returnDate : undefined,
    adults: form.adults,
    children: form.children > 0 ? form.children : undefined,
    cabinClass: form.cabinClass,
    ...options,
  };
}

export function formStateFromUrlQuery(query: Partial<FlightSearchQuery>): FlightSearchFormState {
  const tripType = query.tripType ?? (query.returnDate ? "return" : "one_way");
  const base = createDefaultSearchForm();

  if (tripType === "multi_city" && query.slices?.length) {
    return {
      ...base,
      tripType,
      legs: query.slices,
      origin: query.slices[0]!.origin,
      destination: query.slices[0]!.destination,
      departureDate: query.slices[0]!.departureDate,
      adults: query.adults && query.adults > 0 ? query.adults : 1,
      children: query.children ?? 0,
      cabinClass: query.cabinClass ?? "economy",
    };
  }

  return {
    ...base,
    tripType,
    origin: query.origin ?? base.origin,
    destination: query.destination ?? base.destination,
    departureDate: query.departureDate ?? base.departureDate,
    returnDate: query.returnDate ?? "",
    adults: query.adults && query.adults > 0 ? query.adults : 1,
    children: query.children ?? 0,
    cabinClass: query.cabinClass ?? "economy",
  };
}

export function applyTripTypeChange(
  prev: FlightSearchFormState,
  tripType: TripType,
): FlightSearchFormState {
  if (tripType === prev.tripType) return prev;

  if (tripType === "one_way") {
    return { ...prev, tripType, returnDate: "" };
  }

  if (tripType === "return") {
    const returnDate =
      prev.returnDate || defaultReturnDate(prev.departureDate || defaultDepartureDate());
    return { ...prev, tripType, returnDate };
  }

  const dep = prev.departureDate || defaultDepartureDate();
  return {
    ...prev,
    tripType,
    legs: [
      {
        origin: prev.origin || "LHR",
        destination: prev.destination || "JFK",
        departureDate: dep,
      },
      {
        origin: prev.destination || "JFK",
        destination: "",
        departureDate: defaultReturnDate(dep, 5),
      },
    ],
  };
}
