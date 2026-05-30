import {
  duffelWebhookSecretLooksCorrupted,
  getDuffelSignatureHeader,
  verifyDuffelWebhookRequest,
} from "@/lib/duffel/webhook-signature";
import { handleDuffelWebhookEvent, type DuffelWebhookEvent } from "@/lib/duffel/webhook-events";
import {
  fingerprintDuffelWebhookSecret,
  listDuffelWebhookSecrets,
} from "@/lib/duffel/webhook-secret-store";
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
  const contentEncoding = req.headers.get("content-encoding");

  const verifiedBody = verifyDuffelWebhookRequest(
    secrets,
    rawBody,
    signature,
    contentEncoding,
  );

  if (!verifiedBody) {
    const corrupted = secrets.some(duffelWebhookSecretLooksCorrupted);
    reportServerError(new Error("Duffel webhook signature mismatch"), {
      route: "duffel-webhook",
      bodyLength: rawBody.length,
      contentEncoding: contentEncoding ?? undefined,
      hasSignature: Boolean(signature),
      secretCount: secrets.length,
      secretFingerprints: secrets.map(fingerprintDuffelWebhookSecret).join(","),
      secretLooksCorrupted: corrupted,
      bodyLooksGzip: rawBody.length >= 2 && rawBody[0] === 0x1f && rawBody[1] === 0x8b,
    });
    return Response.json(
      {
        ok: false,
        error: "Invalid signature.",
        hint: corrupted
          ? "Secret may contain spaces instead of '+'. Re-paste or use POST /api/admin/duffel-webhook/sync."
          : "Run POST /api/admin/duffel-webhook/sync again, or remove duplicate DUFFEL_WEBHOOK_SECRET if it differs from Upstash.",
        debug: {
          bodyLength: rawBody.length,
          contentEncoding,
          secretCount: secrets.length,
        },
      },
      { status: 400 },
    );
  }

  let event: DuffelWebhookEvent;
  try {
    event = JSON.parse(verifiedBody.toString("utf8")) as DuffelWebhookEvent;
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
