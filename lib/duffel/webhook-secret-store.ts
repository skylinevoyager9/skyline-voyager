import { createHash } from "node:crypto";
import { normalizeDuffelWebhookSecret } from "@/lib/duffel/webhook-signature";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

/** Upstash key written by `/api/admin/duffel-webhook/sync`. */
export const DUFFEL_WEBHOOK_SECRET_KV_KEY = "sv:config:duffel_webhook_secret";
export const DUFFEL_WEBHOOK_SECRET_HISTORY_KV_KEY = "sv:config:duffel_webhook_secret_history";
export const DUFFEL_WEBHOOK_ENDPOINT_KV_KEY = "sv:config:duffel_webhook_endpoint_id";
export const DUFFEL_WEBHOOK_LAST_FAIL_KV_KEY = "sv:debug:duffel_webhook_last_fail";

function uniqueSecrets(secrets: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const secret of secrets) {
    const n = normalizeDuffelWebhookSecret(secret);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

async function readSecretHistory(): Promise<string[]> {
  if (!isRedisKvConfigured()) return [];
  const raw = await kvGet(DUFFEL_WEBHOOK_SECRET_HISTORY_KV_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

async function appendSecretHistory(secret: string): Promise<void> {
  const normalized = normalizeDuffelWebhookSecret(secret);
  if (!normalized || !isRedisKvConfigured()) return;
  const history = await readSecretHistory();
  const next = uniqueSecrets([normalized, ...history]).slice(0, 5);
  await kvSet(DUFFEL_WEBHOOK_SECRET_HISTORY_KV_KEY, JSON.stringify(next));
}

export function fingerprintDuffelWebhookSecret(secret: string): string {
  return createHash("sha256").update(normalizeDuffelWebhookSecret(secret)).digest("hex").slice(0, 12);
}

/** Secrets for verification — primary Upstash + recent history + optional Vercel env. */
export async function listDuffelWebhookSecrets(): Promise<string[]> {
  const candidates: string[] = [];

  if (isRedisKvConfigured()) {
    candidates.push((await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "");
    candidates.push(...(await readSecretHistory()));
  }

  candidates.push(process.env.DUFFEL_WEBHOOK_SECRET ?? "");
  return uniqueSecrets(candidates);
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
  await appendSecretHistory(normalized);
  const readBack = normalizeDuffelWebhookSecret(
    (await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "",
  );
  return { stored: true, roundTripOk: readBack === normalized };
}

export async function storeDuffelWebhookEndpointId(endpointId: string): Promise<boolean> {
  const id = endpointId.trim();
  if (!id || !isRedisKvConfigured()) return false;
  return kvSet(DUFFEL_WEBHOOK_ENDPOINT_KV_KEY, id);
}

export async function getStoredDuffelWebhookEndpointId(): Promise<string | null> {
  if (!isRedisKvConfigured()) return null;
  const id = (await kvGet(DUFFEL_WEBHOOK_ENDPOINT_KV_KEY))?.trim();
  return id || null;
}

export type DuffelWebhookLastFailure = {
  at: string;
  bodyLength: number;
  bodySha256: string;
  bodyLooksGzip?: boolean;
  bodyPreview?: string;
  contentEncoding?: string;
  hasSignature: boolean;
  signatureHeaderPreview?: string;
  signatureTimestamp?: string;
  secretFingerprint?: string;
  secretCount?: number;
  relevantHeaders?: Record<string, string>;
};

export async function recordDuffelWebhookFailure(
  entry: DuffelWebhookLastFailure,
): Promise<void> {
  if (!isRedisKvConfigured()) return;
  await kvSet(DUFFEL_WEBHOOK_LAST_FAIL_KV_KEY, JSON.stringify(entry));
}

export async function getDuffelWebhookLastFailure(): Promise<DuffelWebhookLastFailure | null> {
  if (!isRedisKvConfigured()) return null;
  const raw = await kvGet(DUFFEL_WEBHOOK_LAST_FAIL_KV_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DuffelWebhookLastFailure;
  } catch {
    return null;
  }
}

export async function getPrimaryDuffelWebhookSecret(): Promise<string | null> {
  const secrets = await listDuffelWebhookSecrets();
  return secrets[0] ?? null;
}
