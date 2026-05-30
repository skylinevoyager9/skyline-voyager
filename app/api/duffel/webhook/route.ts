import {
  duffelWebhookSecretLooksCorrupted,
  getDuffelSignatureHeader,
  verifyDuffelWebhookSignatureAny,
} from "@/lib/duffel/webhook-signature";
import { handleDuffelWebhookEvent, type DuffelWebhookEvent } from "@/lib/duffel/webhook-events";
import { listDuffelWebhookSecrets } from "@/lib/duffel/webhook-secret-store";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secrets = await listDuffelWebhookSecrets();
  if (secrets.length === 0) {
    return Response.json(
      {
        ok: false,
        error: "Duffel webhook not configured.",
        hint: "Set DUFFEL_WEBHOOK_SECRET in Vercel, or run POST /api/admin/duffel-webhook/sync with Upstash configured.",
      },
      { status: 503 },
    );
  }

  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = getDuffelSignatureHeader(req);

  if (!verifyDuffelWebhookSignatureAny(secrets, rawBody, signature)) {
    const corrupted = secrets.some(duffelWebhookSecretLooksCorrupted);
    reportServerError(new Error("Duffel webhook signature mismatch"), {
      route: "duffel-webhook",
      bodyLength: rawBody.length,
      hasSignature: Boolean(signature),
      secretCount: secrets.length,
      secretLooksCorrupted: corrupted,
    });
    return Response.json(
      {
        ok: false,
        error: "Invalid signature.",
        hint: corrupted
          ? "Secret may contain spaces instead of '+'. Re-paste or use POST /api/admin/duffel-webhook/sync."
          : "Secrets do not match this webhook. Use POST /api/admin/duffel-webhook/sync (with Upstash) or recreate in Duffel and update DUFFEL_WEBHOOK_SECRET, then redeploy.",
      },
      { status: 400 },
    );
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
