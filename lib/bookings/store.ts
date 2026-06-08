import { mkdir, readFile, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  kvGet,
  kvLpush,
  kvLrange,
  kvSet,
  isRedisKvConfigured,
} from "@/lib/storage/redis-kv";
import type {
  SaveFlightBookingInput,
  SaveStayBookingInput,
  StoredBooking,
} from "@/lib/bookings/types";

const BOOKINGS_FILE = path.join(process.cwd(), "data", "bookings.jsonl");
const REDIS_INDEX = "sv:bookings:index";
const REDIS_BOOKING_PREFIX = "sv:booking:";

function normalizeRef(ref: string): string {
  return ref.trim().toUpperCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildFlightItinerarySummary(offer: SaveFlightBookingInput["offer"]): string {
  return offer.slices
    .map((s) => `${s.origin}→${s.destination} (${s.departureDate})`)
    .join(" · ");
}

export function buildStoredFlightBooking(input: SaveFlightBookingInput): StoredBooking {
  const lead = input.passengers[0];
  return {
    id: randomUUID(),
    product: "flight",
    orderId: input.orderId,
    bookingReference: input.bookingReference?.trim() || "",
    passengerEmail: normalizeEmail(lead.email),
    passengerName: `${lead.givenName} ${lead.familyName}`.trim(),
    offerId: input.offer.id,
    customerAmount: input.customerAmount,
    currency: input.currency,
    liveMode: input.liveMode,
    createdAt: new Date().toISOString(),
    itinerarySummary: buildFlightItinerarySummary(input.offer),
    paymentIntentId: input.paymentIntentId,
  };
}

export function buildStoredStayBooking(input: SaveStayBookingInput): StoredBooking {
  const summary = `${input.quote.accommodationName} · ${input.quote.checkInDate} → ${input.quote.checkOutDate}`;
  return {
    id: randomUUID(),
    product: "stay",
    orderId: input.bookingId,
    bookingReference: input.bookingReference?.trim() || "",
    passengerEmail: normalizeEmail(input.email),
    passengerName: input.guestName.trim(),
    offerId: input.quote.quoteId,
    customerAmount: input.customerAmount,
    currency: input.currency,
    liveMode: input.liveMode,
    createdAt: new Date().toISOString(),
    itinerarySummary: summary,
    paymentIntentId: input.paymentIntentId,
  };
}

export async function saveFlightBooking(input: SaveFlightBookingInput): Promise<StoredBooking> {
  const record = buildStoredFlightBooking(input);
  return persistBooking(record);
}

export async function saveStayBooking(input: SaveStayBookingInput): Promise<StoredBooking> {
  const record = buildStoredStayBooking(input);
  return persistBooking(record);
}

/** @deprecated Use saveFlightBooking */
export async function saveBooking(input: SaveFlightBookingInput): Promise<StoredBooking> {
  return saveFlightBooking(input);
}

async function persistBooking(record: StoredBooking): Promise<StoredBooking> {
  if (isRedisKvConfigured()) {
    await kvLpush(REDIS_INDEX, record.id);
    await kvSet(`${REDIS_BOOKING_PREFIX}${record.id}`, JSON.stringify(record));
    if (record.bookingReference) {
      await kvSet(
        `sv:booking-ref:${normalizeRef(record.bookingReference)}`,
        record.id,
      );
    }
    await kvSet(`sv:booking-email:${record.passengerEmail}:${record.id}`, record.id);
    return record;
  }

  try {
    await mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
    await appendFile(BOOKINGS_FILE, `${JSON.stringify(record)}\n`, "utf8");
    return record;
  } catch (err) {
    console.error("Could not persist booking to file", err);
    return record;
  }
}

async function readFileBookings(): Promise<StoredBooking[]> {
  try {
    const raw = await readFile(BOOKINGS_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => normalizeStoredBooking(JSON.parse(line) as StoredBooking));
  } catch {
    return [];
  }
}

async function loadAllBookings(): Promise<StoredBooking[]> {
  if (isRedisKvConfigured()) {
    const ids = await kvLrange(REDIS_INDEX, 0, 199);
    const records: StoredBooking[] = [];
    for (const id of ids) {
      const raw = await kvGet(`${REDIS_BOOKING_PREFIX}${id}`);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as StoredBooking;
        records.push({
          ...parsed,
          product: parsed.product ?? "flight",
        });
      } catch {
        /* skip */
      }
    }
    return records;
  }
  return readFileBookings();
}

