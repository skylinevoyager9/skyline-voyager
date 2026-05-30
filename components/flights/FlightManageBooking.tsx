"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FlightCancelBooking } from "@/components/flights/FlightCancelBooking";
import { formatMoney } from "@/lib/flights/format";

type ManageOrder = {
  orderId: string;
  bookingReference: string;
  canChange: boolean;
  canCancel: boolean;
  voidWindowEndsAt: string | null;
  cancelledAt: string | null;
  customerAmount?: string;
  customerCurrency?: string;
  storedCancellation?: {
    cancelledAt: string;
    customerRefundedAmount?: string;
    refundStatus?: string;
  } | null;
  slices: {
    id: string;
    label: string;
    cabinClass: string;
    origin: string;
    destination: string;
  }[];
};

type ChangeOffer = {
  id: string;
  changeTotalAmount: string;
  changeTotalCurrency: string;
  penaltyTotalAmount: string;
  summary: string;
  expiresAt: string;
};

type Step = "overview" | "request" | "offers" | "confirm" | "done" | "cancel";

export function FlightManageBooking() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const orderId = searchParams.get("orderId")?.trim() ?? "";

  const [order, setOrder] = useState<ManageOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("overview");
  const [sliceId, setSliceId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [cabinClass, setCabinClass] = useState("economy");
  const [requestId, setRequestId] = useState("");
  const [offers, setOffers] = useState<ChangeOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [orderChangeId, setOrderChangeId] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [pendingCurrency, setPendingCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!email || !orderId) {
      setError("Email and order ID are required. Look up your booking first.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ email, orderId });
      const res = await fetch(`/api/flights/manage?${params}`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: ManageOrder;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not load order.");
        setOrder(null);
        return;
      }
      setOrder(json.data);
      if (json.data.slices[0]) {
        setSliceId(json.data.slices[0].id);
        setCabinClass(json.data.slices[0].cabinClass);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [email, orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function startChangeRequest() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/change/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orderId,
          sliceIdToRemove: sliceId,
          departureDate,
          cabinClass,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { requestId: string };
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data?.requestId) {
        setError(json.error ?? "Change request failed.");
        return;
      }
      setRequestId(json.data.requestId);
      await loadOffers(json.data.requestId);
      setStep("offers");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function loadOffers(reqId: string) {
    const params = new URLSearchParams({ email, orderId, requestId: reqId });
    const res = await fetch(`/api/flights/change/request?${params}`);
    const json = (await res.json()) as {
      ok: boolean;
      data?: { offers: ChangeOffer[] };
      error?: string;
    };
    if (!res.ok || !json.ok || !json.data) {
      setError(json.error ?? "Could not load change offers.");
      return;
    }
    setOffers(json.data.offers);
  }

  async function selectOffer(offerId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orderId,
          offerId,
          action: "create",
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: {
          orderChangeId: string;
          changeTotalAmount: string;
          changeTotalCurrency: string;
        };
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not create pending change.");
        return;
      }
      setOrderChangeId(json.data.orderChangeId);
      setPendingAmount(json.data.changeTotalAmount);
      setPendingCurrency(json.data.changeTotalCurrency);
      setSelectedOfferId(offerId);
      setStep("confirm");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orderId,
          orderChangeId,
          action: "confirm",
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { confirmedAt: string | null };
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Confirmation failed.");
        return;
      }
      setStep("done");
      await loadOrder();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!email || !orderId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Open this page from{" "}
        <Link href="/flights/lookup" className="font-semibold underline">
          booking lookup
        </Link>{" "}
        after you find your trip.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Loading order…</p>;
  }

  if (!order) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        {error ?? "Order unavailable."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">
          Reference <strong>{order.bookingReference}</strong>
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {order.slices.map((s) => (
            <li key={s.id} className="rounded-lg bg-stone-50 px-3 py-2">
              {s.label}
              <span className="ml-2 text-xs text-stone-500">({s.cabinClass})</span>
            </li>
          ))}
        </ul>
        {order.cancelledAt || order.storedCancellation ? (
          <div className="mt-4 text-sm text-red-800 space-y-1">
            <p>This order was cancelled.</p>
            {order.storedCancellation?.customerRefundedAmount &&
            Number.parseFloat(order.storedCancellation.customerRefundedAmount) > 0 ? (
              <p>
                Card refund recorded:{" "}
                {formatMoney(
                  order.storedCancellation.customerRefundedAmount,
                  order.customerCurrency ?? "USD",
                )}
              </p>
            ) : order.storedCancellation?.refundStatus === "none" ? (
              <p>No card refund per airline fare rules.</p>
            ) : null}
          </div>
        ) : order.canChange ? (
          <p className="mt-4 text-sm text-stone-700">
            Voluntary changes are available for this booking. Airline change fees are charged to your
            Duffel balance when you confirm.
          </p>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            Voluntary changes are not available for this order. If the airline changes your schedule,
            we will email you when we receive a webhook notification.
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {step === "overview" && !order.cancelledAt && !order.storedCancellation ? (
        <div className="flex flex-col gap-3">
          {order.canChange ? (
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full rounded-full bg-stone-900 py-3 text-sm font-bold text-white hover:bg-stone-800"
            >
              Change a flight
            </button>
          ) : null}
          {order.canCancel ? (
            <button
              type="button"
              onClick={() => setStep("cancel")}
              className="w-full rounded-full border border-red-300 bg-white py-3 text-sm font-bold text-red-900 hover:bg-red-50"
            >
              Cancel booking
            </button>
          ) : (
            <p className="text-xs text-stone-500">
              Online cancellation is not available for this fare. Email info@skylinevoyager.com for
              help.
            </p>
          )}
        </div>
      ) : null}

      {step === "cancel" && order.customerAmount ? (
        <FlightCancelBooking
          email={email}
          orderId={orderId}
          customerAmount={order.customerAmount}
          currency={order.customerCurrency ?? "USD"}
          voidWindowEndsAt={order.voidWindowEndsAt}
          onCancelled={() => {
            setStep("overview");
            void loadOrder();
          }}
          onBack={() => setStep("overview")}
        />
      ) : null}

      {step === "request" ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-stone-900">Replace a slice</h2>
          <label className="block text-sm font-medium text-stone-700">
            Which leg to replace?
            <select
              value={sliceId}
              onChange={(e) => {
                const id = e.target.value;
                setSliceId(id);
                const s = order.slices.find((x) => x.id === id);
                if (s) setCabinClass(s.cabinClass);
              }}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {order.slices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-stone-700">
            New departure date
            <input
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Cabin class
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy || !departureDate}
            onClick={() => void startChangeRequest()}
            className="w-full rounded-full bg-stone-900 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Searching alternatives…" : "Find change options"}
          </button>
        </div>
      ) : null}

      {step === "offers" ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-stone-900">Choose an option</h2>
          {offers.length === 0 ? (
            <p className="text-sm text-stone-600">No change offers yet. Try again in a moment.</p>
          ) : (
            offers.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={busy}
                onClick={() => void selectOffer(o.id)}
                className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left text-sm shadow-sm hover:border-stone-400 disabled:opacity-60"
              >
                <p className="font-medium text-stone-900">{o.summary}</p>
                <p className="mt-1 text-stone-600">
                  Total change:{" "}
                  <strong>{formatMoney(o.changeTotalAmount, o.changeTotalCurrency)}</strong>
                  {o.penaltyTotalAmount !== "0" ? ` (incl. penalty ${o.penaltyTotalAmount})` : ""}
                </p>
              </button>
            ))
          )}
          <button
            type="button"
            className="text-sm text-stone-600 underline"
            onClick={() => requestId && void loadOffers(requestId)}
          >
            Refresh offers
          </button>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Review before confirming</p>
          <p className="mt-2">
            You will be charged{" "}
            <strong>{formatMoney(pendingAmount, pendingCurrency)}</strong> to your Duffel account
            balance (agency). Confirm only if this matches the price shown to the customer.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmChange()}
            className="mt-4 w-full rounded-full bg-stone-900 py-3 font-bold text-white disabled:opacity-60"
          >
            {busy ? "Confirming…" : "Confirm change with Duffel balance"}
          </button>
        </div>
      ) : null}

      {step === "done" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Change confirmed. Your itinerary above has been refreshed.
        </p>
      ) : null}

      <Link href={`/flights/lookup?email=${encodeURIComponent(email)}&ref=${encodeURIComponent(order.bookingReference)}`} className="text-sm text-stone-600 underline">
        ← Back to lookup
      </Link>
    </div>
  );
}
