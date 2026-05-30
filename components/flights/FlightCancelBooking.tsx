"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CANCELLATION_POLICY_LINK,
  type CancellationRefundPlan,
} from "@/lib/flights/cancellation-policy";
import { formatMoney } from "@/lib/flights/format";

type QuoteResponse = {
  orderCancellationId: string;
  expiresAt: string | null;
  voidWindowEndsAt: string | null;
  plan: CancellationRefundPlan;
};

type Props = {
  email: string;
  orderId: string;
  customerAmount: string;
  currency: string;
  voidWindowEndsAt: string | null;
  onCancelled: () => void;
  onBack: () => void;
};

export function FlightCancelBooking({
  email,
  orderId,
  customerAmount,
  currency,
  voidWindowEndsAt,
  onCancelled,
  onBack,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [done, setDone] = useState<{
    plan: CancellationRefundPlan;
    stripeRefunded: boolean;
    stripeRefundError?: string;
  } | null>(null);

  async function loadQuote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderId, action: "quote" }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: QuoteResponse;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not get cancellation quote.");
        return;
      }
      setQuote(json.data);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    if (!quote) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orderId,
          action: "confirm",
          orderCancellationId: quote.orderCancellationId,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: {
          plan: CancellationRefundPlan;
          stripeRefunded: boolean;
          stripeRefundError?: string;
        };
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Cancellation failed.");
        return;
      }
      setDone(json.data);
      onCancelled();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
          <p className="font-semibold">Booking cancelled</p>
          <p className="mt-2">{done.plan.policySummary}</p>
          <p className="mt-2 text-emerald-900/90">{done.plan.policyDetail}</p>
          {done.stripeRefunded ? (
            <p className="mt-2 font-medium">
              Card refund initiated:{" "}
              {formatMoney(done.plan.customerRefundAmount, done.plan.customerRefundCurrency)}
            </p>
          ) : done.plan.stripeRefundEligible && done.stripeRefundError ? (
            <p className="mt-2 text-amber-900">
              Airline cancellation succeeded but card refund failed ({done.stripeRefundError}).
              Contact { "info@skylinevoyager.com" } with your reference.
            </p>
          ) : null}
        </div>
        <button type="button" onClick={onBack} className="text-sm text-stone-600 underline">
          Back to overview
        </button>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-6 text-sm text-stone-800">
        <h2 className="font-semibold text-red-950">Cancel booking</h2>
        <p className="mt-2">
          You paid <strong>{formatMoney(customerAmount, currency)}</strong>. Refunds follow{" "}
          <strong>airline fare rules</strong> — not guaranteed in full. Our{" "}
          <Link href={CANCELLATION_POLICY_LINK} className="font-semibold underline">
            cancellation policy
          </Link>{" "}
          applies.
        </p>
        {voidWindowEndsAt ? (
          <p className="mt-2 text-xs text-stone-600">
            Void window (often full refund) ends:{" "}
            {new Date(voidWindowEndsAt).toLocaleString()}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadQuote()}
            className="rounded-full bg-red-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60"
          >
            {busy ? "Getting quote…" : "Get cancellation quote"}
          </button>
          <button type="button" onClick={onBack} className="text-sm text-stone-600 underline">
            Keep booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 space-y-3">
      <h2 className="font-semibold">Confirm cancellation</h2>
      <p>
        Airline refund:{" "}
        <strong>
          {quote.plan.duffelRefundAmount != null
            ? formatMoney(quote.plan.duffelRefundAmount, quote.plan.duffelRefundCurrency)
            : "Unknown"}
        </strong>{" "}
        ({quote.plan.refundTo.replace(/_/g, " ")})
      </p>
      <p className="font-medium">{quote.plan.policySummary}</p>
      <p className="text-amber-900/90">{quote.plan.policyDetail}</p>
      {quote.plan.stripeRefundEligible ? (
        <p>
          Your card will be refunded:{" "}
          <strong>
            {formatMoney(quote.plan.customerRefundAmount, quote.plan.customerRefundCurrency)}
          </strong>
        </p>
      ) : (
        <p className="text-red-900">No card refund will be issued automatically.</p>
      )}
      {quote.expiresAt ? (
        <p className="text-xs">Quote expires {new Date(quote.expiresAt).toLocaleString()}</p>
      ) : null}
      {error ? <p className="text-red-800">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirmCancel()}
          className="rounded-full bg-red-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Cancelling…" : "Yes, cancel my booking"}
        </button>
        <button type="button" onClick={onBack} className="text-sm underline">
          Go back
        </button>
      </div>
    </div>
  );
}
