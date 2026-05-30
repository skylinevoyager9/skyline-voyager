import { applyRateLimit } from "@/lib/api/rate-limit";
import { assertBookingAccess, BookingAccessError } from "@/lib/flights/booking-access";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { mapDuffelErrorForClient } from "@/lib/duffel/flight-service";
import {
  createOrderChangeRequest,
  getOrderChangeRequest,
} from "@/lib/duffel/order-change-service";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, "flights-change-get", 40, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json({ ok: false, error: "Not configured.", code: "not_configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const orderId = url.searchParams.get("orderId")?.trim() ?? "";
  const requestId = url.searchParams.get("requestId")?.trim() ?? "";

  if (!requestId.startsWith("ocr_")) {
    return Response.json(
      { ok: false, error: "requestId is required.", code: "validation_error" },
      { status: 400 },
    );
  }

  try {
    await assertBookingAccess(email, orderId);
    const data = await getOrderChangeRequest(requestId);
    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof BookingAccessError) {
      return Response.json({ ok: false, error: err.message, code: err.code }, { status: 404 });
    }
    reportServerError(err, { route: "flights-change-request-get", requestId });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, "flights-change-post", 15, 60_000);
  if (limited) return limited;

  if (!isDuffelConfigured()) {
    return Response.json({ ok: false, error: "Not configured.", code: "not_configured" }, { status: 503 });
  }

  let body: {
    email?: string;
    orderId?: string;
    sliceIdToRemove?: string;
    departureDate?: string;
    cabinClass?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON.", code: "validation_error" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const orderId = body.orderId?.trim() ?? "";
  const sliceIdToRemove = body.sliceIdToRemove?.trim() ?? "";
  const departureDate = body.departureDate?.trim() ?? "";
  const cabinClass = body.cabinClass?.trim() ?? "economy";

  if (!sliceIdToRemove.startsWith("sli_") || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return Response.json(
      { ok: false, error: "Slice and departure date (YYYY-MM-DD) are required.", code: "validation_error" },
      { status: 400 },
    );
  }

  try {
    const booking = await assertBookingAccess(email, orderId);
    const { getManageOrder } = await import("@/lib/duffel/order-change-service");
    const order = await getManageOrder(orderId);
    if (!order?.canChange) {
      return Response.json(
        { ok: false, error: "This order cannot be changed via the API.", code: "not_changeable" },
        { status: 400 },
      );
    }

    const slice = order.slices.find((s) => s.id === sliceIdToRemove);
    if (!slice) {
      return Response.json(
        { ok: false, error: "Unknown slice for this order.", code: "validation_error" },
        { status: 400 },
      );
    }

    const created = await createOrderChangeRequest({
      orderId,
      sliceIdToRemove,
      add: {
        origin: slice.origin,
        destination: slice.destination,
        departureDate,
        cabinClass: cabinClass || slice.cabinClass,
      },
    });

    return Response.json({
      ok: true,
      data: {
        requestId: created.requestId,
        bookingReference: booking.bookingReference,
      },
    });
  } catch (err) {
    if (err instanceof BookingAccessError) {
      return Response.json({ ok: false, error: err.message, code: err.code }, { status: 404 });
    }
    reportServerError(err, { route: "flights-change-request-post", orderId });
    const mapped = mapDuffelErrorForClient(err);
    return Response.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}
