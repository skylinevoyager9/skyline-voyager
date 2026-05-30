/** How airline/Duffel refunds map to customer card refunds (matches site terms). */

export type CancellationRefundPlan = {
  duffelRefundAmount: string | null;
  duffelRefundCurrency: string;
  refundTo: string;
  customerRefundAmount: string;
  customerRefundCurrency: string;
  stripeRefundEligible: boolean;
  policySummary: string;
  policyDetail: string;
  isFullCustomerRefund: boolean;
  serviceFeeMayBeRetained: boolean;
};

const CASH_REFUND_DESTINATIONS = new Set([
  "balance",
  "original_form_of_payment",
  "arc_bsp_cash",
  "card",
]);

function parseAmount(value: string | null | undefined): number {
  if (value == null || value === "") return NaN;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

export function planCustomerRefund(input: {
  customerAmount: string;
  customerCurrency: string;
  duffelRefundAmount: string | null | undefined;
  duffelRefundCurrency: string | null | undefined;
  refundTo: string;
}): CancellationRefundPlan {
  const customerPaid = parseAmount(input.customerAmount);
  const customerCurrency = input.customerCurrency.trim().toUpperCase() || "USD";
  const refundTo = input.refundTo?.trim() || "unknown";
  const duffelCurrency = (input.duffelRefundCurrency?.trim() || customerCurrency).toUpperCase();
  const duffelRefund = parseAmount(input.duffelRefundAmount ?? null);

  const currencyMismatch =
    Number.isFinite(duffelRefund) &&
    duffelRefund > 0 &&
    duffelCurrency !== customerCurrency;

  if (!CASH_REFUND_DESTINATIONS.has(refundTo)) {
    return {
      duffelRefundAmount: input.duffelRefundAmount ?? null,
      duffelRefundCurrency: duffelCurrency,
      refundTo,
      customerRefundAmount: "0.00",
      customerRefundCurrency: customerCurrency,
      stripeRefundEligible: false,
      policySummary: "No automatic card refund for this cancellation.",
      policyDetail:
        refundTo === "airline_credits"
          ? "The airline issued travel credit instead of a cash refund. Contact us at info@skylinevoyager.com with your booking reference."
          : "Refund destination is not eligible for automatic card repayment. Contact us for help.",
      isFullCustomerRefund: false,
      serviceFeeMayBeRetained: true,
    };
  }

  if (input.duffelRefundAmount == null || Number.isNaN(duffelRefund)) {
    return {
      duffelRefundAmount: null,
      duffelRefundCurrency: duffelCurrency,
      refundTo,
      customerRefundAmount: "0.00",
      customerRefundCurrency: customerCurrency,
      stripeRefundEligible: false,
      policySummary: "Refund amount not confirmed by the airline yet.",
      policyDetail:
        "We cancelled per airline rules but the refund quote was unknown. We will email you when the amount is confirmed, or contact us at info@skylinevoyager.com.",
      isFullCustomerRefund: false,
      serviceFeeMayBeRetained: true,
    };
  }

  if (currencyMismatch) {
    return {
      duffelRefundAmount: input.duffelRefundAmount ?? null,
      duffelRefundCurrency: duffelCurrency,
      refundTo,
      customerRefundAmount: "0.00",
      customerRefundCurrency: customerCurrency,
      stripeRefundEligible: false,
      policySummary: "Card refund requires manual processing.",
      policyDetail: `Airline refund is in ${duffelCurrency} while you paid in ${customerCurrency}. Contact ${"info@skylinevoyager.com"} and we will process your refund manually.`,
      isFullCustomerRefund: false,
      serviceFeeMayBeRetained: true,
    };
  }

  if (duffelRefund <= 0) {
    return {
      duffelRefundAmount: input.duffelRefundAmount ?? "0.00",
      duffelRefundCurrency: duffelCurrency,
      refundTo,
      customerRefundAmount: "0.00",
      customerRefundCurrency: customerCurrency,
      stripeRefundEligible: false,
      policySummary: "Non-refundable under airline fare rules.",
      policyDetail:
        "The airline did not return a cash refund for this fare (penalty or non-refundable ticket). Per our terms, service fees are not refunded when the airline refund is zero.",
      isFullCustomerRefund: false,
      serviceFeeMayBeRetained: true,
    };
  }

  const capped = Number.isFinite(customerPaid)
    ? Math.min(duffelRefund, customerPaid)
    : duffelRefund;
  const customerRefundAmount = formatAmount(capped);
  const isFull =
    Number.isFinite(customerPaid) && capped >= customerPaid - 0.01;
  const serviceFeeMayBeRetained = !isFull && Number.isFinite(customerPaid) && customerPaid > capped;

  let policySummary: string;
  let policyDetail: string;

  if (isFull) {
    policySummary = "Full refund to your original payment method.";
    policyDetail =
      "Airline refund covers your total charge. We will refund your card for the amount you paid.";
  } else {
    policySummary = `Partial refund of ${customerRefundAmount} ${customerCurrency}.`;
    policyDetail =
      "Airline refund is less than what you paid. Per our terms, Skyline Voyager service fees and any non-refundable extras are not returned on partial airline refunds.";
  }

  return {
    duffelRefundAmount: input.duffelRefundAmount ?? null,
    duffelRefundCurrency: duffelCurrency,
    refundTo,
    customerRefundAmount,
    customerRefundCurrency: customerCurrency,
    stripeRefundEligible: capped > 0,
    policySummary,
    policyDetail,
    isFullCustomerRefund: isFull,
    serviceFeeMayBeRetained,
  };
}

export const CANCELLATION_POLICY_LINK = "/terms#flight-cancellations";
