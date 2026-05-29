import { getDuffelMode, isDuffelConfigured } from "@/lib/duffel/config";
import { getFlightMarkupPolicy } from "@/lib/duffel/pricing";
import { getFlightRuntimeLabels } from "@/lib/flights/runtime-labels";
import { getPublishedFlightMarkupPercent } from "@/lib/flights/published-markup-store";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";
import { isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";

/** Public status for the flight search UI (no secrets). */
export async function GET() {
  const publishedPercent = await getPublishedFlightMarkupPercent();

  return Response.json({
    configured: isDuffelConfigured(),
    mode: getDuffelMode(),
    markupPercent: publishedPercent,
    publishedPercent,
    markupPolicy: getFlightMarkupPolicy(),
    stripeConfigured: isStripeConfigured(),
    paymentMode: getFlightPaymentMode(),
    runtime: getFlightRuntimeLabels(),
  });
}
