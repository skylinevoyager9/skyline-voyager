import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { findBookingByOrderId } from "@/lib/bookings/store";
import { sendResendEmail } from "@/lib/email/resend";
import { site } from "@/lib/site";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

const IDEMPOTENCY_PREFIX = "sv:duffel:wev:";
const LOG_FILE = path.join(process.cwd(), "data", "duffel-webhook-events.jsonl");

export type DuffelWebhookEvent = {
  id?: string;
  type?: string;
  idempotency_key?: string;
  live_mode?: boolean;
  data?: { object?: Record<string, unknown> };
};

async function isDuplicateEvent(key: string): Promise<boolean> {
  if (!isRedisKvConfigured()) return false;
  const existing = await kvGet(`${IDEMPOTENCY_PREFIX}${key}`);
  return Boolean(existing);
}

async function markEventProcessed(key: string): Promise<void> {
  if (!isRedisKvConfigured()) return;
  await kvSet(`${IDEMPOTENCY_PREFIX}${key}`, new Date().toISOString());
}

async function appendLog(entry: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    /* ignore */
  }
}

async function notifyScheduleChange(orderId: string, event: DuffelWebhookEvent): Promise<void> {
  const booking = await findBookingByOrderId(orderId);
  if (!booking) return;

  const subject = `${site.name} — flight schedule update (${booking.bookingReference || orderId})`;
  const text = `Hi ${booking.passengerName},

The airline reported a schedule change that may affect your booking.

Booking reference: ${booking.bookingReference || "—"}
Order ID: ${orderId}
Itinerary: ${booking.itinerarySummary}

Sign in to your booking to review options: ${site.url}/flights/lookup?email=${encodeURIComponent(booking.passengerEmail)}&ref=${encodeURIComponent(booking.bookingReference)}

If you need to change dates, use Manage booking after lookup (when the airline allows changes).

— ${site.name}`;

  await sendResendEmail({
    to: [booking.passengerEmail],
    subject,
    text,
    html: `<p>Hi ${booking.passengerName},</p><p>The airline reported a <strong>schedule change</strong> for your trip.</p><p><strong>Reference:</strong> ${booking.bookingReference || "—"}<br/><strong>Itinerary:</strong> ${booking.itinerarySummary}</p><p><a href="${site.url}/flights/lookup?email=${encodeURIComponent(booking.passengerEmail)}&ref=${encodeURIComponent(booking.bookingReference)}">Look up your booking</a></p>`,
    replyTo: site.email,
  });

  await appendLog({
    at: new Date().toISOString(),
    action: "schedule_change_email",
    orderId,
    eventType: event.type,
    email: booking.passengerEmail,
  });
}

function extractOrderId(obj: Record<string, unknown> | undefined): string | undefined {
  if (!obj) return undefined;
  if (typeof obj.id === "string" && obj.id.startsWith("ord_")) return obj.id;
  const nested = obj.object;
  if (nested && typeof nested === "object" && nested !== null) {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === "string" && id.startsWith("ord_")) return id;
  }
  return undefined;
}

export async function handleDuffelWebhookEvent(event: DuffelWebhookEvent): Promise<void> {
  const type = event.type ?? "unknown";
  const idempotencyKey =
    event.idempotency_key?.trim() || event.id?.trim() || `${type}:${JSON.stringify(event.data ?? {})}`;

  const dedupeKey = idempotencyKey.slice(0, 120);
  if (await isDuplicateEvent(dedupeKey)) return;

  await appendLog({
    at: new Date().toISOString(),
    type,
    idempotency_key: idempotencyKey,
    live_mode: event.live_mode,
  });

  const orderId = extractOrderId(event.data?.object);

  switch (type) {
    case "ping.triggered":
      return;
    case "order.airline_initiated_change_detected":
      if (orderId) await notifyScheduleChange(orderId, event);
      return;
    case "order.created":
    case "order.updated":
      return;
    default:
      break;
  }

  await markEventProcessed(dedupeKey);
}
