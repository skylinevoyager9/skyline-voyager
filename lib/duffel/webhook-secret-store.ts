import { createHash } from "node:crypto";
import { normalizeDuffelWebhookSecret } from "@/lib/duffel/webhook-signature";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

/** Upstash key written by `/api/admin/duffel-webhook/sync`. */
export const DUFFEL_WEBHOOK_SECRET_KV_KEY = "sv:config:duffel_webhook_secret";

export function fingerprintDuffelWebhookSecret(secret: string): string {
  return createHash("sha256").update(normalizeDuffelWebhookSecret(secret)).digest("hex").slice(0, 12);
}

/** Secrets for verification — Upstash (auto-sync) wins over Vercel env when both exist. */
export async function listDuffelWebhookSecrets(): Promise<string[]> {
  if (isRedisKvConfigured()) {
    const kv = normalizeDuffelWebhookSecret(
      (await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "",
    );
    if (kv) return [kv];
  }

  const env = normalizeDuffelWebhookSecret(process.env.DUFFEL_WEBHOOK_SECRET ?? "");
  return env ? [env] : [];
}

export async function storeDuffelWebhookSecret(secret: string): Promise<{
  stored: boolean;
  roundTripOk: boolean;
}> {
  const normalized = normalizeDuffelWebhookSecret(secret);
  if (!normalized || !isRedisKvConfigured()) {
    return { stored: false, roundTripOk: false };
  }
  const stored = await kvSet(DUFFEL_WEBHOOK_SECRET_KV_KEY, normalized);
  if (!stored) return { stored: false, roundTripOk: false };
  const readBack = normalizeDuffelWebhookSecret(
    (await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "",
  );
  return { stored: true, roundTripOk: readBack === normalized };
}

export async function getPrimaryDuffelWebhookSecret(): Promise<string | null> {
  const secrets = await listDuffelWebhookSecrets();
  return secrets[0] ?? null;
}
