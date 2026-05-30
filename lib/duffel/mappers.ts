import {
  getOfferDurationMinutes,
  getOfferStops,
} from "@/lib/flights/offer-utils";
import { buildDuffelSlicesFromRequest } from "@/lib/flights/trip-types";
import { parseDuffelFareRules } from "@/lib/flights/fare-rules";
import { applyFlightMarkup } from "./pricing";
import type {
  FlightAvailableService,
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

type DuffelAvailableServiceRaw = {
  id?: string;
  type?: string;
  total_amount?: string;
  total_currency?: string;
  maximum_quantity?: number;
  segment_ids?: string[];
  passenger_ids?: string[];
  metadata?: Record<string, unknown>;
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
  available_services?: DuffelAvailableServiceRaw[];
};

function baggageServiceLabel(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return "Extra baggage";
  const type = typeof metadata.type === "string" ? metadata.type.replace(/_/g, " ") : "";
  const weight =
    typeof metadata.maximum_weight_kg === "number"
      ? `${metadata.maximum_weight_kg}kg`
      : typeof metadata.maximum_weight_kg === "string"
        ? `${metadata.maximum_weight_kg}kg`
        : "";
  const parts = ["Extra baggage", type, weight].filter(Boolean);
  return parts.join(" · ") || "Extra baggage";
}

export function mapDuffelAvailableServices(
  raw: DuffelAvailableServiceRaw[] | undefined,
): FlightAvailableService[] {
  if (!raw?.length) return [];
  const services: FlightAvailableService[] = [];
  for (const item of raw) {
    if (item.type !== "baggage" || !item.id) continue;
    const amount = item.total_amount;
    const currency = item.total_currency;
    const maxQ = item.maximum_quantity;
    if (!amount || !currency || !Number.isFinite(maxQ) || maxQ! < 1) continue;
    services.push({
      id: item.id,
      type: "baggage",
      totalAmount: amount,
      totalCurrency: currency,
      maximumQuantity: maxQ!,
      segmentIds: Array.isArray(item.segment_ids) ? item.segment_ids.filter(Boolean) : [],
      passengerIds: Array.isArray(item.passenger_ids) ? item.passenger_ids.filter(Boolean) : [],
      label: baggageServiceLabel(item.metadata),
    });
  }
  return services;
}

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
    // Duffel recommends explicit max_connections (0 or 1) for relevance and speed.
    max_connections: search.maxConnections ?? 1,
  };

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

  const availableServices = mapDuffelAvailableServices(offer.available_services);
  if (availableServices.length) mapped.availableServices = availableServices;

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
