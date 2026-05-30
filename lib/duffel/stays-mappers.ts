import { applyStaysMarkup } from "@/lib/stays/pricing";
import type {
  StayQuoteSummary,
  StayRateSummary,
  StaySearchResultSummary,
} from "@/lib/duffel/stays-types";

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}

function rateSupportsBalance(methods: unknown): boolean {
  if (!Array.isArray(methods)) return false;
  for (const entry of methods) {
    if (entry === "balance") return true;
    if (Array.isArray(entry) && entry.includes("balance")) return true;
  }
  return false;
}

function mapCancellationTimeline(raw: unknown): StayRateSummary["cancellationTimeline"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const before = str(o.before);
      const refundAmount = str(o.refund_amount);
      const currency = str(o.currency);
      if (!before || !refundAmount || !currency) return null;
      return { before, refundAmount, currency };
    })
    .filter((x): x is StayRateSummary["cancellationTimeline"][number] => x !== null);
}

function pickSupplierAmount(rate: Record<string, unknown>): string | undefined {
  return str(rate.total_amount) ?? str(rate.base_amount);
}

export function mapStaySearchResult(
  raw: Record<string, unknown>,
  markupPercent: number,
): StaySearchResultSummary | null {
  const searchResultId = str(raw.id);
  const acc = raw.accommodation;
  if (!searchResultId || !acc || typeof acc !== "object") return null;
  const accommodation = acc as Record<string, unknown>;

  const supplier =
    str(raw.cheapest_rate_total_amount) ??
    str(raw.cheapest_rate_base_amount) ??
    str(raw.cheapest_rate_public_amount);
  const currency =
    str(raw.cheapest_rate_currency) ??
    str(raw.cheapest_rate_base_currency) ??
    str(raw.cheapest_rate_public_currency);
  if (!supplier || !currency) return null;

  const pricing = applyStaysMarkup(supplier, markupPercent);
  const location = accommodation.location;
  let cityName: string | undefined;
  let lineOne: string | undefined;
  if (location && typeof location === "object") {
    const addr = (location as Record<string, unknown>).address;
    if (addr && typeof addr === "object") {
      cityName = str((addr as Record<string, unknown>).city_name);
      lineOne = str((addr as Record<string, unknown>).line_one);
    }
  }

  const photos = accommodation.photos;
  let photoUrl: string | undefined;
  if (Array.isArray(photos) && photos[0] && typeof photos[0] === "object") {
    photoUrl = str((photos[0] as Record<string, unknown>).url);
  }

  return {
    searchResultId,
    accommodationId: str(accommodation.id) ?? "",
    name: str(accommodation.name) ?? "Hotel",
    cityName,
    lineOne,
    rating: num(accommodation.rating),
    reviewScore: num(accommodation.review_score),
    photoUrl,
    checkInDate: str(raw.check_in_date) ?? "",
    checkOutDate: str(raw.check_out_date) ?? "",
    rooms: num(raw.rooms) ?? 1,
    baseAmount: pricing.supplierAmount,
    currency,
    customerAmount: pricing.customerAmount,
    markupPercent: pricing.markupPercent,
  };
}

export function mapStayRate(
  room: Record<string, unknown>,
  rate: Record<string, unknown>,
  markupPercent: number,
): StayRateSummary | null {
  const rateId = str(rate.id);
  const supplier = pickSupplierAmount(rate);
  const currency = str(rate.total_currency) ?? str(rate.base_currency);
  if (!rateId || !supplier || !currency) return null;
  if (!rateSupportsBalance(rate.available_payment_methods)) return null;

  const pricing = applyStaysMarkup(supplier, markupPercent);
  const timeline = mapCancellationTimeline(rate.cancellation_timeline);
  const refundable = timeline.some((t) => Number.parseFloat(t.refundAmount) > 0);

  return {
    rateId,
    roomName: str(room.name) ?? "Room",
    rateName: str(rate.name) ?? "Rate",
    boardType: str(rate.board_type),
    description: str(rate.description),
    baseAmount: str(rate.base_amount) ?? pricing.supplierAmount,
    totalAmount: str(rate.total_amount) ?? pricing.supplierAmount,
    currency,
    customerAmount: pricing.customerAmount,
    markupPercent: pricing.markupPercent,
    paymentType: str(rate.payment_type),
    refundable,
    cancellationTimeline: timeline,
    expiresAt: str(rate.expires_at),
  };
}

