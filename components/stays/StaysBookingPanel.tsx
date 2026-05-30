"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlightCustomerPricingNote } from "@/components/flights/FlightCustomerPricingNote";
import { StaysCancellationNotice } from "@/components/stays/StaysCancellationNotice";
import { StaysStripeCheckout } from "@/components/stays/StaysStripeCheckout";
import type { StayQuoteSummary, StayRateSummary } from "@/lib/duffel/stays-types";
import type { StayRuntimeLabels } from "@/lib/stays/runtime-labels";
import { formatMoney } from "@/lib/flights/format";
import type { FlightPaymentMode } from "@/lib/flights/payment-mode";

type Status = {
  configured: boolean;
  mode: string;
  paymentMode: FlightPaymentMode;
  runtime?: StayRuntimeLabels;
};

type Props = {
  searchResultId: string;
  accommodationName?: string;
};

export function StaysBookingPanel({ searchResultId, accommodationName }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [rates, setRates] = useState<StayRateSummary[]>([]);
  const [propertyName, setPropertyName] = useState(accommodationName ?? "Hotel");
  const [quote, setQuote] = useState<StayQuoteSummary | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+12025550100");
  const [specialRequests, setSpecialRequests] = useState("");
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    bookingId: string;
    bookingReference: string;
    customerAmount: string;
    currency: string;
    emailSent?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stays/status")
      .then((r) => r.json())
      .then((j: Status) => setStatus(j))
      .catch(() => null);
  }, []);

  useEffect(() => {
    setRatesLoading(true);
    setRatesError(null);
    fetch("/api/stays/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchResultId }),
    })
      .then((r) => r.json())
      .then(
        (j: {
          ok: boolean;
          data?: { rates: StayRateSummary[]; accommodationName: string };
          error?: string;
        }) => {
          if (!j.ok || !j.data) {
            setRatesError(j.error ?? "Could not load room rates.");
            return;
          }
          setRates(j.data.rates);
          setPropertyName(j.data.accommodationName || propertyName);
        },
      )
      .catch(() => setRatesError("Could not load room rates."))
      .finally(() => setRatesLoading(false));
  }, [searchResultId, propertyName]);

  const stripePublishableKey =
    typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === "string"
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim()
      : "";
  const publishableKeyReady =
    stripePublishableKey.startsWith("pk_") && stripePublishableKey.length >= 24;
  const useStripeCheckout =
    status?.paymentMode === "stripe" && publishableKeyReady;

  async function selectRate(rateId: string) {
    setQuoteLoading(true);
    setError(null);
    setQuote(null);
    setCheckoutSecret(null);
    setPaymentIntentId(null);
    try {
      const res = await fetch("/api/stays/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId,
          accommodationName: propertyName,
          searchResultId,
        }),
      });
      const json = (await res.json()) as { ok: boolean; data?: StayQuoteSummary; error?: string };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not confirm this rate.");
        return;
      }
      setQuote(json.data);
    } catch {
      setError("Quote request failed.");
    } finally {
      setQuoteLoading(false);
    }
  }

  async function completeBooking(intentId?: string) {
    if (!quote) return;
    setBooking(true);
    setError(null);
    try {
      const res = await fetch("/api/stays/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.quoteId,
          email,
          phoneNumber,
          guests: [{ givenName, familyName }],
          accommodationSpecialRequests: specialRequests || undefined,
          paymentIntentId: intentId ?? paymentIntentId ?? undefined,
          markupPercent: quote.markupPercent,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: {
          bookingId: string;
          bookingReference: string;
          customerAmount: string;
          currency: string;
          emailSent?: boolean;
        };
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Booking failed.");
        return;
      }
      setSuccess(json.data);
    } catch {
      setError("Booking request failed.");
    } finally {
      setBooking(false);
    }
  }

  async function onBook(e: React.FormEvent) {
    e.preventDefault();
    if (!quote) return;

    if (useStripeCheckout && !paymentIntentId) {
      setError(null);
      setBooking(true);
      try {
        const res = await fetch("/api/stays/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId: quote.quoteId }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { clientSecret: string; paymentIntentId: string };
          error?: string;
        };
        if (!res.ok || !json.ok || !json.data) {
          setError(json.error ?? "Could not start checkout.");
          return;
        }
        setCheckoutSecret(json.data.clientSecret);
        setPaymentIntentId(json.data.paymentIntentId);
      } catch {
        setError("Checkout failed.");
      } finally {
        setBooking(false);
      }
      return;
    }

    await completeBooking();
  }

  if (success) {
    const title = status?.runtime?.bookingConfirmedTitle ?? "Stay confirmed";
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-stone-900">{title}</h2>
        <p className="mt-3 text-stone-700">
          Reference: <strong>{success.bookingReference || success.bookingId}</strong>
        </p>
        <p className="mt-1 text-stone-700">
          Total: {formatMoney(success.customerAmount, success.currency)}
        </p>
        {success.emailSent ? (
          <p className="mt-3 text-sm text-stone-600">Confirmation email sent.</p>
        ) : (
          <p className="mt-3 text-sm text-stone-600">
            Save your reference — email may not have been sent if Resend is not configured.
          </p>
        )}
        {quote?.keyCollectionInstructions ? (
          <p className="mt-4 rounded-xl bg-white/80 p-4 text-sm text-stone-700">
            <strong>Key collection:</strong> {quote.keyCollectionInstructions}
          </p>
        ) : null}
        <Link
          href={`/stays/lookup?ref=${encodeURIComponent(success.bookingReference)}&email=${encodeURIComponent(email)}`}
          className="mt-6 inline-flex font-semibold text-amber-900 hover:underline"
        >
          Look up this booking →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">{propertyName}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {useStripeCheckout
            ? "Pay by card, then we confirm your reservation with the property via Duffel."
            : "Test mode — booking uses your Duffel balance (no card)."}
        </p>
      </div>

      {ratesLoading ? (
        <p className="text-sm text-stone-600">Loading rooms and rates…</p>
      ) : ratesError ? (
        <p className="text-sm font-medium text-red-700">{ratesError}</p>
      ) : !quote ? (
        <section>
          <h3 className="font-semibold text-stone-900">Choose a room rate</h3>
          <ul className="mt-4 space-y-3">
            {rates.map((rate) => (
              <li
                key={rate.rateId}
                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{rate.roomName}</p>
                    <p className="text-sm text-stone-600">{rate.rateName}</p>
                    {rate.boardType ? (
                      <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                        {rate.boardType.replace(/_/g, " ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-stone-900">
                      {formatMoney(rate.customerAmount, rate.currency)}
                    </p>
                    <button
                      type="button"
                      disabled={quoteLoading}
                      onClick={() => void selectRate(rate.rateId)}
                      className="mt-2 inline-flex min-h-[36px] items-center rounded-full bg-amber-950 px-4 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60"
                    >
                      {quoteLoading ? "Confirming…" : "Select"}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <StaysCancellationNotice
                    timeline={rate.cancellationTimeline}
                    currency={rate.currency}
                  />
                </div>
              </li>
            ))}
          </ul>
          {rates.length === 0 ? (
            <p className="text-sm text-stone-600">No bookable rates for this property. Search again.</p>
          ) : null}
        </section>
      ) : (
        <form onSubmit={(e) => void onBook(e)} className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Selected rate</p>
            <p className="mt-2 font-display text-xl font-bold text-stone-900">
              {quote.roomName ?? "Room"} · {quote.rateName ?? "Rate"}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {quote.checkInDate} → {quote.checkOutDate}
            </p>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {formatMoney(quote.customerAmount, quote.currency)}
            </p>
            <StaysCancellationNotice
              timeline={quote.cancellationTimeline}
              currency={quote.currency}
            />
            {quote.checkInAfterTime ? (
              <p className="mt-3 text-sm text-stone-600">
                Check-in from {quote.checkInAfterTime}
                {quote.checkOutBeforeTime ? ` · Check-out by ${quote.checkOutBeforeTime}` : ""}
              </p>
            ) : null}
          </div>

          <FlightCustomerPricingNote />

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                First name
              </span>
              <input
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Last name
              </span>
              <input
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Email
              </span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Phone (E.164)
              </span>
              <input
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Special requests (optional)
              </span>
              <textarea
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </label>
          </div>

          {checkoutSecret && publishableKeyReady && quote ? (
            <StaysStripeCheckout
              clientSecret={checkoutSecret}
              quoteId={quote.quoteId}
              publishableKey={stripePublishableKey}
              onPaid={(id) => void completeBooking(id)}
              onError={(msg) => setError(msg)}
              disabled={booking}
            />
          ) : (
            <button
              type="submit"
              disabled={booking}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-amber-950 px-8 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60"
            >
              {booking
                ? "Working…"
                : useStripeCheckout
                  ? "Continue to payment"
                  : "Confirm booking (test balance)"}
            </button>
          )}

          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
