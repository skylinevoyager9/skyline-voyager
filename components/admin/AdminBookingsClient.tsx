"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { StoredBooking } from "@/lib/bookings/types";
import { formatMoney } from "@/lib/flights/format";

type BookingsPayload = {
  ok: true;
  count: number;
  storage: string;
  bookings: StoredBooking[];
};

type StatusPayload = {
  ok: true;
  ownerKeyConfigured: boolean;
  authorized: boolean;
  ownerParamPresent: boolean;
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

export function AdminBookingsClient() {
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner")?.trim() ?? "";

  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [data, setData] = useState<BookingsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!owner) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const statusRes = await fetch(
          `/api/admin/owner-status?owner=${encodeURIComponent(owner)}`,
          { cache: "no-store" },
        );
        const statusJson = (await statusRes.json()) as StatusPayload & { error?: string };
        if (cancelled) return;
        if (!statusRes.ok || !statusJson.ok) {
          setError(statusJson.error ?? "Could not verify owner access.");
          setLoading(false);
          return;
        }
        setStatus(statusJson);

        if (!statusJson.authorized) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/api/admin/bookings?owner=${encodeURIComponent(owner)}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as BookingsPayload & { error?: string };
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Could not load bookings.");
          setLoading(false);
          return;
        }
        setData(json);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Network error loading bookings.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [owner]);

  if (!owner) {
    return (
      <>
        <h1 className="text-2xl font-bold text-stone-900">Owner bookings</h1>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          This page is private. Open it with your owner key (same as flight pricing admin):
        </p>
        <p className="mt-4 rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm text-stone-800">
          /admin/bookings?owner=<span className="text-amber-800">YOUR_OWNER_PRICING_KEY</span>
        </p>
        <p className="mt-4 text-sm text-stone-600">
          Set <code className="rounded bg-stone-100 px-1">OWNER_PRICING_KEY</code> in Vercel
          Production, redeploy, then reload with the key in the URL.
        </p>
      </>
    );
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Loading bookings…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        {error}
      </div>
    );
  }

  if (status && !status.authorized) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Owner bookings</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Access denied — owner key did not match.</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Server has key configured:{" "}
              <strong>{status.ownerKeyConfigured ? "yes" : "no"}</strong>
            </li>
            <li>
              If &quot;no&quot;, add <code>OWNER_PRICING_KEY</code> in Vercel Production and{" "}
              <strong>redeploy</strong>.
            </li>
            <li>
              If &quot;yes&quot;, copy the key again from Vercel → Edit variable → paste into the
              URL after <code>?owner=</code>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
          <p className="mt-1 text-sm text-stone-600">
            {data.count} recent record{data.count === 1 ? "" : "s"} ·{" "}
            {data.storage === "upstash" ? "Upstash Redis" : "Local file"}
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

      {data.bookings.length === 0 ? (
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
              {data.bookings.map((b) => (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
