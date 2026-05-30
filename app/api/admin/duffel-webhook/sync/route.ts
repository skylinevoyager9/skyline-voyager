import { DuffelApiError } from "@/lib/duffel/client";
import { assertDuffelReady, DuffelConfigError } from "@/lib/duffel/config";
import { isDuffelWebhookSetupAuthorized } from "@/lib/duffel/webhook-auth";
import {
  getDuffelWebhookPublicUrl,
  pingDuffelWebhook,
  replaceDuffelWebhook,
} from "@/lib/duffel/webhook-admin-service";
import {
  fingerprintDuffelWebhookSecret,
  storeDuffelWebhookSecret,
} from "@/lib/duffel/webhook-secret-store";
import { isRedisKvConfigured } from "@/lib/storage/redis-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot: recreate Duffel webhook via API, store secret in Upstash, trigger ping.
 * Auth: `Authorization: Bearer <DUFFEL_WEBHOOK_SETUP_KEY>` (set in Vercel, then remove if desired).
 */
export async function POST(req: Request) {
  if (!isDuffelWebhookSetupAuthorized(req)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized. Set DUFFEL_WEBHOOK_SETUP_KEY and send Authorization: Bearer <key>.",
      },
      { status: 401 },
    );
  }

  try {
    assertDuffelReady();
  } catch (err) {
    const message = err instanceof DuffelConfigError ? err.message : "Duffel is not configured.";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }

  if (!isRedisKvConfigured()) {
    return Response.json(
      {
        ok: false,
        error:
          "Upstash is required for auto-sync. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Production, redeploy, then call this endpoint again.",
      },
      { status: 503 },
    );
  }

  try {
    const replaced = await replaceDuffelWebhook();
    const stored = await storeDuffelWebhookSecret(replaced.secret);
    if (!stored) {
      return Response.json({ ok: false, error: "Failed to store webhook secret in Upstash." }, { status: 500 });
    }

    await pingDuffelWebhook(replaced.endpointId);

    return Response.json({
      ok: true,
      message:
        "Webhook recreated, secret saved to Upstash, ping sent. Check Duffel delivery log for 200 within ~1 minute.",
      endpointId: replaced.endpointId,
      webhookUrl: replaced.url,
      liveMode: replaced.liveMode,
      deletedEndpointIds: replaced.deletedEndpointIds,
      secretFingerprint: fingerprintDuffelWebhookSecret(replaced.secret),
      storedInUpstash: true,
      hint:
        "Optional: set DUFFEL_WEBHOOK_SECRET in Vercel to the same value for backup, or rely on Upstash only. Remove DUFFEL_WEBHOOK_SETUP_KEY when done.",
    });
  } catch (err) {
    if (err instanceof DuffelApiError) {
      return Response.json(
        { ok: false, error: err.message, duffelStatus: err.status, duffelErrors: err.errors },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Sync failed.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    webhookUrl: getDuffelWebhookPublicUrl(),
    upstashConfigured: isRedisKvConfigured(),
    setupKeyConfigured: Boolean(process.env.DUFFEL_WEBHOOK_SETUP_KEY?.trim()),
    usage:
      "POST with Authorization: Bearer <DUFFEL_WEBHOOK_SETUP_KEY> to recreate webhook and store secret in Upstash.",
  });
}
