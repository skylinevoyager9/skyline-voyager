import {
  getOfferDurationMinutes,
  getOfferStops,
} from "@/lib/flights/offer-utils";
import { buildDuffelSlicesFromRequest } from "@/lib/flights/trip-types";
import { parseDuffelFareRules } from "@/lib/flights/fare-rules";
import { applyFlightMarkup } from "./pricing";
import type {
  FlightOfferSummary,
  FlightSearchRequest,
  FlightSegmentSummary,
  FlightSliceSummary,
} from "./types";

type DuffelPlace = {
  iata_code?: string;
  name?: string;
};

type DuffelSegment = {
  departing_at?: string;
  arriving_at?: string;
  duration?: string;
  marketing_carrier?: { name?: string; iata_code?: string };
  operating_carrier?: { name?: string; iata_code?: string };
  marketing_carrier_flight_number?: string;
  origin?: DuffelPlace;
  destination?: DuffelPlace;
};

type DuffelSlice = {
  origin?: DuffelPlace;
  destination?: DuffelPlace;
  departure_date?: string;
  segments?: DuffelSegment[];
};

type DuffelCondition = {
  allowed?: boolean;
  penalty_amount?: string | null;
  penalty_currency?: string | null;
};

type DuffelConditions = {
  change_before_departure?: DuffelCondition | null;
  refund_before_departure?: DuffelCondition | null;
};

type DuffelPassengerBaggage = {
  quantity?: number;
  type?: string;
};

export type DuffelOffer = {
  id?: string;
  total_amount?: string;
  total_currency?: string;
  expires_at?: string;
  owner?: { name?: string };
  slices?: DuffelSlice[];
  passengers?: { id?: string; baggages?: DuffelPassengerBaggage[] }[];
  conditions?: DuffelConditions;
};

type DuffelOfferRequestData = {
  id?: string;
  live_mode?: boolean;
  offers?: DuffelOffer[];
  /** Passenger ids are often on the request, not duplicated on each offer. */
  passengers?: { id?: string }[];
};

export function buildDuffelOfferRequestBody(search: FlightSearchRequest) {
  const passengers: Array<{ type: "adult" } | { type: "child" }> = Array.from(
    { length: search.adults },
    () => ({ type: "adult" as const }),
  );
  const childCount = search.children ?? 0;
  for (let i = 0; i < childCount; i += 1) {
    passengers.push({ type: "child" });
  }

  const slices = buildDuffelSlicesFromRequest(search);

  const data: Record<string, unknown> = {
    slices,
    passengers,
    cabin_class: search.cabinClass,
  };

  if (search.maxConnections !== undefined) {
    data.max_connections = search.maxConnections;
  }

  return { data };
}

function summarizeBaggage(offer: DuffelOffer): string | null {
  const bags = offer.passengers?.[0]?.baggages;
  if (!bags?.length) return null;
  const checked = bags.find((b) => b.type === "checked")?.quantity ?? 0;
  const carryOn = bags.find((b) => b.type === "carry_on")?.quantity ?? 0;
  const parts: string[] = [];
  if (carryOn > 0) parts.push(`${carryOn} carry-on included`);
  if (checked > 0) parts.push(`${checked} checked bag${checked > 1 ? "s" : ""} included`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function mapSegment(seg: DuffelSegment): FlightSegmentSummary {
  return {
    origin: seg.origin?.iata_code ?? "",
    originName: seg.origin?.name,
    destination: seg.destination?.iata_code ?? "",
    destinationName: seg.destination?.name,
    departingAt: seg.departing_at ?? "",
    arrivingAt: seg.arriving_at ?? "",
    marketingCarrier: seg.marketing_carrier?.name ?? seg.marketing_carrier?.iata_code ?? "",
    operatingCarrier: seg.operating_carrier?.name ?? seg.operating_carrier?.iata_code ?? "",
    flightNumber: seg.marketing_carrier_flight_number,
    duration: seg.duration,
  };
}

function mapSlice(slice: DuffelSlice): FlightSliceSummary {
  const segments = (slice.segments ?? []).map(mapSegment);
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    origin: slice.origin?.iata_code ?? first?.origin ?? "",
    destination: slice.destination?.iata_code ?? last?.destination ?? "",
    departureDate: slice.departure_date ?? first?.departingAt?.slice(0, 10) ?? "",
    segments,
  };
}

export function mapDuffelOffer(
  offer: DuffelOffer,
  fallbackPassengerIds?: string[],
  outboundDate?: string,
): FlightOfferSummary | null {
  if (!offer.id || !offer.total_amount || !offer.total_currency) return null;

  const pricing = applyFlightMarkup(offer.total_amount);
  const baggageSummary = summarizeBaggage(offer);
  const fareRules = parseDuffelFareRules(offer.conditions, baggageSummary);
  let passengerIds = (offer.passengers ?? [])
    .map((p) => p.id)
    .filter((id): id is string => Boolean(id));
  if (passengerIds.length === 0 && fallbackPassengerIds?.length) {
    passengerIds = fallbackPassengerIds;
  }

  const mapped: FlightOfferSummary = {
    id: offer.id,
    currency: offer.total_currency,
    baseAmount: pricing.baseAmount,
    markupPercent: pricing.markupPercent,
    markupAmount: pricing.markupAmount,
    customerAmount: pricing.customerAmount,
    expiresAt: offer.expires_at,
    ownerName: offer.owner?.name,
    slices: (offer.slices ?? []).map(mapSlice),
    passengerIds,
    paymentAmount: pricing.baseAmount,
    paymentCurrency: offer.total_currency,
    stops: 0,
    totalDurationMinutes: 0,
    fareRules,
  };

  mapped.stops = getOfferStops(mapped);
  mapped.totalDurationMinutes = getOfferDurationMinutes(mapped);
  if (outboundDate) mapped.outboundDate = outboundDate;

  return mapped;
}

export function mapOfferRequestResponse(data: DuffelOfferRequestData) {
  const requestPassengerIds = (data.passengers ?? [])
    .map((p) => p.id)
    .filter((id): id is string => Boolean(id));

  const offers = (data.offers ?? [])
    .map((o) => mapDuffelOffer(o, requestPassengerIds))
    .filter((o): o is FlightOfferSummary => o !== null)
    .sort((a, b) => Number.parseFloat(a.customerAmount) - Number.parseFloat(b.customerAmount));

  return {
    offerRequestId: data.id ?? "",
    liveMode: Boolean(data.live_mode),
    offers,
  };
}

type DuffelOrderData = {
  id?: string;
  live_mode?: boolean;
  booking_reference?: string;
  total_amount?: string;
  total_currency?: string;
};

export function mapDuffelOrder(data: DuffelOrderData) {
  return {
    orderId: data.id ?? "",
    bookingReference: data.booking_reference,
    currency: data.total_currency ?? "USD",
    baseAmount: data.total_amount ?? "0",
    liveMode: Boolean(data.live_mode),
  };
}
