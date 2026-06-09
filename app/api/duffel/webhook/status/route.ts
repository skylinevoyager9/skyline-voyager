import {
  duffelWebhookSecretLooksCorrupted,
  normalizeDuffelWebhookSecret,
} from "@/lib/duffel/webhook-signature";
import { fingerprintDuffelWebhookSecret, listDuffelWebhookSecrets } from "@/lib/duffel/webhook-secret-store";
import { getDuffelWebhookPublicUrl } from "@/lib/duffel/webhook-admin-service";
import { isRedisKvConfigured } from "@/lib/storage/redis-kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe check that webhook secret is configured (never exposes the secret). */
export async function GET() {
  const secrets = await listDuffelWebhookSecrets();
  const primary = secrets[0] ?? "";
  const envSecret = normalizeDuffelWebhookSecret(process.env.DUFFEL_WEBHOOK_SECRET ?? "");
  const fingerprints = secrets.map((s) => fingerprintDuffelWebhookSecret(s));

  return Response.json({
    ok: true,
    webhookUrl: getDuffelWebhookPublicUrl(),
    secretSources: {
      vercelEnv: Boolean(envSecret),
      upstash: isRedisKvConfigured(),
      count: secrets.length,
      fingerprintsMatch: fingerprints.length <= 1 || new Set(fingerprints).size === 1,
    },
    secretConfigured: secrets.length > 0,
    secretLength: primary.length,
    looksLikeUrl: /^https?:\/\//i.test(primary),
    looksLikeWebhookId: primary.startsWith("end_"),
    secretLooksCorrupted: secrets.some(duffelWebhookSecretLooksCorrupted),
    secretHasPlus: primary.includes("+"),
    secretContainsWhitespace: /\s/.test(primary),
    secretEndsWithEquals: primary.endsWith("=="),
    secretFingerprint: primary ? fingerprintDuffelWebhookSecret(primary) : null,
    secretFingerprints: fingerprints,
    autoSyncAvailable: isRedisKvConfigured() && Boolean(process.env.DUFFEL_WEBHOOK_SETUP_KEY?.trim()),
    hint: hintForStatus(secrets, primary, envSecret),
  });
}

function hintForStatus(secrets: string[], primary: string, envSecret: string): string {
  if (secrets.length === 0) {
    return "No secret. Set DUFFEL_WEBHOOK_SECRET in Vercel, or configure Upstash + DUFFEL_WEBHOOK_SETUP_KEY and POST /api/admin/duffel-webhook/sync.";
  }
  if (duffelWebhookSecretLooksCorrupted(primary)) {
    return "Secret contains spaces — re-paste from Duffel or run auto-sync.";
  }
  if (/^https?:\/\//i.test(primary)) {
    return "DUFFEL_WEBHOOK_SECRET is a URL. Use the secret string from Duffel, not the webhook URL.";
  }
  if (primary.startsWith("end_")) {
    return "You pasted the webhook id. Use the secret string from Duffel.";
  }
  if (isRedisKvConfigured() && envSecret && primary) {
    const envFp = fingerprintDuffelWebhookSecret(envSecret);
    const activeFp = fingerprintDuffelWebhookSecret(primary);
    if (envFp !== activeFp) {
      return "Upstash secret is active; Vercel DUFFEL_WEBHOOK_SECRET is stale — delete it. If ping fails, POST /api/admin/duffel-webhook/sync with OWNER_PRICING_KEY, then ping in Duffel.";
    }
  }
  if (isRedisKvConfigured() && !envSecret) {
    return "Using Upstash-stored secret only. If ping fails, POST /api/admin/duffel-webhook/sync with OWNER_PRICING_KEY.";
  }
  if (secrets.length > 1) {
    return "Two different secrets configured — delete DUFFEL_WEBHOOK_SECRET in Vercel or run auto-sync.";
  }
  return "Secret is set. If ping fails, POST /api/admin/duffel-webhook/sync with OWNER_PRICING_KEY.";
}
