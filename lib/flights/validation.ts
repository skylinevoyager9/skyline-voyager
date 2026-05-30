import type {
  BookPassengerInput,
  CabinClass,
  FlightBookRequest,
  FlightSearchRequest,
  FlightSearchSlice,
  SelectedFlightService,
  TripType,
} from "@/lib/duffel/types";
import { clampMarkupPercent } from "@/lib/duffel/pricing";
import { MAX_MULTI_CITY_LEGS, MIN_MULTI_CITY_LEGS } from "@/lib/flights/trip-types";

const IATA_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CABIN: CabinClass[] = ["economy", "premium_economy", "business", "first"];
const TRIP_TYPES: TripType[] = ["one_way", "return", "multi_city"];

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; field?: string };

function parsePassengers(b: Record<string, unknown>) {
  const adults = typeof b.adults === "number" ? b.adults : Number(b.adults);
  const childrenRaw = b.children;
  const children =
    childrenRaw === undefined || childrenRaw === null || childrenRaw === ""
      ? 0
      : typeof childrenRaw === "number"
        ? childrenRaw
        : Number(childrenRaw);
  const cabinClass = typeof b.cabinClass === "string" ? b.cabinClass.trim() : "economy";

  if (!CABIN.includes(cabinClass as CabinClass)) {
    return { ok: false as const, error: "Invalid cabin class.", field: "cabinClass" };
  }
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) {
    return { ok: false as const, error: "Adults must be between 1 and 9.", field: "adults" };
  }
  if (!Number.isInteger(children) || children < 0 || children > 8) {
    return { ok: false as const, error: "Children must be between 0 and 8.", field: "children" };
  }
  if (adults + children > 9) {
    return { ok: false as const, error: "Maximum 9 passengers per booking.", field: "adults" };
  }

  return {
    ok: true as const,
    adults,
    children: children > 0 ? children : undefined,
    cabinClass: cabinClass as CabinClass,
  };
}

function validateDateNotPast(dateStr: string, field: string): ValidationResult<Date> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid date.", field };
  }
  if (d < today) {
    return { ok: false, error: "Date cannot be in the past.", field };
  }
  return { ok: true, value: d };
}

function validateLeg(
  leg: FlightSearchSlice,
  index: number,
  previousDeparture?: Date,
): ValidationResult<FlightSearchSlice> {
  const origin = leg.origin.trim().toUpperCase();
  const destination = leg.destination.trim().toUpperCase();
  const departureDate = leg.departureDate.trim();
  const prefix = `Flight ${index + 1}`;

  if (!IATA_RE.test(origin)) {
    return {
      ok: false,
      error: `${prefix}: choose an origin from suggestions or enter a 3-letter airport code.`,
      field: `slices.${index}.origin`,
    };
  }
  if (!IATA_RE.test(destination)) {
    return {
      ok: false,
      error: `${prefix}: choose a destination from suggestions or enter a 3-letter airport code.`,
      field: `slices.${index}.destination`,
    };
  }
  if (origin === destination) {
    return {
      ok: false,
      error: `${prefix}: origin and destination must differ.`,
      field: `slices.${index}.destination`,
    };
  }
  if (!DATE_RE.test(departureDate)) {
    return {
      ok: false,
      error: `${prefix}: departure must be YYYY-MM-DD.`,
      field: `slices.${index}.departureDate`,
    };
  }

  const depCheck = validateDateNotPast(departureDate, `slices.${index}.departureDate`);
  if (!depCheck.ok) {
    return { ok: false, error: `${prefix}: ${depCheck.error}`, field: depCheck.field };
  }

  if (previousDeparture && depCheck.value < previousDeparture) {
    return {
      ok: false,
      error: `${prefix}: departure must be on or after the previous flight.`,
      field: `slices.${index}.departureDate`,
    };
  }

  return { ok: true, value: { origin, destination, departureDate } };
}

