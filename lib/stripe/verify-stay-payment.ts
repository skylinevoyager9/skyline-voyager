import type { StayQuoteSummary } from "@/lib/duffel/stays-types";
import { decimalToStripeMinorUnits } from "./amounts";
import { getStripe } from "./server";
import { StripePaymentError } from "./verify-payment";

export { StripePaymentError };

/** Ensure the customer paid the marked-up stay price before we book with Duffel. */
export async function assertStayPaymentSucceeded(
  paymentIntentId: string,
  quote: StayQuoteSummary,
): Promise<void> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== "succeeded") {
    throw new StripePaymentError(
      "payment_not_completed",
      "Payment has not completed. Please finish card checkout first.",
    );
  }

  const expectedMinor = decimalToStripeMinorUnits(quote.customerAmount, quote.currency);
  if (intent.amount !== expectedMinor) {
    throw new StripePaymentError(
      "payment_amount_mismatch",
      "Payment amount does not match the selected quote.",
    );
  }

  if (intent.currency.toLowerCase() !== quote.currency.toLowerCase()) {
    throw new StripePaymentError(
      "payment_currency_mismatch",
      "Payment currency does not match the quote.",
    );
  }

  if (intent.metadata?.quoteId && intent.metadata.quoteId !== quote.quoteId) {
    throw new StripePaymentError(
      "payment_quote_mismatch",
      "Payment was created for a different quote.",
    );
  }
}
