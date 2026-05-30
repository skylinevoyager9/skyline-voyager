import { applyRateLimit } from "@/lib/api/rate-limit";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { getStayQuote, mapDuffelErrorForClient } from "@/lib/duffel/stays-service";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { reportServerError } from "@/lib/observability/report-error";
import { isStripeConfigured } from "@/lib/stripe/config";
import { decimalToStripeMinorUnits } from "@/lib/stripe/amounts";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "stays-checkout", 20, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Stays booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return Response.json(
      {
        ok: false as const,
        error: "Card checkout is not configured.",
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

  const quoteId =
    typeof body === "object" && body !== null && typeof (body as { quoteId?: string }).quoteId === "string"
      ? (body as { quoteId: string }).quoteId.trim()
      : "";
  if (!quoteId.startsWith("quo_")) {
    return Response.json(
      { ok: false as const, error: "Invalid quote id.", code: "validation_error", field: "quoteId" },
      { status: 400 },
    );
  }

  try {
    const markupPercent = await resolveLiveMarkupPercent();
    const quote = await getStayQuote(quoteId, markupPercent);
    if (!quote) {
      return Response.json(
        { ok: false as const, error: "Quote not found or expired.", code: "quote_not_found" },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const amount = decimalToStripeMinorUnits(quote.customerAmount, quote.currency);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: quote.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        quoteId: quote.quoteId,
        customerAmount: quote.customerAmount,
        supplierAmount: quote.supplierAmount,
        markupPercent: String(quote.markupPercent),
        product: "stay",
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
        customerAmount: quote.customerAmount,
        currency: quote.currency,
      },
    });
  } catch (err) {
    reportServerError(err, { route: "stays-checkout" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
