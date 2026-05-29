import { mapDuffelErrorForClient, searchFlights } from "@/lib/duffel/flight-service";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { repriceFlightOffer } from "@/lib/duffel/pricing";
import { reportServerError } from "@/lib/observability/report-error";
import {
  isOwnerPricingKeyValid,
  sanitizeFlightSearchResponse,
} from "@/lib/flights/owner-pricing";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { parseFlightSearchBody, parseOwnerPricingKey } from "@/lib/flights/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-search", 30, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight search is not configured.", code: "not_configured" },
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

  const parsed = parseFlightSearchBody(body);
  if (!parsed.ok) {
    return Response.json(
      {
        ok: false as const,
        error: parsed.error,
        code: "validation_error",
        field: parsed.field,
      },
      { status: 400 },
    );
  }

  const ownerKey = parseOwnerPricingKey(body);
  const ownerView = isOwnerPricingKeyValid(ownerKey);
  const markupPercent = await resolveLiveMarkupPercent();

  try {
    let result = await searchFlights(parsed.value);
    result = {
      ...result,
      offers: result.offers.map((offer) =>
        offer.markupPercent === markupPercent ? offer : repriceFlightOffer(offer, markupPercent),
      ),
    };
    return Response.json({
      ok: true as const,
      data: sanitizeFlightSearchResponse(
        { ...result, appliedMarkupPercent: markupPercent },
        ownerView,
      ),
    });
  } catch (err) {
    reportServerError(err, { route: "flights-search" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
