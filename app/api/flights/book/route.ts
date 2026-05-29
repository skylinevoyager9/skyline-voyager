import { saveBooking } from "@/lib/bookings/store";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { bookFlight, getOffer, mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { reportServerError } from "@/lib/observability/report-error";
import { parseFlightBookBody } from "@/lib/flights/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-book", 12, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight booking is not configured.", code: "not_configured" },
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

  const parsed = parseFlightBookBody(body);
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

  try {
    const offer =
      (await getOffer(parsed.value.offerId, parsed.value.markupPercent)) ?? undefined;
    const result = await bookFlight(parsed.value);

    let emailSent = false;
    if (offer) {
      try {
        const booking = await saveBooking({
          orderId: result.orderId,
          bookingReference: result.bookingReference,
          passengers: parsed.value.passengers,
          offer,
          customerAmount: result.customerAmount,
          currency: result.currency,
          liveMode: result.liveMode,
          paymentIntentId: parsed.value.paymentIntentId,
        });
        const emailResult = await sendBookingConfirmationEmail({ booking, offer });
        emailSent = emailResult.sent;
        if (!emailResult.sent && emailResult.error) {
          reportServerError(new Error(emailResult.error), {
            route: "flights-book",
            orderId: result.orderId,
          });
        }
      } catch (persistErr) {
        reportServerError(persistErr, { route: "flights-book", orderId: result.orderId });
      }
    }

    return Response.json({
      ok: true as const,
      data: { ...result, emailSent },
    });
  } catch (err) {
    reportServerError(err, { route: "flights-book" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
