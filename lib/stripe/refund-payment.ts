import { getStripe } from "@/lib/stripe/server";
import { isStripeConfigured } from "@/lib/stripe/config";

export type StripeRefundResult =
  | { ok: true; refundId: string; amount: string; currency: string }
  | { ok: false; error: string; code: "not_configured" | "no_payment" | "stripe_error" };

export async function refundPaymentIntent(input: {
  paymentIntentId: string;
  amount: string;
  currency: string;
  reason?: "requested_by_customer";
}): Promise<StripeRefundResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured.", code: "not_configured" };
  }

  const amountNum = Number.parseFloat(input.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Refund amount must be greater than zero.", code: "stripe_error" };
  }

  const currency = input.currency.trim().toLowerCase();
  const amountCents = Math.round(amountNum * 100);

  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: amountCents,
      reason: input.reason ?? "requested_by_customer",
    });

    return {
      ok: true,
      refundId: refund.id,
      amount: (amountCents / 100).toFixed(2),
      currency: currency.toUpperCase(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refund failed.";
    return { ok: false, error: message, code: "stripe_error" };
  }
}
