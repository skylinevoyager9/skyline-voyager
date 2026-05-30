import { applyRateLimit } from "@/lib/api/rate-limit";
import { findBookingByEmailAndReference } from "@/lib/bookings/store";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { getStayBooking } from "@/lib/duffel/stays-service";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, "stays-lookup", 20, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Stays booking is not configured.", code: "not_configured" },
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
    if (!booking || booking.product !== "stay") {
      return Response.json(
        { ok: false as const, error: "No stay booking found for those details.", code: "not_found" },
        { status: 404 },
      );
    }

    let bookingReference = booking.bookingReference;
    try {
      const remote = await getStayBooking(booking.orderId);
      if (remote && typeof remote.reference === "string") {
        bookingReference = remote.reference;
      }
    } catch (err) {
      reportServerError(err, { route: "stays-lookup", bookingId: booking.orderId });
    }

    return Response.json({
      ok: true as const,
      data: {
        product: "stay" as const,
        bookingReference,
        bookingId: booking.orderId,
        guestName: booking.passengerName,
        guestEmail: booking.passengerEmail,
        customerAmount: booking.customerAmount,
        currency: booking.currency,
        itinerarySummary: booking.itinerarySummary,
        createdAt: booking.createdAt,
        liveMode: booking.liveMode,
      },
    });
  } catch (err) {
    reportServerError(err, { route: "stays-lookup" });
    return Response.json(
      { ok: false as const, error: "Lookup failed.", code: "internal_error" },
      { status: 500 },
    );
  }
}
