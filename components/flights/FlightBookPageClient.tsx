"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FlightBookingPanel } from "@/components/flights/FlightBookingPanel";
import type { FlightOfferSummary } from "@/lib/duffel/types";
import { readStoredOwnerPricingKey } from "@/lib/flights/owner-pricing";
export function FlightBookPageClient({ configured }: { configured: boolean }) {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() ?? "";
  const markupPercent = searchParams.get("mp")?.trim() ?? "";
  const quoted = searchParams.get("quoted")?.trim() ?? "";
  const ownerFromUrl = searchParams.get("owner")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<FlightOfferSummary | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [previousQuotedAmount, setPreviousQuotedAmount] = useState<string | undefined>();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    if (!offerId.startsWith("off_")) {
      setError("Missing or invalid offer. Choose a fare from search results.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ offerId });
    if (markupPercent) params.set("mp", markupPercent);
    if (quoted) params.set("quoted", quoted);
    const owner = ownerFromUrl || readStoredOwnerPricingKey();
    if (owner) params.set("owner", owner);

    fetch(`/api/flights/offer?${params.toString()}`)
      .then(async (res) => {
        const json = (await res.json()) as {
          ok: boolean;
          data?: FlightOfferSummary;
          error?: string;
          priceChanged?: boolean;
          previousQuotedAmount?: string;
        };
        if (cancelled) return;
        if (!res.ok || !json.ok || !json.data) {
          setOffer(null);
          setError(json.error ?? "Could not load this offer. It may have expired.");
          return;
        }
        setOffer(json.data);
        setPriceChanged(Boolean(json.priceChanged));
        setPreviousQuotedAmount(json.previousQuotedAmount);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error loading offer.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, offerId, markupPercent, quoted, ownerFromUrl]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">Duffel is not configured on this server.</p>
        <p className="mt-2">Add your test token to `.env.local` and restart the dev server.</p>
      </div>
    );
  }

  if (!offerId.startsWith("off_")) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">No fare selected</p>
        <p className="mt-2">Search for flights and click &quot;Book this fare&quot; on a result.</p>
        <Link
          href="/flights/search"
          className="mt-3 inline-flex font-semibold text-amber-900 underline"
        >
          Go to flight search →
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Loading your selected fare…</p>;
  }

  if (error || !offer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
        <p className="font-semibold">{error ?? "Offer unavailable"}</p>
        <Link
          href="/flights/search"
          className="mt-3 inline-flex font-semibold text-red-950 underline"
        >
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <FlightBookingPanel
      offer={offer}
      priceChanged={priceChanged}
      previousQuotedAmount={previousQuotedAmount}
    />
  );
}
