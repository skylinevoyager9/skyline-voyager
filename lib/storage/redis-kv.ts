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

export async function kvGet(key: string): Promise<string | null> {
  const cfg = restConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: string | null };
  return json.result ?? null;
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  const cfg = restConfig();
  if (!cfg) return false;
  const res = await fetch(
    `${cfg.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
    },
  );
  return res.ok;
}

export async function kvLpush(key: string, value: string): Promise<boolean> {
  const cfg = restConfig();
  if (!cfg) return false;
  const res = await fetch(`${cfg.url}/lpush/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  return res.ok;
}

export async function kvLrange(key: string, start: number, end: number): Promise<string[]> {
  const cfg = restConfig();
  if (!cfg) return [];
  const res = await fetch(
    `${cfg.url}/lrange/${encodeURIComponent(key)}/${start}/${end}`,
    { headers: { Authorization: `Bearer ${cfg.token}` }, cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { result?: string[] };
  return json.result ?? [];
}
