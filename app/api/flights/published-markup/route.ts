import { getFlightMarkupPolicy } from "@/lib/duffel/pricing";
import { isOwnerPricingKeyValid } from "@/lib/flights/owner-pricing";
import {
  getPublishedMarkupRecord,
  setPublishedFlightMarkupPercent,
} from "@/lib/flights/published-markup-store";
import { parseOwnerPricingKey, parseRequestedMarkupPercent } from "@/lib/flights/validation";

export const runtime = "nodejs";

export async function GET() {
  const policy = getFlightMarkupPolicy();
  const published = await getPublishedMarkupRecord();

  return Response.json({
    ok: true as const,
    data: {
      publishedPercent: published.percent,
      updatedAt: published.updatedAt || null,
      fromFile: published.fromFile,
      envDefaultPercent: policy.defaultPercent,
      policy,
    },
  });
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false as const, error: "Invalid JSON.", code: "invalid_json" },
      { status: 400 },
    );
  }

  const ownerKey = parseOwnerPricingKey(body);
  if (!isOwnerPricingKeyValid(ownerKey)) {
    return Response.json(
      { ok: false as const, error: "Unauthorized.", code: "unauthorized" },
      { status: 401 },
    );
  }

  const percent = parseRequestedMarkupPercent(body);
  if (percent == null) {
    return Response.json(
      {
        ok: false as const,
        error: "markupPercent is required (number within policy limits).",
        code: "validation_error",
        field: "markupPercent",
      },
      { status: 400 },
    );
  }

  try {
    const record = await setPublishedFlightMarkupPercent(percent);
    return Response.json({
      ok: true as const,
      data: {
        publishedPercent: record.percent,
        updatedAt: record.updatedAt,
      },
    });
  } catch (err) {
    return Response.json(
      {
        ok: false as const,
        error: err instanceof Error ? err.message : "Could not save published fee.",
        code: "save_failed",
      },
      { status: 503 },
    );
  }
}
