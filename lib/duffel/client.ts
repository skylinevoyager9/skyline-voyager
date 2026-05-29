import { assertDuffelReady } from "./config";

const DUFFEL_API_BASE = "https://api.duffel.com";

export type DuffelApiErrorItem = {
  type?: string;
  title?: string;
  message?: string;
  code?: string;
};

export class DuffelApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: DuffelApiErrorItem[],
    message?: string,
  ) {
    super(message ?? errors[0]?.message ?? `Duffel API error (${status})`);
    this.name = "DuffelApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export async function duffelRequest<T>({
  method = "GET",
  path,
  query,
  body,
}: RequestOptions): Promise<T> {
  const { token, version } = assertDuffelReady();

  const url = new URL(`${DUFFEL_API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Duffel-Version": version,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errors = extractDuffelErrors(json);
    throw new DuffelApiError(res.status, errors, errors[0]?.message);
  }

  return json as T;
}

function extractDuffelErrors(json: unknown): DuffelApiErrorItem[] {
  if (!json || typeof json !== "object") return [];
  const errors = (json as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];
  return errors.filter((e): e is DuffelApiErrorItem => typeof e === "object" && e !== null);
}
