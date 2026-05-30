import { applyRateLimit } from "@/lib/api/rate-limit";
import { assertBookingAccess, BookingAccessError } from "@/lib/flights/booking-access";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import {
  confirmOrderChange,
  createPendingOrderChange,
  getPendingOrderChange,
} from "@/lib/duffel/order-change-service";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

/** Create a pending order change from a selected offer. */
export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-change-confirm", 15, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json({ ok: false, error: "Not configured.", code: "not_configured" }, { status: 503 });
  }

  let body: {
    email?: string;
    orderId?: string;
    offerId?: string;
    orderChangeId?: string;
    action?: "create" | "confirm";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON.", code: "validation_error" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const orderId = body.orderId?.trim() ?? "";
  const action = body.action ?? "create";

  try {
    await assertBookingAccess(email, orderId);

    if (action === "create") {
      const offerId = body.offerId?.trim() ?? "";
      if (!offerId.startsWith("oco_")) {
        return Response.json(
          { ok: false, error: "offerId is required.", code: "validation_error" },
          { status: 400 },
        );
      }
      const pending = await createPendingOrderChange(offerId);
      return Response.json({ ok: true, data: { ...pending, action: "create" as const } });
    }

    const orderChangeId = body.orderChangeId?.trim() ?? "";
    if (!orderChangeId.startsWith("oce_")) {
      return Response.json(
        { ok: false, error: "orderChangeId is required.", code: "validation_error" },
        { status: 400 },
      );
    }

    const latest = await getPendingOrderChange(orderChangeId);
    if (latest.confirmedAt) {
      return Response.json({
        ok: true,
        data: { confirmedAt: latest.confirmedAt, alreadyConfirmed: true },
      });
    }

    const result = await confirmOrderChange({
      orderChangeId,
      currency: latest.changeTotalCurrency,
      amount: latest.changeTotalAmount,
    });

    return Response.json({
      ok: true,
      data: {
        confirmedAt: result.confirmedAt,
        changeTotalAmount: latest.changeTotalAmount,
        changeTotalCurrency: latest.changeTotalCurrency,
      },
    });
  } catch (err) {
    if (err instanceof BookingAccessError) {
      return Response.json({ ok: false, error: err.message, code: err.code }, { status: 404 });
    }
    reportServerError(err, { route: "flights-change-confirm", orderId });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}
