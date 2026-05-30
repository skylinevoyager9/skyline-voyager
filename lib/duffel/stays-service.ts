import { DuffelApiError, duffelRequest } from "./client";
import { DuffelConfigError } from "./config";
import { mapDuffelErrorForClient } from "./flight-service";
import {
  extractStayRatesFromSearchResult,
  mapStayQuote,
  mapStayRate,
  mapStaySearchResult,
} from "./stays-mappers";
import type {
  StayBookRequest,
  StayBookResponse,
  StayQuoteSummary,
  StayRatesResponse,
  StaySearchRequest,
  StaySearchResponse,
  StaySearchResultSummary,
} from "./stays-types";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";
import { getPublishedFlightMarkupPercent } from "@/lib/flights/published-markup-store";
import { assertStayPaymentSucceeded, StripePaymentError } from "@/lib/stripe/verify-stay-payment";

export { mapDuffelErrorForClient };

type StaysSearchResponse = { data?: { results?: unknown[]; live_mode?: boolean } };
type StaysSearchResultResponse = { data?: Record<string, unknown> };
type StaysQuoteResponse = { data?: Record<string, unknown> };
type StaysBookingResponse = {
  data?: {
    id?: string;
    reference?: string;
    live_mode?: boolean;
    status?: string;
  };
};

function guestPayload(guests: StaySearchRequest["guests"]) {
  return guests.map((g) =>
    g.type === "child" ? { type: "child" as const, age: g.age } : { type: "adult" as const },
  );
}

export async function searchStays(search: StaySearchRequest): Promise<StaySearchResponse> {
  const markupPercent = search.markupPercent ?? (await getPublishedFlightMarkupPercent());
  const radius = search.radiusKm ?? 8;

  const res = await duffelRequest<StaysSearchResponse>({
    method: "POST",
    path: "/stays/search",
    body: {
      data: {
        rooms: search.rooms,
        guests: guestPayload(search.guests),
        check_in_date: search.checkInDate,
        check_out_date: search.checkOutDate,
        location: {
          radius,
          geographic_coordinates: {
            latitude: search.latitude,
            longitude: search.longitude,
          },
        },
      },
    },
  });

  const rawResults = res.data?.results ?? [];
  const results: StaySearchResultSummary[] = [];
  for (const item of rawResults) {
    if (!item || typeof item !== "object") continue;
    const mapped = mapStaySearchResult(item as Record<string, unknown>, markupPercent);
    if (mapped) results.push(mapped);
  }

  results.sort(
    (a, b) => Number.parseFloat(a.customerAmount) - Number.parseFloat(b.customerAmount),
  );

  return {
    liveMode: res.data?.live_mode === true,
    results,
  };
}

export async function fetchStayRates(
  searchResultId: string,
  markupPercent?: number,
): Promise<StayRatesResponse> {
  const percent = markupPercent ?? (await getPublishedFlightMarkupPercent());

  const res = await duffelRequest<StaysSearchResultResponse>({
    method: "GET",
    path: `/stays/search_results/${encodeURIComponent(searchResultId)}/rates`,
  });

  const data = res.data ?? {};
  const acc = data.accommodation;
  const accommodationName =
    acc && typeof acc === "object" && typeof (acc as Record<string, unknown>).name === "string"
      ? ((acc as Record<string, unknown>).name as string)
      : "Hotel";

  let rates = extractStayRatesFromSearchResult(data, percent);

  if (rates.length === 0 && acc && typeof acc === "object") {
    const rooms = (acc as Record<string, unknown>).rooms;
    if (Array.isArray(rooms)) {
      for (const roomRaw of rooms) {
        if (!roomRaw || typeof roomRaw !== "object") continue;
        const room = roomRaw as Record<string, unknown>;
        const roomRates = room.rates;
        if (!Array.isArray(roomRates)) continue;
        for (const rateRaw of roomRates) {
          if (!rateRaw || typeof rateRaw !== "object") continue;
          const mapped = mapStayRate(room, rateRaw as Record<string, unknown>, percent);
          if (mapped) rates.push(mapped);
        }
      }
      rates.sort(
        (a, b) => Number.parseFloat(a.customerAmount) - Number.parseFloat(b.customerAmount),
      );
    }
  }

  return {
    searchResultId,
    accommodationName,
    checkInDate: typeof data.check_in_date === "string" ? data.check_in_date : "",
    checkOutDate: typeof data.check_out_date === "string" ? data.check_out_date : "",
    rates,
  };
}

