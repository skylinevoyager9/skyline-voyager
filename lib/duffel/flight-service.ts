import { DuffelApiError, duffelRequest } from "./client";
import { DuffelConfigError } from "./config";
import {
  buildDuffelOfferRequestBody,
  mapDuffelOffer,
  mapDuffelOrder,
  mapOfferRequestResponse,
} from "./mappers";
import type { DuffelOffer } from "./mappers";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";
import { assertFlightPaymentSucceeded, StripePaymentError } from "@/lib/stripe/verify-payment";
import { applyFlightMarkup, repriceFlightOffer } from "./pricing";
import { getPublishedFlightMarkupPercent } from "@/lib/flights/published-markup-store";
import type {
  FlightBookRequest,
  FlightBookResponse,
  FlightOfferSummary,
  FlightSearchRequest,
  FlightSearchResponse,
} from "./types";

type DuffelOfferRequestCreateResponse = {
  data: {
    id?: string;
    live_mode?: boolean;
    offers?: unknown[];
  };
};

type DuffelOfferGetResponse = {
  data: unknown;
};

type DuffelOrderCreateResponse = {
  data: {
    id?: string;
    live_mode?: boolean;
    booking_reference?: string;
    total_amount?: string;
    total_currency?: string;
  };
};

function getSupplierTimeoutMs(): number {
  const raw = process.env.FLIGHT_SEARCH_TIMEOUT_MS?.trim();
  if (!raw) return 45_000;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 10_000) return 45_000;
  return Math.min(n, 90_000);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function flexDepartureDates(departureDate: string, flexDays: 1 | 3): string[] {
  const dates: string[] = [];
  for (let offset = -flexDays; offset <= flexDays; offset += 1) {
    dates.push(shiftDate(departureDate, offset));
  }
  return dates;
}

async function createOfferRequest(
  search: FlightSearchRequest,
  departureDateOverride?: string,
): Promise<FlightSearchResponse> {
  const payload: FlightSearchRequest = departureDateOverride
    ? { ...search, departureDate: departureDateOverride, flexDays: 0 }
    : { ...search, flexDays: 0 };

  const body = buildDuffelOfferRequestBody(payload);

  const res = await duffelRequest<DuffelOfferRequestCreateResponse>({
    method: "POST",
    path: "/air/offer_requests",
    query: { return_offers: true, supplier_timeout: getSupplierTimeoutMs() },
    body,
  });

  const mapped = mapOfferRequestResponse(
    (res.data ?? {}) as Parameters<typeof mapOfferRequestResponse>[0],
  );

  if (departureDateOverride) {
    mapped.offers = mapped.offers.map((o) => ({
      ...o,
      outboundDate: departureDateOverride,
    }));
  }

  return mapped;
}

function mergeSearchResults(
  batches: FlightSearchResponse[],
  flexDatesSearched: string[],
): FlightSearchResponse {
  const seen = new Set<string>();
  const offers: FlightOfferSummary[] = [];

  for (const batch of batches) {
    for (const offer of batch.offers) {
      if (seen.has(offer.id)) continue;
      seen.add(offer.id);
      offers.push(offer);
    }
  }

  offers.sort(
    (a, b) => Number.parseFloat(a.customerAmount) - Number.parseFloat(b.customerAmount),
  );

  return {
    offerRequestId: batches[0]?.offerRequestId ?? "",
    liveMode: batches.some((b) => b.liveMode),
    offers,
    flexDatesSearched,
  };
}

