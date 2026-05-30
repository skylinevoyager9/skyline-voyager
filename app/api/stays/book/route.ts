import { applyRateLimit } from "@/lib/api/rate-limit";
import { saveStayBooking } from "@/lib/bookings/store";
import { sendStayConfirmationEmail } from "@/lib/email/stay-confirmation";
import { isDuffelConfigured } from "@/lib/duffel/config";
import {
  bookStay,
  getStayQuote,
  mapDuffelErrorForClient,
} from "@/lib/duffel/stays-service";
import { parseStayBookBody } from "@/lib/stays/parse-api";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "stays-book", 12, 60_000);
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

  const parsed = parseStayBookBody(body);
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
    const quote =
      (await getStayQuote(parsed.value.quoteId, parsed.value.markupPercent)) ?? undefined;
    const result = await bookStay(parsed.value);

    let emailSent = false;
    if (quote) {
      try {
        const lead = parsed.value.guests[0];
        const booking = await saveStayBooking({
          bookingId: result.bookingId,
          bookingReference: result.bookingReference,
          email: parsed.value.email,
          guestName: `${lead.givenName} ${lead.familyName}`,
          quote,
          customerAmount: result.customerAmount,
          currency: result.currency,
          liveMode: result.liveMode,
          paymentIntentId: parsed.value.paymentIntentId,
        });
        const emailResult = await sendStayConfirmationEmail({ booking, quote });
        emailSent = emailResult.sent;
        if (!emailResult.sent && emailResult.error) {
          reportServerError(new Error(emailResult.error), {
            route: "stays-book",
            bookingId: result.bookingId,
          });
        }
      } catch (persistErr) {
        reportServerError(persistErr, { route: "stays-book", bookingId: result.bookingId });
      }
    }

    return Response.json({
      ok: true as const,
      data: { ...result, emailSent },
    });
  } catch (err) {
    reportServerError(err, { route: "stays-book" });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