export async function createStayQuote(
  rateId: string,
  markupPercent?: number,
  context?: { accommodationName?: string; searchResultId?: string },
): Promise<StayQuoteSummary> {
  const percent = markupPercent ?? (await getPublishedFlightMarkupPercent());

  const res = await duffelRequest<StaysQuoteResponse>({
    method: "POST",
    path: "/stays/quotes",
    body: { data: { rate_id: rateId } },
  });

  const mapped = mapStayQuote(res.data ?? {}, percent, context);
  if (!mapped) {
    throw new DuffelApiError(502, [{ message: "Could not parse stay quote." }]);
  }
  return mapped;
}

export async function getStayQuote(
  quoteId: string,
  markupPercent?: number,
): Promise<StayQuoteSummary | null> {
  const percent = markupPercent ?? (await getPublishedFlightMarkupPercent());
  const res = await duffelRequest<StaysQuoteResponse>({
    method: "GET",
    path: `/stays/quotes/${encodeURIComponent(quoteId)}`,
  });
  return mapStayQuote(res.data ?? {}, percent);
}

export async function bookStay(request: StayBookRequest): Promise<StayBookResponse> {
  const quote = await getStayQuote(request.quoteId, request.markupPercent);
  if (!quote) {
    throw new DuffelApiError(404, [{ message: "Quote not found or expired." }]);
  }

  if (request.guests.length === 0) {
    throw new DuffelApiError(400, [{ message: "At least one guest is required." }]);
  }

  const paymentMode = getFlightPaymentMode();
  if (paymentMode === "stripe") {
    if (!request.paymentIntentId) {
      throw new DuffelApiError(400, [
        { message: "Card payment is required before booking this stay." },
      ]);
    }
    await assertStayPaymentSucceeded(request.paymentIntentId, quote);
  } else if (request.paymentIntentId) {
    throw new DuffelApiError(400, [
      { message: "Card payment is not used in test balance mode." },
    ]);
  }

  const lead = request.guests[0];
  const res = await duffelRequest<StaysBookingResponse>({
    method: "POST",
    path: "/stays/bookings",
    body: {
      data: {
        quote_id: quote.quoteId,
        email: request.email.trim(),
        phone_number: request.phoneNumber.trim(),
        guests: request.guests.map((g) => ({
          given_name: g.givenName.trim(),
          family_name: g.familyName.trim(),
          ...(g.bornOn ? { born_on: g.bornOn } : {}),
        })),
        ...(request.accommodationSpecialRequests?.trim()
          ? { accommodation_special_requests: request.accommodationSpecialRequests.trim() }
          : {}),
      },
    },
  });

  const data = res.data ?? {};
  const bookingId = typeof data.id === "string" ? data.id : "";
  const bookingReference = typeof data.reference === "string" ? data.reference : "";

  if (!bookingId) {
    throw new DuffelApiError(502, [{ message: "Booking response missing id." }]);
  }

  return {
    bookingId,
    bookingReference,
    currency: quote.currency,
    customerAmount: quote.customerAmount,
    supplierAmount: quote.supplierAmount,
    liveMode: data.live_mode === true,
  };
}

export async function getStayBooking(bookingId: string) {
  const res = await duffelRequest<StaysBookingResponse>({
    method: "GET",
    path: `/stays/bookings/${encodeURIComponent(bookingId)}`,
  });
  return res.data ?? null;
}

export type { DuffelConfigError, StripePaymentError };
