import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  kvGet,
  kvLpush,
  kvLrange,
  kvSet,
  isRedisKvConfigured,
} from "@/lib/storage/redis-kv";
import type { SaveBookingInput, StoredBooking } from "@/lib/bookings/types";

const BOOKINGS_FILE = path.join(process.cwd(), "data", "bookings.jsonl");
const REDIS_INDEX = "sv:bookings:index";
const REDIS_BOOKING_PREFIX = "sv:booking:";

function normalizeRef(ref: string): string {
  return ref.trim().toUpperCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildItinerarySummary(offer: SaveBookingInput["offer"]): string {
  return offer.slices
    .map((s) => `${s.origin}→${s.destination} (${s.departureDate})`)
    .join(" · ");
}

export function buildStoredBooking(input: SaveBookingInput): StoredBooking {
  const lead = input.passengers[0];
  return {
    id: randomUUID(),
    orderId: input.orderId,
    bookingReference: input.bookingReference?.trim() || "",
    passengerEmail: normalizeEmail(lead.email),
    passengerName: `${lead.givenName} ${lead.familyName}`.trim(),
    offerId: input.offer.id,
    customerAmount: input.customerAmount,
    currency: input.currency,
    liveMode: input.liveMode,
    createdAt: new Date().toISOString(),
    itinerarySummary: buildItinerarySummary(input.offer),
    paymentIntentId: input.paymentIntentId,
  };
}

export async function saveBooking(input: SaveBookingInput): Promise<StoredBooking> {
  const record = buildStoredBooking(input);

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
      .map((line) => JSON.parse(line) as StoredBooking);
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
        records.push(JSON.parse(raw) as StoredBooking);
      } catch {
        /* skip */
      }
    }
    return records;
  }
  return readFileBookings();
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
        const record = JSON.parse(raw) as StoredBooking;
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
