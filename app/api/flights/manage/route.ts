import { applyRateLimit } from "@/lib/api/rate-limit";
import { assertBookingAccess, BookingAccessError } from "@/lib/flights/booking-access";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { getManageOrder } from "@/lib/duffel/order-change-service";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, "flights-manage", 30, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json(
      { ok: false as const, error: "Flight booking is not configured.", code: "not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const orderId = url.searchParams.get("orderId")?.trim() ?? "";

  try {
    const booking = await assertBookingAccess(email, orderId);
    const order = await getManageOrder(orderId);
    if (!order) {
      return Response.json(
        { ok: false as const, error: "Order not found.", code: "not_found" },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true as const,
      data: {
        ...order,
        customerAmount: booking.customerAmount,
        customerCurrency: booking.currency,
        storedCancellation: booking.cancelledAt
          ? {
              cancelledAt: booking.cancelledAt,
              customerRefundedAmount: booking.customerRefundedAmount,
              refundStatus: booking.refundStatus,
            }
          : null,
      },
    });
  } catch (err) {
    if (err instanceof BookingAccessError) {
      return Response.json(
        { ok: false as const, error: err.message, code: err.code },
        { status: err.code === "validation_error" ? 400 : 404 },
      );
    }
    reportServerError(err, { route: "flights-manage", orderId });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json(
      { ok: false as const, error: mapped.error, code: mapped.code },
      { status: mapped.status },
    );
  }
}
