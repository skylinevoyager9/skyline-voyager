import { applyRateLimit } from "@/lib/api/rate-limit";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient, searchStays } from "@/lib/duffel/stays-service";
import { resolveLiveMarkupPercent } from "@/lib/flights/pricing-request";
import { geocodeStayQuery } from "@/lib/stays/geocode";
import { parseStaySearchBody } from "@/lib/stays/parse-api";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "stays-search", 15, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Stays search is not configured.", code: "not_configured" },
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

  const parsed = parseStaySearchBody(body);
  if (!parsed.ok) {
    return Response.json(
      { ok: false as const, error: parsed.error, code: "validation_error", field: parsed.field },
      { status: 400 },
    );
  }

  let { latitude, longitude } = parsed.value;
  const locationQuery = "locationQuery" in parsed.value ? parsed.value.locationQuery : "";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    const geo = await geocodeStayQuery(locationQuery ?? "");
    if (!geo) {
      return Response.json(
        {
          ok: false as const,
          error: "Could not find that location. Try a city name from the suggestions.",
          code: "location_not_found",
        },
        { status: 400 },
      );
    }
    latitude = geo.latitude;
    longitude = geo.longitude;
  }

  const markupPercent = await resolveLiveMarkupPercent();

  try {
    const data = await searchStays({
      checkInDate: parsed.value.checkInDate,
      checkOutDate: parsed.value.checkOutDate,
      rooms: parsed.value.rooms,
      guests: parsed.value.guests,
      latitude,
      longitude,
      radiusKm: parsed.value.radiusKm,
      markupPercent,
    });
    return Response.json({ ok: true as const, data });
  } catch (err) {
    reportServerError(err, { route: "stays-search" });
    const mapped = mapDuffelErrorForClient(err);
    const duffelDetail = mapped.error.toLowerCase();
    const staysNotEnabled =
      mapped.status === 403 ||
      mapped.status === 404 ||
      duffelDetail.includes("not enabled") ||
      duffelDetail.includes("contact sales");
    const message = staysNotEnabled
      ? "Duffel Stays is not enabled on your account yet. Email help@duffel.com or use https://duffel.com/contact-us — there is no self-serve toggle in the dashboard."
      : mapped.error;
    return Response.json(
      {
        ok: false as const,
        error: message,
        code: staysNotEnabled ? "stays_not_enabled" : mapped.code,
        duffelError: staysNotEnabled ? mapped.error : undefined,
      },
      { status: mapped.status },
    );
  }
}
