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
    const { stored, roundTripOk } = await storeDuffelWebhookSecret(replaced.secret);
    if (!stored) {
      return Response.json({ ok: false, error: "Failed to store webhook secret in Upstash." }, { status: 500 });
    }
    if (!roundTripOk) {
      return Response.json(
        {
          ok: false,
          error: "Upstash round-trip failed — secret read back does not match. Check Upstash credentials.",
        },
        { status: 500 },
      );
    }

    const fingerprint = fingerprintDuffelWebhookSecret(replaced.secret);
    const base = {
      endpointId: replaced.endpointId,
      webhookUrl: replaced.url,
      liveMode: replaced.liveMode,
      deletedEndpointIds: replaced.deletedEndpointIds,
      secretFingerprint: fingerprint,
      storedInUpstash: true,
      /** Paste into Vercel DUFFEL_WEBHOOK_SECRET if ping still fails (remove any old/wrong value first). */
      duffelWebhookSecret: replaced.secret,
    };

    try {
      await pingDuffelWebhook(replaced.endpointId);
      return Response.json({
        ok: true,
        message:
          "Webhook recreated, secret saved to Upstash, ping sent. Check Duffel delivery log for 200.",
        ...base,
        hint: "Remove DUFFEL_WEBHOOK_SETUP_KEY from Vercel when done. You may remove duffelWebhookSecret from logs after saving to Vercel.",
      });
    } catch (pingErr) {
      if (pingErr instanceof DuffelApiError && pingErr.status === 422) {
        return Response.json({
          ok: true,
          partial: true,
          pingFailed: true,
          message:
            "Webhook created and secret saved, but Duffel ping got a non-200 from your server. Update Vercel DUFFEL_WEBHOOK_SECRET using duffelWebhookSecret below, redeploy, then ping again in Duffel.",
          ...base,
          duffelStatus: pingErr.status,
          hint:
            "1) Delete or replace DUFFEL_WEBHOOK_SECRET in Vercel with duffelWebhookSecret from this response. 2) Redeploy Production. 3) Duffel → Webhooks → Ping.",
        });
      }
      throw pingErr;
    }
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