export async function searchFlights(search: FlightSearchRequest): Promise<FlightSearchResponse> {
  const flexDays = search.flexDays ?? 0;
  const canFlex =
    flexDays > 0 &&
    search.tripType !== "multi_city" &&
    search.departureDate;

  if (!canFlex) {
    return createOfferRequest(search);
  }

  const dates = flexDepartureDates(search.departureDate, flexDays === 3 ? 3 : 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validDates = dates.filter((d) => new Date(`${d}T00:00:00`) >= today);

  const settled = await Promise.allSettled(
    validDates.map((date) => createOfferRequest(search, date)),
  );

  const batches: FlightSearchResponse[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") batches.push(result.value);
  }

  if (batches.length === 0) {
    throw new DuffelApiError(502, [{ message: "Flexible date search returned no results." }]);
  }

  return mergeSearchResults(batches, validDates);
}

export async function getOffer(
  offerId: string,
  markupPercent?: number,
): Promise<FlightOfferSummary | null> {
  const res = await duffelRequest<DuffelOfferGetResponse>({
    method: "GET",
    path: `/air/offers/${encodeURIComponent(offerId)}`,
  });
  const mapped = mapDuffelOffer((res.data ?? {}) as DuffelOffer);
  if (!mapped) return null;

  const percent = markupPercent ?? (await getPublishedFlightMarkupPercent());
  if (percent !== mapped.markupPercent) {
    return repriceFlightOffer(mapped, percent);
  }
  return mapped;
}

export async function bookFlight(request: FlightBookRequest): Promise<FlightBookResponse> {
  const offer = await getOffer(request.offerId, request.markupPercent);
  if (!offer) {
    throw new DuffelApiError(404, [{ message: "Offer not found or expired." }]);
  }

  if (request.passengers.length !== offer.passengerIds.length) {
    throw new DuffelApiError(400, [
      {
        message: `This offer requires ${offer.passengerIds.length} passenger(s).`,
      },
    ]);
  }

  const idSet = new Set(offer.passengerIds);
  for (const p of request.passengers) {
    if (!idSet.has(p.passengerId)) {
      throw new DuffelApiError(400, [{ message: `Unknown passenger id: ${p.passengerId}` }]);
    }
  }

  const paymentMode = getFlightPaymentMode();
  if (paymentMode === "stripe") {
    if (!request.paymentIntentId) {
      throw new DuffelApiError(400, [
        { message: "Card payment is required before booking this offer." },
      ]);
    }
    await assertFlightPaymentSucceeded(request.paymentIntentId, offer);
  } else if (request.paymentIntentId) {
    throw new DuffelApiError(400, [
      { message: "Card payment is not used in test balance mode." },
    ]);
  }

  const orderBody = {
    data: {
      type: "instant",
      selected_offers: [offer.id],
      payments: [
        {
          type: "balance",
          currency: offer.paymentCurrency,
          amount: offer.paymentAmount,
        },
      ],
      passengers: request.passengers.map((p) => ({
        id: p.passengerId,
        given_name: p.givenName,
        family_name: p.familyName,
        born_on: p.bornOn,
        gender: p.gender,
        title: p.title,
        email: p.email,
        phone_number: p.phoneNumber,
      })),
    },
  };

  const res = await duffelRequest<DuffelOrderCreateResponse>({
    method: "POST",
    path: "/air/orders",
    body: orderBody,
  });

  const order = mapDuffelOrder(res.data ?? {});
  return {
    orderId: order.orderId,
    bookingReference: order.bookingReference,
    currency: offer.currency,
    customerAmount: offer.customerAmount,
    baseAmount: offer.baseAmount,
    liveMode: order.liveMode,
  };
}

export async function getDuffelOrder(orderId: string) {
  const res = await duffelRequest<{ data?: { booking_reference?: string; id?: string } }>({
    method: "GET",
    path: `/air/orders/${encodeURIComponent(orderId)}`,
  });
  return res.data ?? null;
}

export function mapDuffelErrorForClient(err: unknown): {
  status: number;
  error: string;
  code: string;
} {
  if (err instanceof DuffelConfigError) {
    return { status: 503, error: err.message, code: err.code };
  }
  if (err instanceof StripePaymentError) {
    return { status: 402, error: err.message, code: err.code };
  }
  if (err instanceof DuffelApiError) {
    return {
      status: err.status >= 400 && err.status < 600 ? err.status : 502,
      error: err.message,
      code: "duffel_api_error",
    };
  }
  if (err instanceof Error) {
    return { status: 500, error: err.message, code: "internal_error" };
  }
  return { status: 500, error: "Unexpected error.", code: "internal_error" };
}
