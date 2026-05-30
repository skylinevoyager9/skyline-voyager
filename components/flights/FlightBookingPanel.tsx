"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FareRulesNotice } from "@/components/flights/FareRulesNotice";
import {
  FlightExtraBagsSection,
  getSelectedServicesFromRecord,
} from "@/components/flights/FlightExtraBagsSection";
import { FlightCustomerPricingNote } from "@/components/flights/FlightCustomerPricingNote";
import { FlightPriceDisclosure } from "@/components/flights/FlightPriceDisclosure";
import { FlightStripeCheckout } from "@/components/flights/FlightStripeCheckout";
import { OfferExpiryCountdown } from "@/components/flights/OfferExpiryCountdown";
import { computeFlightCheckoutTotals } from "@/lib/flights/ancillaries";
import type { FlightRuntimeLabels } from "@/lib/flights/runtime-labels";
import type {
  BookPassengerInput,
  FlightOfferSummary,
} from "@/lib/duffel/types";
import { formatDateTime, formatDuration, formatMoney } from "@/lib/flights/format";
import { CUSTOMER_TOTAL_LABEL, PRICE_UPDATED_MESSAGE } from "@/lib/flights/pricing-policy";
import type { FlightPaymentMode } from "@/lib/flights/payment-mode";

type Status = {
  configured: boolean;
  mode: string;
  markupPercent: number;
  stripeConfigured: boolean;
  paymentMode: FlightPaymentMode;
  runtime?: FlightRuntimeLabels;
};

function defaultBornOn(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 30);
  return d.toISOString().slice(0, 10);
}

function emptyPassenger(passengerId: string): BookPassengerInput {
  return {
    passengerId,
    givenName: "",
    familyName: "",
    bornOn: defaultBornOn(),
    gender: "m",
    title: "mr",
    email: "",
    phoneNumber: "+12025550100",
  };
}

type Props = {
  offer: FlightOfferSummary;
  priceChanged?: boolean;
  previousQuotedAmount?: string;
};

