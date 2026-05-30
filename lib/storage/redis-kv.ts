/**
 * Optional Upstash Redis REST (works on Vercel). Falls back to null when unset.
 * https://upstash.com/docs/redis/features/restapi
 */

function restConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isRedisKvConfigured(): boolean {
  return restConfig() != null;
}

/** Run a Redis command via Upstash REST (avoids URL-encoding corrupting secret values). */
async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const cfg = restConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) return null;
  return json.result ?? null;
}

export async function kvGet(key: string): Promise<string | null> {
  const result = await kvCommand(["GET", key]);
  if (result === null || result === undefined) return null;
  return typeof result === "string" ? result : String(result);
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  const result = await kvCommand(["SET", key, value]);
  return result === "OK" || result === "ok" || result === true;
}

export async function kvLpush(key: string, value: string): Promise<boolean> {
  const result = await kvCommand(["LPUSH", key, value]);
  return typeof result === "number" && result >= 0;
}

export async function kvLrange(key: string, start: number, end: number): Promise<string[]> {
  const result = await kvCommand(["LRANGE", key, start, end]);
  if (!Array.isArray(result)) return [];
  return result.map((item) => (typeof item === "string" ? item : String(item)));
}
