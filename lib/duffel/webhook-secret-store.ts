import { createHash } from "node:crypto";
import { normalizeDuffelWebhookSecret } from "@/lib/duffel/webhook-signature";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

/** Upstash key written by `/api/admin/duffel-webhook/sync`. */
export const DUFFEL_WEBHOOK_CONFIG_KV_KEY = "sv:config:duffel_webhook";
export const DUFFEL_WEBHOOK_SECRET_KV_KEY = "sv:config:duffel_webhook_secret";
export const DUFFEL_WEBHOOK_SECRET_HISTORY_KV_KEY = "sv:config:duffel_webhook_secret_history";
export const DUFFEL_WEBHOOK_ENDPOINT_KV_KEY = "sv:config:duffel_webhook_endpoint_id";
export const DUFFEL_WEBHOOK_LAST_FAIL_KV_KEY = "sv:debug:duffel_webhook_last_fail";

type StoredWebhookConfig = {
  secret: string;
  endpointId?: string;
  updatedAt: string;
};

async function readWebhookConfig(): Promise<StoredWebhookConfig | null> {
  if (!isRedisKvConfigured()) return null;
  const raw = await kvGet(DUFFEL_WEBHOOK_CONFIG_KV_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredWebhookConfig;
    if (!parsed?.secret) return null;
    return parsed;
  } catch {
    return null;
  }
}

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
    const config = await readWebhookConfig();
    if (config?.secret) candidates.push(config.secret);
    candidates.push((await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "");
    candidates.push(...(await readSecretHistory()));
  }

  candidates.push(process.env.DUFFEL_WEBHOOK_SECRET ?? "");
  return uniqueSecrets(candidates);
}

export async function storeDuffelWebhookConfig(
  secret: string,
  endpointId: string,
): Promise<{ stored: boolean; roundTripOk: boolean; endpointStored: boolean }> {
  const normalized = normalizeDuffelWebhookSecret(secret);
  const id = endpointId.trim();
  if (!normalized || !id || !isRedisKvConfigured()) {
    return { stored: false, roundTripOk: false, endpointStored: false };
  }

  const config: StoredWebhookConfig = {
    secret: normalized,
    endpointId: id,
    updatedAt: new Date().toISOString(),
  };
  const configJson = JSON.stringify(config);
  const [configStored, legacyStored, endpointStored] = await Promise.all([
    kvSet(DUFFEL_WEBHOOK_CONFIG_KV_KEY, configJson),
    kvSet(DUFFEL_WEBHOOK_SECRET_KV_KEY, normalized),
    kvSet(DUFFEL_WEBHOOK_ENDPOINT_KV_KEY, id),
  ]);

  if (!configStored || !legacyStored) {
    return { stored: false, roundTripOk: false, endpointStored };
  }

  await appendSecretHistory(normalized);
  const readBack = normalizeDuffelWebhookSecret(
    (await readWebhookConfig())?.secret ?? (await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "",
  );
  return {
    stored: true,
    roundTripOk: readBack === normalized,
    endpointStored,
  };
}

export async function storeDuffelWebhookSecret(secret: string): Promise<{
  stored: boolean;
  roundTripOk: boolean;
}> {
  const normalized = normalizeDuffelWebhookSecret(secret);
  if (!normalized || !isRedisKvConfigured()) {
    return { stored: false, roundTripOk: false };
  }
  const existingEndpoint = (await getStoredDuffelWebhookEndpointId()) ?? "";
  if (existingEndpoint) {
    const result = await storeDuffelWebhookConfig(normalized, existingEndpoint);
    return { stored: result.stored, roundTripOk: result.roundTripOk };
  }
  const stored = await kvSet(DUFFEL_WEBHOOK_SECRET_KV_KEY, normalized);
  if (!stored) return { stored: false, roundTripOk: false };
  await appendSecretHistory(normalized);
  const readBack = normalizeDuffelWebhookSecret((await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "");
  return { stored: true, roundTripOk: readBack === normalized };
}

export async function storeDuffelWebhookEndpointId(endpointId: string): Promise<boolean> {
  const secret = (await readWebhookConfig())?.secret ?? (await kvGet(DUFFEL_WEBHOOK_SECRET_KV_KEY)) ?? "";
  if (!secret) return false;
  const result = await storeDuffelWebhookConfig(secret, endpointId);
  return result.endpointStored;
}

export async function getStoredDuffelWebhookEndpointId(): Promise<string | null> {
  if (!isRedisKvConfigured()) return null;
  const fromConfig = (await readWebhookConfig())?.endpointId?.trim();
  if (fromConfig) return fromConfig;
  const id = (await kvGet(DUFFEL_WEBHOOK_ENDPOINT_KV_KEY))?.trim();
  return id || null;
}

export type DuffelWebhookLastFailure = {
  at: string;
  bodyLength: number;
  bodySha256: string;
  bodyLooksGzip?: boolean;
  bodyPreview?: string;
  bodyBase64?: string;
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
