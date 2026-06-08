import type { Metadata } from "next";
import Link from "next/link";
import { listRecentBookings } from "@/lib/bookings/store";
import type { StoredBooking } from "@/lib/bookings/types";
import { isOwnerAccessKeyValid } from "@/lib/admin/owner-access";
import { getBookingOwnerNotificationEmail } from "@/lib/email/owner-notification";
import { formatMoney } from "@/lib/flights/format";
import { isRedisKvConfigured } from "@/lib/storage/redis-kv";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bookings (owner)",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ owner?: string }>;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function lookupHref(booking: StoredBooking): string {
  const base = booking.product === "stay" ? "/stays/lookup" : "/flights/lookup";
  const params = new URLSearchParams({
    ref: booking.bookingReference || booking.orderId,
    email: booking.passengerEmail,
  });
  return `${base}?${params.toString()}`;
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const { owner } = await searchParams;
  const authorized = isOwnerAccessKeyValid(owner);

  if (!authorized) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-bold text-stone-900">Owner bookings</h1>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          This page is private. Open it with your owner key (same as flight pricing admin):
        </p>
        <p className="mt-4 rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm text-stone-800">
          /admin/bookings?owner=<span className="text-amber-800">YOUR_OWNER_PRICING_KEY</span>
        </p>
        <p className="mt-4 text-sm text-stone-600">
          Set <code className="rounded bg-stone-100 px-1">OWNER_PRICING_KEY</code> in Vercel
          Production. Do not share this URL.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-stone-600 hover:underline">
          ← Home
        </Link>
      </main>
    );
  }

  const bookings = await listRecentBookings(100);
  const storage = isRedisKvConfigured() ? "Upstash Redis" : "Local data/bookings.jsonl";
  const ownerInbox = getBookingOwnerNotificationEmail() ?? site.email;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
          <p className="mt-1 text-sm text-stone-600">
            {bookings.length} recent record{bookings.length === 1 ? "" : "s"} · {storage}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="https://app.duffel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-4 py-2 font-medium text-stone-800 hover:bg-stone-50"
          >
            Duffel orders →
          </a>
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-4 py-2 font-medium text-stone-800 hover:bg-stone-50"
          >
            Stripe payments →
          </a>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        New confirmations are also BCC’d to <strong>{ownerInbox}</strong> (override with{" "}
        <code className="rounded bg-white/70 px-1">BOOKING_OWNER_EMAIL</code>).
      </p>

      {bookings.length === 0 ? (
        <p className="mt-10 text-sm text-stone-600">No bookings stored yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Trip</th>
                <th className="px-4 py-3 font-semibold">IDs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.map((b) => (
                <tr key={b.id} className="align-top hover:bg-stone-50/80">
                  <td className="px-4 py-3 whitespace-nowrap text-stone-700">
                    {formatWhen(b.createdAt)}
                    {!b.liveMode ? (
                      <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-600">
                        test
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-800">{b.product}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">{b.passengerName}</div>
                    <a
                      href={`mailto:${b.passengerEmail}`}
                      className="text-xs text-stone-500 hover:underline"
                    >
                      {b.passengerEmail}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-stone-800">
                      {b.bookingReference || "—"}
                    </div>
                    <Link href={lookupHref(b)} className="text-xs text-emerald-700 hover:underline">
                      Customer view
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-stone-900">
                    {formatMoney(b.customerAmount, b.currency)}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-stone-600">{b.itinerarySummary}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                    <div>{b.orderId}</div>
                    {b.paymentIntentId ? <div className="mt-1">{b.paymentIntentId}</div> : null}
                    {b.cancelledAt ? (
                      <div className="mt-1 text-red-600">Cancelled {formatWhen(b.cancelledAt)}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-xs text-stone-500">
        Full ticket details and passengers: Duffel dashboard. Payments: Stripe. API:{" "}
        <code className="rounded bg-stone-100 px-1">GET /api/admin/bookings?owner=…</code>
      </p>
    </main>
  );
}
