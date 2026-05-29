/** Server-only Duffel configuration (never import from client components). */

const DEFAULT_VERSION = "v2";
const DEFAULT_MODE = "test";

export function getDuffelApiToken(): string | undefined {
  return process.env.DUFFEL_API_TOKEN?.trim() || undefined;
}

export function getDuffelVersion(): string {
  return process.env.DUFFEL_VERSION?.trim() || DEFAULT_VERSION;
}

export function getDuffelMode(): "test" | "live" {
  const mode = (process.env.DUFFEL_MODE?.trim() || DEFAULT_MODE).toLowerCase();
  return mode === "live" ? "live" : "test";
}

export function isDuffelConfigured(): boolean {
  return Boolean(getDuffelApiToken());
}

/** Reject obvious misconfiguration before calling the API. */
export function assertDuffelReady(): { token: string; version: string; mode: "test" | "live" } {
  const token = getDuffelApiToken();
  if (!token) {
    throw new DuffelConfigError("not_configured", "Duffel API token is not configured.");
  }

  const mode = getDuffelMode();
  if (mode === "test" && !token.startsWith("duffel_test_")) {
    throw new DuffelConfigError(
      "invalid_token_mode",
      "DUFFEL_MODE is test but the token does not start with duffel_test_.",
    );
  }
  if (mode === "live" && !token.startsWith("duffel_live_")) {
    throw new DuffelConfigError(
      "invalid_token_mode",
      "DUFFEL_MODE is live but the token does not start with duffel_live_.",
    );
  }

  return { token, version: getDuffelVersion(), mode };
}

export class DuffelConfigError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DuffelConfigError";
  }
}