export function FlightBookingPanel({
  offer,
  priceChanged = false,
  previousQuotedAmount,
}: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [passengers, setPassengers] = useState<BookPassengerInput[]>(() =>
    offer.passengerIds.map((id) => emptyPassenger(id)),
  );
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState<{
    orderId: string;
    bookingReference?: string;
    customerAmount: string;
    currency: string;
    emailSent?: boolean;
  } | null>(null);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [bagSelections, setBagSelections] = useState<Record<string, number>>({});

  const selectedServices = useMemo(
    () => getSelectedServicesFromRecord(bagSelections),
    [bagSelections],
  );
  const checkoutTotals = useMemo(
    () => computeFlightCheckoutTotals(offer, selectedServices, offer.markupPercent),
    [offer, selectedServices],
  );

  useEffect(() => {
    fetch("/api/flights/status")
      .then((r) => r.json())
      .then((j: Status) => setStatus(j))
      .catch(() => null);
  }, []);

  useEffect(() => {
    setPassengers(offer.passengerIds.map((id) => emptyPassenger(id)));
    setCheckoutSecret(null);
    setPaymentIntentId(null);
    setBookSuccess(null);
    setError(null);
    setBagSelections({});
  }, [offer.id, offer.passengerIds]);

  useEffect(() => {
    setCheckoutSecret(null);
    setPaymentIntentId(null);
  }, [bagSelections]);

  const stripePublishableKey =
    typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === "string"
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim()
      : "";
  const publishableKeyReady =
    stripePublishableKey.startsWith("pk_") && stripePublishableKey.length >= 24;
  const useStripeCheckout =
    status?.paymentMode === "stripe" && publishableKeyReady;

  async function completeBooking(intentId?: string) {
    setBooking(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          passengers,
          paymentIntentId: intentId ?? paymentIntentId ?? undefined,
          markupPercent: offer.markupPercent,
          selectedServices,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: {
          orderId: string;
          bookingReference?: string;
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
      setBookSuccess(json.data);
    } catch {
      setError("Booking request failed.");
    } finally {
      setBooking(false);
    }
  }

  async function onBook(e: React.FormEvent) {
    e.preventDefault();

    if (offer.passengerIds.length === 0) {
      setError("This offer has no passenger slots. Search again and pick another fare.");
      return;
    }

    if (useStripeCheckout && !paymentIntentId) {
      setError(null);
      setBooking(true);
      try {
        const res = await fetch("/api/flights/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: offer.id,
            markupPercent: offer.markupPercent,
            selectedServices,
          }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { clientSecret: string; paymentIntentId: string };
          error?: string;
        };
        if (!res.ok || !json.ok || !json.data?.clientSecret) {
          setError(json.error ?? "Could not start card checkout.");
          return;
        }
        setCheckoutSecret(json.data.clientSecret);
        setPaymentIntentId(json.data.paymentIntentId);
      } catch {
        setError("Could not reach payment service.");
      } finally {
        setBooking(false);
      }
      return;
    }

    await completeBooking();
  }

  async function onStripePaid(intentId: string) {
    setPaymentIntentId(intentId);
    await completeBooking(intentId);
  }

  if (bookSuccess) {
    const confirmedTitle =
      status?.runtime?.bookingConfirmedTitle ?? "Booking confirmed";
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
        <p className="font-semibold">{confirmedTitle}</p>
        <p className="mt-2">
          Order <code className="rounded bg-white/70 px-1">{bookSuccess.orderId}</code>
          {bookSuccess.bookingReference ? (
            <>
              {" "}
              · Reference <strong>{bookSuccess.bookingReference}</strong>
            </>
          ) : null}
        </p>
        <p className="mt-1">
          Total paid:{" "}
          <strong>{formatMoney(bookSuccess.customerAmount, bookSuccess.currency)}</strong>
        </p>
        {bookSuccess.emailSent ? (
          <p className="mt-2 text-emerald-900/90">
            A confirmation email was sent to the lead passenger.
          </p>
        ) : (
          <p className="mt-2 text-emerald-900/90">
            Save your reference — email could not be sent (check RESEND_API_KEY).
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/flights/lookup?ref=${encodeURIComponent(bookSuccess.bookingReference ?? "")}&email=${encodeURIComponent(passengers[0]?.email ?? "")}`}
            className="text-sm font-semibold text-emerald-900 underline"
          >
            Look up this booking
          </Link>
          <Link
            href="/flights/search"
            className="text-sm font-semibold text-emerald-900 underline"
          >
            Search another flight
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {priceChanged ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
        >
          <p className="font-semibold">{PRICE_UPDATED_MESSAGE}</p>
          {previousQuotedAmount ? (
            <p className="mt-1 text-amber-900/90">
              Was {formatMoney(previousQuotedAmount, offer.currency)} · now{" "}
              <strong>{formatMoney(offer.customerAmount, offer.currency)}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {offer.ownerName ?? "Airline"}
        </p>
        <p className="text-xs font-medium text-stone-500">{CUSTOMER_TOTAL_LABEL}</p>
        <p className="font-display mt-1 text-2xl font-bold text-stone-900">
          {formatMoney(checkoutTotals.customerAmount, offer.currency)}
        </p>
        {selectedServices.length > 0 ? (
          <p className="mt-1 text-sm text-stone-600">
            Fare {formatMoney(offer.customerAmount, offer.currency)} + extra bags{" "}
            {formatMoney(checkoutTotals.servicesSupplierAmount, offer.currency)}
          </p>
        ) : null}
        <FlightPriceDisclosure offer={offer} />
        {offer.expiresAt ? (
          <OfferExpiryCountdown expiresAt={offer.expiresAt} className="mt-2 text-xs text-amber-800" />
        ) : null}
        <div className="mt-3">
          <FlightCustomerPricingNote variant="checkout" />
        </div>
        <FareRulesNotice rules={offer.fareRules} />
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {offer.slices.map((slice, i) => (
            <li key={`${offer.id}-slice-${i}`}>
              <p className="font-semibold text-stone-900">
                {slice.origin} → {slice.destination} ({slice.departureDate})
              </p>
              {slice.segments.map((seg, j) => (
                <p key={`${offer.id}-seg-${j}`} className="text-stone-600">
                  {seg.marketingCarrier} · {formatDateTime(seg.departingAt)} →{" "}
                  {formatDateTime(seg.arrivingAt)}
                  {seg.duration ? ` · ${formatDuration(seg.duration)}` : ""}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900"
        >
          {error}
        </div>
      ) : null}

      {offer.passengerIds.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Cannot book this fare</p>
          <p className="mt-2">
            Passenger information is missing from this offer. Go back and choose another
            result, or search again.
          </p>
          <Link
            href="/flights/search"
            className="mt-3 inline-flex font-semibold text-amber-900 underline"
          >
            ← Back to search
          </Link>
        </div>
      ) : (
        <>
          <FlightExtraBagsSection
            offer={offer}
            selections={bagSelections}
            onChange={setBagSelections}
          />
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-stone-900">Passenger details</h2>
          <p className="mt-2 text-sm text-stone-600">
            Booking{" "}
            <strong>{formatMoney(checkoutTotals.customerAmount, offer.currency)}</strong>
            {useStripeCheckout
              ? " — pay by card, then we place the order with the airline via Duffel."
              : " — test mode uses your Duffel account balance (no card)."}
          </p>

          <form
            id="flight-passenger-form"
            onSubmit={onBook}
            className="mt-6 space-y-6"
          >
            {passengers.map((p, index) => (
              <fieldset
                key={p.passengerId}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <legend className="px-1 text-sm font-semibold text-stone-800">
                  Passenger {index + 1}
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Given name
                    <input
                      required
                      value={p.givenName}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = { ...p, givenName: e.target.value };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Family name
                    <input
                      required
                      value={p.familyName}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = { ...p, familyName: e.target.value };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Date of birth
                    <input
                      required
                      type="date"
                      value={p.bornOn}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = { ...p, bornOn: e.target.value };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Title
                    <select
                      value={p.title}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = {
                          ...p,
                          title: e.target.value as BookPassengerInput["title"],
                        };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    >
                      <option value="mr">Mr</option>
                      <option value="mrs">Mrs</option>
                      <option value="ms">Ms</option>
                      <option value="miss">Miss</option>
                      <option value="dr">Dr</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    Gender
                    <select
                      value={p.gender}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = {
                          ...p,
                          gender: e.target.value as BookPassengerInput["gender"],
                        };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    >
                      <option value="m">Male</option>
                      <option value="f">Female</option>
                    </select>
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Email
                    <input
                      required
                      type="email"
                      value={p.email}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = { ...p, email: e.target.value };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Phone (E.164, e.g. +12025550100)
                    <input
                      required
                      value={p.phoneNumber}
                      onChange={(e) => {
                        const next = [...passengers];
                        next[index] = { ...p, phoneNumber: e.target.value };
                        setPassengers(next);
                      }}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
                    />
                  </label>
                </div>
              </fieldset>
            ))}
          </form>

          {useStripeCheckout && checkoutSecret ? (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">Card payment</p>
              <p className="mt-1 text-xs text-stone-500">
                Complete payment below. We will book your flight automatically after it
                succeeds.
              </p>
              <div className="mt-4">
                <FlightStripeCheckout
                  clientSecret={checkoutSecret}
                  publishableKey={stripePublishableKey}
                  offerId={offer.id}
                  onPaid={onStripePaid}
                  onError={(message) => setError(message)}
                  disabled={booking}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                form="flight-passenger-form"
                disabled={booking}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {booking
                  ? "Working…"
                  : useStripeCheckout
                    ? "Continue to payment"
                    : "Confirm booking"}
              </button>
              <Link
                href="/flights/search"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700"
              >
                Cancel
              </Link>
            </div>
          )}

          {useStripeCheckout && checkoutSecret ? (
            <div className="mt-4">
              <Link
                href="/flights/search"
                className="inline-flex text-sm font-semibold text-stone-600 underline hover:text-stone-900"
              >
                Cancel booking
              </Link>
            </div>
          ) : null}
        </div>
        </>
      )}
    </div>
  );
}
