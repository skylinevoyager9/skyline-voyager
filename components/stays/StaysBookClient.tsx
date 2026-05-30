"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { StaysBookingPanel } from "@/components/stays/StaysBookingPanel";

function BookContent() {
  const searchParams = useSearchParams();
  const searchResultId = searchParams.get("searchResultId")?.trim() ?? "";
  const quoteId = searchParams.get("quoteId")?.trim() ?? "";
  const name = searchParams.get("name")?.trim();

  if (quoteId.startsWith("quo_")) {
    return (
      <p className="text-sm text-stone-600">
        Open this page from search results to pick a room rate.{" "}
        <Link href="/stays/search" className="font-semibold text-amber-900 hover:underline">
          Back to search
        </Link>
      </p>
    );
  }

  if (!searchResultId.startsWith("srr_")) {
    return (
      <p className="text-sm text-stone-600">
        Missing property selection.{" "}
        <Link href="/stays/search" className="font-semibold text-amber-900 hover:underline">
          Search stays
        </Link>
      </p>
    );
  }

  return (
    <StaysBookingPanel searchResultId={searchResultId} accommodationName={name ?? undefined} />
  );
}

export function StaysBookClient() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-600">Loading booking…</p>}>
      <BookContent />
    </Suspense>
  );
}

export function StaysLookupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    bookingReference: string;
    bookingId: string;
    guestName: string;
    customerAmount: string;
    currency: string;
    itinerarySummary: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    const e = searchParams.get("email");
    const r = searchParams.get("ref");
    if (e) setEmail(e);
    if (r) setRef(r);
  }, [searchParams]);

  useEffect(() => {
    const e = searchParams.get("email")?.trim();
    const r = searchParams.get("ref")?.trim();
    if (e && r && !result && !loading) {
      void lookup(e, r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when URL params first present
  }, [searchParams]);

  async function lookup(lookupEmail: string, lookupRef: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const q = new URLSearchParams({ email: lookupEmail, ref: lookupRef });
      const res = await fetch(`/api/stays/lookup?${q.toString()}`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: typeof result;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Not found.");
        return;
      }
      setResult(json.data);
    } catch {
      setError("Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void lookup(email, ref);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Booking reference
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-amber-950 px-6 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Find booking"}
        </button>
      </form>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {result ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-semibold text-stone-900">{result.guestName}</p>
          <p className="mt-2 text-sm text-stone-700">
            Reference: <strong>{result.bookingReference || result.bookingId}</strong>
          </p>
          <p className="mt-1 text-sm text-stone-700">{result.itinerarySummary}</p>
          <p className="mt-2 text-sm text-stone-700">
            Total: {result.customerAmount} {result.currency}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function StaysLookupClient() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-600">Loading…</p>}>
      <StaysLookupForm />
    </Suspense>
  );
}
