import { getDuffelMode, isDuffelConfigured } from "@/lib/duffel/config";
import { getFlightMarkupPolicy } from "@/lib/duffel/pricing";
import { getPublishedMarkupRecord } from "@/lib/flights/published-markup-store";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";
import { getStayRuntimeLabels } from "@/lib/stays/runtime-labels";
import { isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";

export async function GET() {
  const published = await getPublishedMarkupRecord();
  const runtime = getStayRuntimeLabels();

  return Response.json({
    configured: isDuffelConfigured(),
    mode: getDuffelMode(),
    markupPercent: published.percent,
    publishedPercent: published.percent,
    markupPolicy: getFlightMarkupPolicy(),
    stripeConfigured: isStripeConfigured(),
    paymentMode: getFlightPaymentMode(),
    runtime,
  });
}
