import { createHash } from "node:crypto";
import { normalizeDuffelWebhookSecret } from "@/lib/duffel/webhook-signature";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

/** Upstash key written by `/api/admin/duffel-webhook/sync`. */
export const DUFFEL_WEBHOOK_SECRET_KV_KEY = "sv:config:duffel_webhook_secret";

export function fingerprintDuffelWebhookSecret(secret: string): string {
  return createHash("sha256").update(normalizeDuffelWebhookSecret(secret)).digest("hex").slice(0, 12);
}

/** All secrets to try when verifying (env + KV, deduped). */
export async function listDuffelWebhookSecrets(): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string | null | undefined) => {
    const n = normalizeDuffelWebhookSecret(raw ?? "");
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };

  // Upstash (from auto-sync) is authoritative — try before stale Vercel env.
  if (isRedisKvConfigured()) {
    add(await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY));
  }
  add(process.env.DUFFEL_WEBHOOK_SECRET);

  return out;
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
