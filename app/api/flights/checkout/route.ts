import { applyRateLimit } from "@/lib/api/rate-limit";
import { getOffer, mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { reportServerError } from "@/lib/observability/report-error";
import { isStripeConfigured } from "@/lib/stripe/config";
import { decimalToStripeMinorUnits } from "@/lib/stripe/amounts";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-checkout", 20, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return Response.json(
      {
        ok: false as const,
        error: "Card checkout is not configured. Use test balance booking.",
        code: "stripe_not_configured",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false as const, error: "Invalid JSON.", code: "invalid_json" }, {
      status: 400,
    });
  }

  const offerId =
    typeof body === "object" && body !== null && typeof (body as { offerId?: string }).offerId === "string"
      ? (body as { offerId: string }).offerId.trim()
      : "";
  if (!offerId.startsWith("off_")) {
    return Response.json(
      { ok: false as const, error: "Invalid offer id.", code: "validation_error", field: "offerId" },
      { status: 400 },
    );
  }

  const markupPercent = await resolveLiveMarkupPercent();

  try {
    const offer = await getOffer(offerId, markupPercent);
    if (!offer) {
      return Response.json(
        { ok: false as const, error: "Offer not found or expired.", code: "offer_not_found" },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const amount = decimalToStripeMinorUnits(offer.customerAmount, offer.currency);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: offer.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        offerId: offer.id,
        customerAmount: offer.customerAmount,
        baseAmount: offer.baseAmount,
        markupPercent: String(offer.markupPercent),
      },
    });

    if (!intent.client_secret) {
      return Response.json(
        { ok: false as const, error: "Could not start checkout.", code: "stripe_error" },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true as const,
      data: {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        customerAmount: offer.customerAmount,
        currency: offer.currency,
      },
    });
  } catch (err) {
    reportServerError(err, { route: "flights-checkout" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
