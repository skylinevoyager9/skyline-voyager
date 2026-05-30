"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

type PayFormProps = {
  quoteId: string;
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

function PayForm({ quoteId, onPaid, onError, disabled }: PayFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const returnUrl = `${window.location.origin}/stays/book?quoteId=${encodeURIComponent(quoteId)}`;
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: returnUrl },
    });
    setProcessing(false);

    if (result.error) {
      onError(result.error.message ?? "Payment failed.");
      return;
    }

    const intent = result.paymentIntent;
    if (intent?.status === "succeeded") {
      onPaid(intent.id);
      return;
    }

    onError("Payment was not completed. Try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || processing || disabled}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
      >
        {processing ? "Processing…" : "Pay securely"}
      </button>
    </form>
  );
}

type Props = {
  clientSecret: string;
  quoteId: string;
  publishableKey: string;
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export function StaysStripeCheckout({
  clientSecret,
  quoteId,
  publishableKey,
  onPaid,
  onError,
  disabled,
}: Props) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey) as Promise<Stripe | null>,
    [publishableKey],
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PayForm quoteId={quoteId} onPaid={onPaid} onError={onError} disabled={disabled} />
    </Elements>
  );
}
