import { findBookingByEmailAndReference } from "@/lib/bookings/store";
import { getDuffelOrder } from "@/lib/duffel/flight-service";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, "flights-lookup", 20, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const ref = url.searchParams.get("ref")?.trim() ?? "";

  if (!email || !ref) {
    return Response.json(
      {
        ok: false as const,
        error: "Email and booking reference are required.",
        code: "validation_error",
      },
      { status: 400 },
    );
  }

  try {
    const booking = await findBookingByEmailAndReference(email, ref);
    if (!booking) {
      return Response.json(
        { ok: false as const, error: "No booking found for those details.", code: "not_found" },
        { status: 404 },
      );
    }

    let duffelReference = booking.bookingReference;
    try {
      const order = await getDuffelOrder(booking.orderId);
      if (order?.booking_reference) duffelReference = order.booking_reference;
    } catch (err) {
      reportServerError(err, { route: "flights-lookup", orderId: booking.orderId });
    }

    return Response.json({
      ok: true as const,
      data: {
        bookingReference: duffelReference,
        orderId: booking.orderId,
        passengerName: booking.passengerName,
        passengerEmail: booking.passengerEmail,
        customerAmount: booking.customerAmount,
        currency: booking.currency,
        itinerarySummary: booking.itinerarySummary,
        createdAt: booking.createdAt,
        liveMode: booking.liveMode,
      },
    });
  } catch (err) {
    reportServerError(err, { route: "flights-lookup" });
    return Response.json(
      { ok: false as const, error: "Lookup failed.", code: "internal_error" },
      { status: 500 },
    );
  }
}