export function mapStayQuote(
  raw: Record<string, unknown>,
  markupPercent: number,
  context?: { accommodationName?: string; searchResultId?: string },
): StayQuoteSummary | null {
  const quoteId = str(raw.id);
  const supplier = str(raw.total_amount) ?? str(raw.base_amount);
  const currency = str(raw.total_currency) ?? str(raw.base_currency);
  if (!quoteId || !supplier || !currency) return null;

  const pricing = applyStaysMarkup(supplier, markupPercent);
  const acc = raw.accommodation;
  let accommodationName = context?.accommodationName ?? "Hotel";
  let roomName: string | undefined;
  let rateName: string | undefined;
  let keyCollectionInstructions: string | undefined;
  let checkInAfterTime: string | undefined;
  let checkOutBeforeTime: string | undefined;

  if (acc && typeof acc === "object") {
    const a = acc as Record<string, unknown>;
    accommodationName = str(a.name) ?? accommodationName;
    const kc = a.key_collection;
    if (kc && typeof kc === "object") {
      keyCollectionInstructions = str((kc as Record<string, unknown>).instructions);
    }
    const ci = a.check_in_information;
    if (ci && typeof ci === "object") {
      checkInAfterTime = str((ci as Record<string, unknown>).check_in_after_time);
      checkOutBeforeTime = str((ci as Record<string, unknown>).check_out_before_time);
    }
  }

  const rooms = raw.rooms;
  if (Array.isArray(rooms) && rooms[0] && typeof rooms[0] === "object") {
    const room = rooms[0] as Record<string, unknown>;
    roomName = str(room.name);
    const rates = room.rates;
    if (Array.isArray(rates) && rates[0] && typeof rates[0] === "object") {
      const rate = rates[0] as Record<string, unknown>;
      rateName = str(rate.name);
    }
  }

  const rateId = str(raw.rate_id) ?? "";

  return {
    quoteId,
    rateId,
    searchResultId: context?.searchResultId,
    accommodationName,
    roomName,
    rateName,
    checkInDate: str(raw.check_in_date) ?? "",
    checkOutDate: str(raw.check_out_date) ?? "",
    baseAmount: str(raw.base_amount) ?? pricing.supplierAmount,
    totalAmount: str(raw.total_amount) ?? pricing.supplierAmount,
    currency,
    customerAmount: pricing.customerAmount,
    markupPercent: pricing.markupPercent,
    supplierAmount: pricing.supplierAmount,
    boardType: str(raw.board_type),
    cancellationTimeline: mapCancellationTimeline(raw.cancellation_timeline),
    keyCollectionInstructions,
    checkInAfterTime,
    checkOutBeforeTime,
    liveMode: raw.live_mode === true,
    expiresAt: str(raw.expires_at),
  };
}

export function extractStayRatesFromSearchResult(
  raw: Record<string, unknown>,
  markupPercent: number,
): StayRateSummary[] {
  const acc = raw.accommodation;
  if (!acc || typeof acc !== "object") return [];
  const rooms = (acc as Record<string, unknown>).rooms;
  if (!Array.isArray(rooms)) return [];

  const rates: StayRateSummary[] = [];
  for (const roomRaw of rooms) {
    if (!roomRaw || typeof roomRaw !== "object") continue;
    const room = roomRaw as Record<string, unknown>;
    const roomRates = room.rates;
    if (!Array.isArray(roomRates)) continue;
    for (const rateRaw of roomRates) {
      if (!rateRaw || typeof rateRaw !== "object") continue;
      const mapped = mapStayRate(room, rateRaw as Record<string, unknown>, markupPercent);
      if (mapped) rates.push(mapped);
    }
  }
  rates.sort(
    (a, b) => Number.parseFloat(a.customerAmount) - Number.parseFloat(b.customerAmount),
  );
  return rates;
}