function parseSearchEnhancements(b: Record<string, unknown>) {
  const directOnly = b.directOnly === true;
  const maxConnections: 0 | 1 | 2 = directOnly
    ? 0
    : b.maxConnections === 0 || b.maxConnections === 1 || b.maxConnections === 2
      ? b.maxConnections
      : 1;

  let flexDays: 0 | 1 | 3 = 0;
  const flexRaw = b.flexDays;
  if (flexRaw === 1 || flexRaw === 3) flexDays = flexRaw;
  else if (flexRaw === "1") flexDays = 1;
  else if (flexRaw === "3") flexDays = 3;

  return { maxConnections, flexDays, directOnly };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseOptionalTime(value: unknown, field: string): ValidationResult<string | undefined> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Invalid time format.", field };
  }
  const t = value.trim();
  if (!TIME_RE.test(t)) {
    return { ok: false, error: "Use 24-hour time HH:MM.", field };
  }
  return { ok: true, value: t };
}

function parseTimeWindow(
  b: Record<string, unknown>,
  prefix: string,
): ValidationResult<{ from?: string; to?: string } | undefined> {
  const fromKey = `${prefix}From`;
  const toKey = `${prefix}To`;
  const from = parseOptionalTime(b[fromKey], fromKey);
  if (!from.ok) return from;
  const to = parseOptionalTime(b[toKey], toKey);
  if (!to.ok) return to;
  if (!from.value && !to.value) return { ok: true, value: undefined };
  return { ok: true, value: { from: from.value, to: to.value } };
}

function parseTimeWindowObject(
  o: Record<string, unknown>,
  field: string,
): ValidationResult<{ from?: string; to?: string } | undefined> {
  const from = parseOptionalTime(o.from, `${field}.from`);
  if (!from.ok) return from;
  const to = parseOptionalTime(o.to, `${field}.to`);
  if (!to.ok) return to;
  if (!from.value && !to.value) return { ok: true, value: undefined };
  return { ok: true, value: { from: from.value, to: to.value } };
}

function parseOutboundTimeFilters(b: Record<string, unknown>): ValidationResult<{
  outboundDepartureTime?: { from?: string; to?: string };
  outboundArrivalTime?: { from?: string; to?: string };
}> {
  const depRaw = b.outboundDepartureTime;
  const dep =
    depRaw && typeof depRaw === "object"
      ? parseTimeWindowObject(depRaw as Record<string, unknown>, "outboundDepartureTime")
      : parseTimeWindow(b, "outboundDepartureTime");
  if (!dep.ok) return dep;

  const arrRaw = b.outboundArrivalTime;
  const arr =
    arrRaw && typeof arrRaw === "object"
      ? parseTimeWindowObject(arrRaw as Record<string, unknown>, "outboundArrivalTime")
      : parseTimeWindow(b, "outboundArrivalTime");
  if (!arr.ok) return arr;

  return {
    ok: true,
    value: {
      ...(dep.value ? { outboundDepartureTime: dep.value } : {}),
      ...(arr.value ? { outboundArrivalTime: arr.value } : {}),
    },
  };
}

function parseSlices(raw: unknown): FlightSearchSlice[] | null {
  if (!Array.isArray(raw)) return null;
  const slices: FlightSearchSlice[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    slices.push({
      origin: typeof o.origin === "string" ? o.origin : "",
      destination: typeof o.destination === "string" ? o.destination : "",
      departureDate: typeof o.departureDate === "string" ? o.departureDate : "",
    });
  }
  return slices;
}

