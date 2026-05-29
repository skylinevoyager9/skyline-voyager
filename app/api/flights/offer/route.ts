import { customerAmountsMatch } from "@/lib/duffel/pricing";
import { getOffer, mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { parseQuotedCustomerAmountQuery } from "@/lib/flights/validation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const offerId = url.searchParams.get("offerId")?.trim() ?? "";
  const quoted = parseQuotedCustomerAmountQuery(url.searchParams.get("quoted"));
  const markupPercent = await resolveLiveMarkupPercent();

  if (!offerId.startsWith("off_")) {
    return Response.json(
      { ok: false as const, error: "Invalid offer id.", code: "validation_error" },
      { status: 400 },
    );
  }

  try {
    const offer = await getOffer(offerId, markupPercent);
    if (!offer) {
      return Response.json(
        { ok: false as const, error: "Offer not found or expired.", code: "offer_not_found" },
        { status: 404 },
      );
    }

    const priceChanged =
      quoted != null && !customerAmountsMatch(quoted, offer.customerAmount);

    return Response.json({
      ok: true as const,
      data: offer,
      priceChanged,
      previousQuotedAmount: priceChanged ? quoted : undefined,
      appliedMarkupPercent: markupPercent,
    });
  } catch (err) {
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
