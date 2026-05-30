import { applyRateLimit } from "@/lib/api/rate-limit";
import { assertBookingAccess, BookingAccessError } from "@/lib/flights/booking-access";
import { planCustomerRefund } from "@/lib/flights/cancellation-policy";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import { getManageOrder } from "@/lib/duffel/order-change-service";
import {
  confirmOrderCancellation,
  createOrderCancellationQuote,
  getOrderCancellation,
} from "@/lib/duffel/order-cancel-service";
import { updateStoredBooking } from "@/lib/bookings/store";
import { sendFlightCancellationEmail } from "@/lib/email/flight-cancellation";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";
import { refundPaymentIntent } from "@/lib/stripe/refund-payment";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-cancel", 10, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json({ ok: false, error: "Not configured.", code: "not_configured" }, { status: 503 });
  }

  let body: {
    email?: string;
    orderId?: string;
    action?: "quote" | "confirm";
    orderCancellationId?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON.", code: "validation_error" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const orderId = body.orderId?.trim() ?? "";
  const action = body.action ?? "quote";

  try {
    const booking = await assertBookingAccess(email, orderId);
    if (booking.product !== "flight") {
      return Response.json(
        { ok: false, error: "Only flight bookings can be cancelled here.", code: "validation_error" },
        { status: 400 },
      );
    }
    if (booking.cancelledAt) {
      return Response.json(
        { ok: false, error: "This booking is already cancelled.", code: "already_cancelled" },
        { status: 400 },
      );
    }

    const manage = await getManageOrder(orderId);
    if (!manage) {
      return Response.json({ ok: false, error: "Order not found.", code: "not_found" }, { status: 404 });
    }
    if (manage.cancelledAt) {
      return Response.json(
        { ok: false, error: "This order is already cancelled with the airline.", code: "already_cancelled" },
        { status: 400 },
      );
    }

    if (action === "quote") {
      if (!manage.canCancel) {
        return Response.json(
          {
            ok: false,
            error:
              "This order cannot be cancelled online. Contact us at info@skylinevoyager.com and we can request a quote from Duffel support.",
            code: "not_cancellable",
          },
          { status: 400 },
        );
      }

      const quote = await createOrderCancellationQuote(orderId);
      const plan = planCustomerRefund({
        customerAmount: booking.customerAmount,
        customerCurrency: booking.currency,
        duffelRefundAmount: quote.refundAmount,
        duffelRefundCurrency: quote.refundCurrency,
        refundTo: quote.refundTo,
      });

      return Response.json({
        ok: true,
        data: {
          orderCancellationId: quote.id,
          expiresAt: quote.expiresAt,
          voidWindowEndsAt: manage.voidWindowEndsAt,
          quote: {
            refundAmount: quote.refundAmount,
            refundCurrency: quote.refundCurrency,
            refundTo: quote.refundTo,
          },
          plan,
        },
      });
    }

    const cancellationId = body.orderCancellationId?.trim() ?? "";
    if (!cancellationId.startsWith("ore_")) {
      return Response.json(
        { ok: false, error: "orderCancellationId is required.", code: "validation_error" },
        { status: 400 },
      );
    }

    const pending = await getOrderCancellation(cancellationId);
    if (pending.orderId !== orderId) {
      return Response.json(
        { ok: false, error: "Cancellation does not match this order.", code: "validation_error" },
        { status: 400 },
      );
    }

    const confirmed = pending.confirmedAt
      ? pending
      : await confirmOrderCancellation(cancellationId);

    const plan = planCustomerRefund({
      customerAmount: booking.customerAmount,
      customerCurrency: booking.currency,
      duffelRefundAmount: confirmed.refundAmount,
      duffelRefundCurrency: confirmed.refundCurrency,
      refundTo: confirmed.refundTo,
    });

    let stripeRefunded = false;
    let stripeRefundError: string | undefined;

    if (
      plan.stripeRefundEligible &&
      getFlightPaymentMode() === "stripe" &&
      booking.paymentIntentId
    ) {
      const refund = await refundPaymentIntent({
        paymentIntentId: booking.paymentIntentId,
        amount: plan.customerRefundAmount,
        currency: plan.customerRefundCurrency,
      });
      if (refund.ok) {
        stripeRefunded = true;
      } else {
        stripeRefundError = refund.error;
        reportServerError(new Error(refund.error), {
          route: "flights-cancel-stripe",
          orderId,
          paymentIntentId: booking.paymentIntentId,
        });
      }
    }

    const refundStatus = !plan.stripeRefundEligible
      ? confirmed.refundTo === "airline_credits"
        ? "airline_credit"
        : Number.parseFloat(plan.customerRefundAmount) <= 0
          ? "none"
          : "unknown"
      : plan.isFullCustomerRefund
        ? "full"
        : "partial";

    await updateStoredBooking(orderId, {
      cancelledAt: confirmed.confirmedAt ?? new Date().toISOString(),
      duffelCancellationId: confirmed.id,
      customerRefundedAmount: stripeRefunded ? plan.customerRefundAmount : "0.00",
      refundStatus,
    });

    void sendFlightCancellationEmail({ booking, plan, stripeRefunded }).catch((err) => {
      reportServerError(err, { route: "flights-cancel-email", orderId });
    });

    return Response.json({
      ok: true,
      data: {
        confirmedAt: confirmed.confirmedAt,
        plan,
        stripeRefunded,
        stripeRefundError,
        refundStatus,
      },
    });
  } catch (err) {
    if (err instanceof BookingAccessError) {
      return Response.json({ ok: false, error: err.message, code: err.code }, { status: 404 });
    }
    reportServerError(err, { route: "flights-cancel", orderId });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}
