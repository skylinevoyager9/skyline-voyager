import { createHash } from "node:crypto";
import {
  duffelWebhookSecretLooksCorrupted,
  getDuffelSignatureHeader,
  parseDuffelSignatureHeader,
  verifyDuffelWebhookRequest,
} from "@/lib/duffel/webhook-signature";
import { handleDuffelWebhookEvent, type DuffelWebhookEvent } from "@/lib/duffel/webhook-events";
import {
  fingerprintDuffelWebhookSecret,
  listDuffelWebhookSecrets,
  recordDuffelWebhookFailure,
} from "@/lib/duffel/webhook-secret-store";
import { reportServerError } from "@/lib/observability/report-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function collectDuffelHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of req.headers.entries()) {
    const lower = key.toLowerCase();
    if (
      lower.startsWith("x-duffel") ||
      lower === "content-encoding" ||
      lower === "content-type" ||
      lower === "user-agent"
    ) {
      out[lower] = value;
    }
  }
  return out;
}

function bodyPreview(rawBody: Buffer): { bodyLooksGzip: boolean; bodyPreview?: string } {
  const bodyLooksGzip = rawBody.length >= 2 && rawBody[0] === 0x1f && rawBody[1] === 0x8b;
  if (bodyLooksGzip || rawBody.length === 0) {
    return { bodyLooksGzip };
  }
  return {
    bodyLooksGzip,
    bodyPreview: rawBody.toString("utf8").slice(0, 400),
  };
}

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
    const parsedSig = signature ? parseDuffelSignatureHeader(signature) : null;
    const bodySha256 = createHash("sha256").update(rawBody).digest("hex");
    const secretFingerprint = secrets[0]
      ? fingerprintDuffelWebhookSecret(secrets[0])
      : undefined;
    const preview = bodyPreview(rawBody);

    await recordDuffelWebhookFailure({
      at: new Date().toISOString(),
      bodyLength: rawBody.length,
      bodySha256,
      ...preview,
      contentEncoding: contentEncoding ?? undefined,
      hasSignature: Boolean(signature),
      signatureHeaderPreview: signature ? signature.slice(0, 80) : undefined,
      signatureTimestamp: parsedSig?.timestamp,
      secretFingerprint,
      secretCount: secrets.length,
      relevantHeaders: collectDuffelHeaders(req),
    });

    reportServerError(new Error("Duffel webhook signature mismatch"), {
      route: "duffel-webhook",
      bodyLength: rawBody.length,
      bodySha256: bodySha256.slice(0, 16),
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
          bodySha256: bodySha256.slice(0, 16),
          bodyLooksGzip: preview.bodyLooksGzip,
          contentEncoding,
          hasSignature: Boolean(signature),
          signatureTimestamp: parsedSig?.timestamp ?? null,
          secretCount: secrets.length,
          secretFingerprint,
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