function parseSearchBody(body: unknown): ValidationResult<FlightSearchRequest> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  const tripTypeRaw = typeof b.tripType === "string" ? b.tripType.trim() : "";
  const tripType: TripType = TRIP_TYPES.includes(tripTypeRaw as TripType)
    ? (tripTypeRaw as TripType)
    : b.returnDate
      ? "return"
      : "one_way";

  const passengers = parsePassengers(b);
  if (!passengers.ok) return passengers;

  if (tripType === "multi_city") {
    const slices = parseSlices(b.slices);
    if (!slices || slices.length < MIN_MULTI_CITY_LEGS) {
      return {
        ok: false,
        error: `Multi-city requires at least ${MIN_MULTI_CITY_LEGS} flights.`,
        field: "slices",
      };
    }
    if (slices.length > MAX_MULTI_CITY_LEGS) {
      return {
        ok: false,
        error: `Multi-city supports up to ${MAX_MULTI_CITY_LEGS} flights.`,
        field: "slices",
      };
    }

    const validated: FlightSearchSlice[] = [];
    let previousDep: Date | undefined;
    for (let i = 0; i < slices.length; i += 1) {
      const legResult = validateLeg(slices[i]!, i, previousDep);
      if (!legResult.ok) return legResult;
      validated.push(legResult.value);
      previousDep = new Date(`${legResult.value.departureDate}T00:00:00`);
    }

    const first = validated[0]!;
    const enhanced = parseSearchEnhancements(b);
    const times = parseOutboundTimeFilters(b);
    if (!times.ok) return times;
    return {
      ok: true,
      value: {
        tripType,
        origin: first.origin,
        destination: first.destination,
        departureDate: first.departureDate,
        slices: validated,
        adults: passengers.adults,
        children: passengers.children,
        cabinClass: passengers.cabinClass,
        maxConnections: enhanced.maxConnections,
        flexDays: 0,
        ...times.value,
      },
    };
  }

  const origin = typeof b.origin === "string" ? b.origin.trim().toUpperCase() : "";
  const destination =
    typeof b.destination === "string" ? b.destination.trim().toUpperCase() : "";
  const departureDate =
    typeof b.departureDate === "string" ? b.departureDate.trim() : "";
  const returnDate =
    typeof b.returnDate === "string" && b.returnDate.trim() ? b.returnDate.trim() : undefined;

  if (!IATA_RE.test(origin)) {
    return {
      ok: false,
      error: "Choose an origin from the suggestions or enter a 3-letter airport code.",
      field: "origin",
    };
  }
  if (!IATA_RE.test(destination)) {
    return {
      ok: false,
      error: "Choose a destination from the suggestions or enter a 3-letter airport code.",
      field: "destination",
    };
  }
  if (origin === destination) {
    return { ok: false, error: "Origin and destination must differ.", field: "destination" };
  }
  if (!DATE_RE.test(departureDate)) {
    return { ok: false, error: "Departure date must be YYYY-MM-DD.", field: "departureDate" };
  }

  const depCheck = validateDateNotPast(departureDate, "departureDate");
  if (!depCheck.ok) return depCheck;

  if (tripType === "return") {
    if (!returnDate || !DATE_RE.test(returnDate)) {
      return { ok: false, error: "Return date is required for round trips.", field: "returnDate" };
    }
    const retCheck = validateDateNotPast(returnDate, "returnDate");
    if (!retCheck.ok) return retCheck;
    if (retCheck.value < depCheck.value) {
      return {
        ok: false,
        error: "Return must be on or after departure.",
        field: "returnDate",
      };
    }
  } else if (returnDate) {
    return {
      ok: false,
      error: "Remove the return date for a one-way trip, or switch to Return.",
      field: "returnDate",
    };
  }

  const enhanced = parseSearchEnhancements(b);
  const times = parseOutboundTimeFilters(b);
  if (!times.ok) return times;

  return {
    ok: true,
    value: {
      tripType,
      origin,
      destination,
      departureDate,
      returnDate: tripType === "return" ? returnDate : undefined,
      adults: passengers.adults,
      children: passengers.children,
      cabinClass: passengers.cabinClass,
      maxConnections: enhanced.maxConnections,
      flexDays: enhanced.flexDays,
      ...times.value,
    },
  };
}