function normalizeStoredBooking(b: StoredBooking): StoredBooking {
  return { ...b, product: b.product ?? "flight" };
}

export async function listRecentBookings(limit = 100): Promise<StoredBooking[]> {
  const all = await loadAllBookings();
  return all
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, 200)));
}

export async function findBookingByOrderId(orderId: string): Promise<StoredBooking | null> {
  if (!orderId.startsWith("ord_")) return null;

  if (isRedisKvConfigured()) {
    const ids = await kvLrange(REDIS_INDEX, 0, 499);
    for (const id of ids) {
      const raw = await kvGet(`${REDIS_BOOKING_PREFIX}${id}`);
      if (!raw) continue;
      try {
        const record = normalizeStoredBooking(JSON.parse(raw) as StoredBooking);
        if (record.orderId === orderId) return record;
      } catch {
        /* skip */
      }
    }
  }

  const all = await loadAllBookings();
  return all.find((b) => b.orderId === orderId) ?? null;
}

export async function findBookingByEmailAndReference(
  email: string,
  bookingReference: string,
): Promise<StoredBooking | null> {
  const normEmail = normalizeEmail(email);
  const normRef = normalizeRef(bookingReference);

  if (isRedisKvConfigured()) {
    const id = await kvGet(`sv:booking-ref:${normRef}`);
    if (id) {
      const raw = await kvGet(`${REDIS_BOOKING_PREFIX}${id}`);
      if (raw) {
        const record = normalizeStoredBooking(JSON.parse(raw) as StoredBooking);
        if (record.passengerEmail === normEmail) return record;
      }
    }
  }

  const all = await loadAllBookings();
  return (
    all.find(
      (b) =>
        b.passengerEmail === normEmail &&
        normalizeRef(b.bookingReference) === normRef,
    ) ?? null
  );
}

export async function updateStoredBooking(
  orderId: string,
  patch: Partial<Pick<StoredBooking, "cancelledAt" | "duffelCancellationId" | "customerRefundedAmount" | "refundStatus" | "bookingReference">>,
): Promise<StoredBooking | null> {
  const existing = await findBookingByOrderId(orderId);
  if (!existing) return null;

  const updated: StoredBooking = { ...existing, ...patch };

  if (isRedisKvConfigured()) {
    await kvSet(`${REDIS_BOOKING_PREFIX}${existing.id}`, JSON.stringify(updated));
    if (updated.bookingReference) {
      await kvSet(
        `sv:booking-ref:${normalizeRef(updated.bookingReference)}`,
        existing.id,
      );
    }
    return updated;
  }

  try {
    const all = await readFileBookings();
    const next = all.map((b) => (b.id === existing.id ? updated : b));
    await mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
    await writeFile(
      BOOKINGS_FILE,
      next.map((line) => JSON.stringify(line)).join("\n") + (next.length ? "\n" : ""),
      "utf8",
    );
    return updated;
  } catch (err) {
    console.error("Could not update booking file", err);
    return updated;
  }
}

export async function findBookingByEmailAndReferenceAnyProduct(
  email: string,
  bookingReference: string,
  product?: StoredBooking["product"],
): Promise<StoredBooking | null> {
  const booking = await findBookingByEmailAndReference(email, bookingReference);
  if (!booking) return null;
  if (product && booking.product !== product) return null;
  return booking;
}
