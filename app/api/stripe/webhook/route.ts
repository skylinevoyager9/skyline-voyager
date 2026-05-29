import { getStripe } from "@/lib/stripe/server";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ ok: false, error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ ok: false, error: "Missing signature." }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    reportServerError(err, { route: "stripe-webhook" });
    return Response.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.payment_failed") {
    reportServerError(new Error("Stripe payment failed"), {
      route: "stripe-webhook",
      paymentIntentId: (event.data.object as { id?: string }).id,
    });
  }

  return Response.json({ ok: true, received: true });
}
