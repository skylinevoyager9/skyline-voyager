import { computeFlightCheckoutTotals } from "@/lib/flights/ancillaries";
import type { FlightOfferSummary, SelectedFlightService } from "@/lib/duffel/types";
import { decimalToStripeMinorUnits } from "./amounts";
import { getStripe } from "./server";

export class StripePaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "StripePaymentError";
  }
}

/** Ensure the customer paid the marked-up offer price (fare + optional bags) before we pay Duffel. */
export async function assertFlightPaymentSucceeded(
  paymentIntentId: string,
  offer: FlightOfferSummary,
  selectedServices: SelectedFlightService[] = [],
  expectedCustomerAmount?: string,
): Promise<void> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== "succeeded") {
    throw new StripePaymentError(
      "payment_not_completed",
      "Payment has not completed. Please finish card checkout first.",
    );
  }

  const totals = computeFlightCheckoutTotals(offer, selectedServices, offer.markupPercent);
  const customerAmount = expectedCustomerAmount ?? totals.customerAmount;
  const expectedMinor = decimalToStripeMinorUnits(customerAmount, offer.currency);
  if (intent.amount !== expectedMinor) {
    throw new StripePaymentError(
      "payment_amount_mismatch",
      "Payment amount does not match the selected offer.",
    );
  }

  if (intent.currency.toLowerCase() !== offer.currency.toLowerCase()) {
    throw new StripePaymentError(
      "payment_currency_mismatch",
      "Payment currency does not match the offer.",
    );
  }

  if (intent.metadata?.offerId && intent.metadata.offerId !== offer.id) {
    throw new StripePaymentError(
      "payment_offer_mismatch",
      "Payment was created for a different offer.",
    );
  }
}
