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
  storeDuffelWebhookEndpointId,
} from "@/lib/duffel/webhook-secret-store";
import { isRedisKvConfigured } from "@/lib/storage/redis-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function pingDuffelWebhookWithRetries(
  endpointId: string,
  attempts = 4,
  delayMs = 2000,
): Promise<{ ok: boolean; attempts: number; lastStatus?: number }> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    try {
      await pingDuffelWebhook(endpointId);
      return { ok: true, attempts: attempt };
    } catch (err) {
      if (!(err instanceof DuffelApiError) || err.status !== 422 || attempt === attempts) {
        throw err;
      }
    }
  }
  return { ok: false, attempts, lastStatus: 422 };
}

/**
 * One-shot: recreate Duffel webhook via API, store secret in Upstash, trigger ping.
 * Auth: `Authorization: Bearer <DUFFEL_WEBHOOK_SETUP_KEY>` (set in Vercel, then remove if desired).
 */
export async function POST(req: Request) {
  if (!isDuffelWebhookSetupAuthorized(req)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized. Send Authorization: Bearer <DUFFEL_WEBHOOK_SETUP_KEY or OWNER_PRICING_KEY>.",
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

    await storeDuffelWebhookEndpointId(replaced.endpointId);

    const fingerprint = fingerprintDuffelWebhookSecret(replaced.secret);
    const base = {
      endpointId: replaced.endpointId,
      webhookUrl: replaced.url,
      liveMode: replaced.liveMode,
      deletedEndpointIds: replaced.deletedEndpointIds,
      secretFingerprint: fingerprint,
      storedInUpstash: true,
      /** For debugging only — secret is already in Upstash; do not paste into Vercel env. */
      duffelWebhookSecret: replaced.secret,
    };

    try {
      const ping = await pingDuffelWebhookWithRetries(replaced.endpointId);
      return Response.json({
        ok: true,
        message:
          "Webhook recreated, secret saved to Upstash, ping succeeded. Check Duffel delivery log for 200.",
        pingAttempts: ping.attempts,
        ...base,
        hint: "Secret lives in Upstash only — keep DUFFEL_WEBHOOK_SECRET unset in Vercel.",
      });
    } catch (pingErr) {
      if (pingErr instanceof DuffelApiError && pingErr.status === 422) {
        return Response.json({
          ok: true,
          partial: true,
          pingFailed: true,
          message:
            "Webhook created and secret saved to Upstash. Auto-ping got a non-200 (often a short timing race). Ping manually in Duffel — the endpoint should work once Upstash is warm.",
          ...base,
          duffelStatus: pingErr.status,
          hint:
            "1) Do not set DUFFEL_WEBHOOK_SECRET in Vercel. 2) Duffel → Developers → Webhooks → Ping on endpoint " +
            replaced.endpointId +
            ". 3) Confirm https://skylinevoyager.com/api/duffel/webhook/status shows the same secretFingerprint.",
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
