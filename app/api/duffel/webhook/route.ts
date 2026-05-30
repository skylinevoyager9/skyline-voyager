import {
  normalizeDuffelWebhookSecret,
  verifyDuffelWebhookSignature,
} from "@/lib/duffel/webhook-signature";
import { handleDuffelWebhookEvent, type DuffelWebhookEvent } from "@/lib/duffel/webhook-events";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = normalizeDuffelWebhookSecret(process.env.DUFFEL_WEBHOOK_SECRET ?? "");
  if (!secret) {
    return Response.json({ ok: false, error: "Duffel webhook not configured." }, { status: 503 });
  }

  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("X-Duffel-Signature");

  if (!verifyDuffelWebhookSignature(secret, rawBody, signature)) {
    return Response.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  let event: DuffelWebhookEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8")) as DuffelWebhookEvent;
  } catch (err) {
    reportServerError(err, { route: "duffel-webhook" });
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  try {
    await handleDuffelWebhookEvent(event);
  } catch (err) {
    reportServerError(err, { route: "duffel-webhook", eventType: event.type });
  }

  return Response.json({ ok: true, received: true });
}
