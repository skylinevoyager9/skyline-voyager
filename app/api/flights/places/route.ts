import { applyRateLimit } from "@/lib/api/rate-limit";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { searchPlaceSuggestions } from "@/lib/duffel/places";

export const runtime = "nodejs";

/** City / airport autocomplete (Duffel Place Suggestions). */
export async function GET(req: Request) {
  const limited = applyRateLimit(req, "flights-places", 120, 60_000);
  if (limited) return limited;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ ok: true as const, options: [] });
  }

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight search is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const options = await searchPlaceSuggestions(q);
    return Response.json({ ok: true as const, options });
  } catch (err) {
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
