import { applyRateLimit } from "@/lib/api/rate-limit";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { fetchStayRates, mapDuffelErrorForClient } from "@/lib/duffel/stays-service";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "stays-rates", 30, 60_000);
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

  const searchResultId =
    typeof body === "object" && body !== null && typeof (body as { searchResultId?: string }).searchResultId === "string"
      ? (body as { searchResultId: string }).searchResultId.trim()
      : "";

  if (!searchResultId.startsWith("srr_")) {
    return Response.json(
      {
        ok: false as const,
        error: "Invalid search result id.",
        code: "validation_error",
        field: "searchResultId",
      },
      { status: 400 },
    );
  }

  try {
    const markupPercent = await resolveLiveMarkupPercent();
    const data = await fetchStayRates(searchResultId, markupPercent);
    return Response.json({ ok: true as const, data });
  } catch (err) {
    reportServerError(err, { route: "stays-rates" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