function parsePassenger(p: unknown, index: number): ValidationResult<BookPassengerInput> {
  if (typeof p !== "object" || p === null) {
    return { ok: false, error: `Passenger ${index + 1} is invalid.` };
  }
  const o = p as Record<string, unknown>;
  const passengerId = typeof o.passengerId === "string" ? o.passengerId.trim() : "";
  const givenName = typeof o.givenName === "string" ? o.givenName.trim() : "";
  const familyName = typeof o.familyName === "string" ? o.familyName.trim() : "";
  const bornOn = typeof o.bornOn === "string" ? o.bornOn.trim() : "";
  const gender = o.gender;
  const title = o.title;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const phoneNumber = typeof o.phoneNumber === "string" ? o.phoneNumber.trim() : "";

  if (!passengerId) return { ok: false, error: `Passenger ${index + 1}: missing id.` };
  if (givenName.length < 1) return { ok: false, error: `Passenger ${index + 1}: given name required.` };
  if (familyName.length < 1) return { ok: false, error: `Passenger ${index + 1}: family name required.` };
  if (!DATE_RE.test(bornOn)) return { ok: false, error: `Passenger ${index + 1}: bornOn YYYY-MM-DD.` };
  if (gender !== "m" && gender !== "f") return { ok: false, error: `Passenger ${index + 1}: gender m or f.` };
  if (!["mr", "mrs", "ms", "miss", "dr"].includes(String(title))) {
    return { ok: false, error: `Passenger ${index + 1}: invalid title.` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: `Passenger ${index + 1}: valid email required.` };
  }
  if (phoneNumber.length < 8) {
    return { ok: false, error: `Passenger ${index + 1}: phone number required.` };
  }

  return {
    ok: true,
    value: {
      passengerId,
      givenName,
      familyName,
      bornOn,
      gender,
      title: title as BookPassengerInput["title"],
      email,
      phoneNumber,
    },
  };
}

export function parseSelectedFlightServices(body: unknown): SelectedFlightService[] {
  if (typeof body !== "object" || body === null) return [];
  const raw = (body as Record<string, unknown>).selectedServices;
  if (!Array.isArray(raw)) return [];

  const selected: SelectedFlightService[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const serviceId = typeof o.serviceId === "string" ? o.serviceId.trim() : "";
    const quantity =
      typeof o.quantity === "number" ? o.quantity : Number.parseInt(String(o.quantity), 10);
    if (!serviceId) continue;
    if (!Number.isInteger(quantity) || quantity < 1) continue;
    selected.push({ serviceId, quantity });
  }
  return selected;
}

function parseBookBody(body: unknown): ValidationResult<FlightBookRequest> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const offerId = typeof b.offerId === "string" ? b.offerId.trim() : "";
  if (!offerId.startsWith("off_")) {
    return { ok: false, error: "Invalid offer id.", field: "offerId" };
  }
  if (!Array.isArray(b.passengers) || b.passengers.length === 0) {
    return { ok: false, error: "At least one passenger is required.", field: "passengers" };
  }

  const passengers: BookPassengerInput[] = [];
  for (let i = 0; i < b.passengers.length; i += 1) {
    const parsed = parsePassenger(b.passengers[i], i);
    if (!parsed.ok) return parsed;
    passengers.push(parsed.value);
  }

  const paymentIntentIdRaw = b.paymentIntentId;
  const paymentIntentId =
    typeof paymentIntentIdRaw === "string" && paymentIntentIdRaw.trim()
      ? paymentIntentIdRaw.trim()
      : undefined;
  if (paymentIntentId && !paymentIntentId.startsWith("pi_")) {
    return { ok: false, error: "Invalid payment intent id.", field: "paymentIntentId" };
  }

  const markupPercent = parseMarkupPercentField(b.markupPercent);
  const selectedServices = parseSelectedFlightServices(b);

  return {
    ok: true,
    value: { offerId, passengers, paymentIntentId, markupPercent, selectedServices },
  };
}

function parseMarkupPercentField(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(n)) return undefined;
  return clampMarkupPercent(n);
}

export function parseRequestedMarkupPercent(body: unknown): number | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  return parseMarkupPercentField((body as Record<string, unknown>).markupPercent);
}

export function parseMarkupPercentQuery(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  return parseMarkupPercentField(raw.trim());
}

export function parseQuotedCustomerAmountQuery(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const amount = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return undefined;
  return amount;
}

export function parseOwnerPricingKey(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const raw = (body as Record<string, unknown>).ownerKey;
  if (typeof raw !== "string") return undefined;
  const key = raw.trim();
  return key.length > 0 ? key : undefined;
}

export function parseFlightSearchBody(body: unknown) {
  return parseSearchBody(body);
}

export function parseFlightBookBody(body: unknown) {
  return parseBookBody(body);
}
