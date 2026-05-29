"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/flights/format";

type LookupData = {
  bookingReference: string;
  orderId: string;
  passengerName: string;
  customerAmount: string;
  currency: string;
  itinerarySummary: string;
  createdAt: string;
  liveMode: boolean;
};

export function FlightLookupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LookupData | null>(null);

  useEffect(() => {
    const e = searchParams.get("email");
    const r = searchParams.get("ref");
    if (e) setEmail(e);
    if (r) setRef(r);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ email: email.trim(), ref: ref.trim() });
      const res = await fetch(`/api/flights/lookup?${params.toString()}`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: LookupData;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Booking not found.");
        return;
      }
      setData(json.data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-medium text-stone-700">
          Email used when booking
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-stone-700">
          Booking reference (airline PNR)
          <input
            required
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. ABC123"
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm uppercase"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-full bg-stone-900 py-3 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Find booking"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
          <p className="font-semibold">{data.passengerName}</p>
          <p className="mt-2">
            Reference <strong>{data.bookingReference}</strong> · Order{" "}
            <code className="rounded bg-white/70 px-1 text-xs">{data.orderId}</code>
          </p>
          <p className="mt-1">
            Total paid: <strong>{formatMoney(data.customerAmount, data.currency)}</strong>
          </p>
          <p className="mt-2 text-emerald-900/90">{data.itinerarySummary}</p>
          <p className="mt-2 text-xs text-emerald-800/80">
            Booked {new Date(data.createdAt).toLocaleString()}
            {data.liveMode ? "" : " (test booking)"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
