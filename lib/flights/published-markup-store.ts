import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { clampMarkupPercent, getFlightMarkupPolicy } from "@/lib/duffel/pricing";
import { isRedisKvConfigured, kvGet, kvSet } from "@/lib/storage/redis-kv";

export type PublishedMarkupRecord = {
  percent: number;
  updatedAt: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "published-flight-markup.json");
const REDIS_KEY = "sv:published-markup";

let cache: { record: PublishedMarkupRecord; at: number } | null = null;

function envFallbackPercent(): number {
  return getFlightMarkupPolicy().defaultPercent;
}

async function readRedisRecord(): Promise<PublishedMarkupRecord | null> {
  if (!isRedisKvConfigured()) return null;
  const raw = await kvGet(REDIS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { percent?: unknown; updatedAt?: unknown };
    if (typeof parsed.percent !== "number" || !Number.isFinite(parsed.percent)) return null;
    return {
      percent: clampMarkupPercent(parsed.percent),
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function readFileRecord(): Promise<PublishedMarkupRecord | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as { percent?: unknown; updatedAt?: unknown };
    if (typeof parsed.percent !== "number" || !Number.isFinite(parsed.percent)) return null;
    return {
      percent: clampMarkupPercent(parsed.percent),
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Live service fee % for every guest (search, checkout, book). */
export async function getPublishedFlightMarkupPercent(): Promise<number> {
  if (cache && Date.now() - cache.at < 2_000) {
    return cache.record.percent;
  }

  const fromStore = (await readRedisRecord()) ?? (await readFileRecord());
  const record: PublishedMarkupRecord = fromStore ?? {
    percent: envFallbackPercent(),
    updatedAt: "",
  };

  cache = { record, at: Date.now() };
  return record.percent;
}

export async function getPublishedMarkupRecord(): Promise<
  PublishedMarkupRecord & { fromFile: boolean }
> {
  const fromRedis = await readRedisRecord();
  if (fromRedis) {
    cache = { record: fromRedis, at: Date.now() };
    return { ...fromRedis, fromFile: false };
  }
  const fromFile = await readFileRecord();
  if (fromFile) {
    cache = { record: fromFile, at: Date.now() };
    return { ...fromFile, fromFile: true };
  }
  return {
    percent: envFallbackPercent(),
    updatedAt: "",
    fromFile: false,
  };
}

/** Owner-only: set the fee every customer pays until changed again. */
export async function setPublishedFlightMarkupPercent(
  percent: number,
): Promise<PublishedMarkupRecord> {
  const record: PublishedMarkupRecord = {
    percent: clampMarkupPercent(percent),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisKvConfigured()) {
    const saved = await kvSet(REDIS_KEY, JSON.stringify(record));
    if (saved) {
      cache = { record, at: Date.now() };
      return record;
    }
  }

  try {
    await mkdir(path.dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    cache = { record, at: Date.now() };
    return record;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save published fee.";
    throw new Error(
      `Could not save published service fee (${message}). On Vercel, update FLIGHT_MARKUP_PERCENT in project settings, or run the site on a host with a writable data/ folder.`,
    );
  }
}

export function clearPublishedMarkupCache(): void {
  cache = null;
}
