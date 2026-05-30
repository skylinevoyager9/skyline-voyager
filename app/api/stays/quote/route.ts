import { applyRateLimit } from "@/lib/api/rate-limit";
import { isDuffelConfigured } from "@/lib/duffel/config";
import {
  createStayQuote,
  getStayQuote,
  mapDuffelErrorForClient,
} from "@/lib/duffel/stays-service";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, "stays-quote-get", 40, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Stays booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }

  const quoteId = new URL(req.url).searchParams.get("quoteId")?.trim() ?? "";
  if (!quoteId.startsWith("quo_")) {
    return Response.json(
      { ok: false as const, error: "Invalid quote id.", code: "validation_error" },
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
    return Response.json({ ok: true as const, data: quote });
  } catch (err) {
    reportServerError(err, { route: "stays-quote-get" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "stays-quote-create", 20, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Stays booking is not configured.", code: "not_configured" },
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

  const rateId =
    typeof body === "object" && body !== null && typeof (body as { rateId?: string }).rateId === "string"
      ? (body as { rateId: string }).rateId.trim()
      : "";
  const accommodationName =
    typeof body === "object" && body !== null && typeof (body as { accommodationName?: string }).accommodationName === "string"
      ? (body as { accommodationName: string }).accommodationName.trim()
      : undefined;
  const searchResultId =
    typeof body === "object" && body !== null && typeof (body as { searchResultId?: string }).searchResultId === "string"
      ? (body as { searchResultId: string }).searchResultId.trim()
      : undefined;

  if (!rateId.startsWith("rat_")) {
    return Response.json(
      { ok: false as const, error: "Invalid rate id.", code: "validation_error", field: "rateId" },
      { status: 400 },
    );
  }

  try {
    const markupPercent = await resolveLiveMarkupPercent();
    const quote = await createStayQuote(rateId, markupPercent, {
      accommodationName,
      searchResultId,
    });
    return Response.json({ ok: true as const, data: quote });
  } catch (err) {
    reportServerError(err, { route: "stays-quote-create" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
