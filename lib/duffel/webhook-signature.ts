import { createHmac, timingSafeEqual } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

/** Normalize secret pasted from Duffel / Vercel (trim, strip quotes). */
export function normalizeDuffelWebhookSecret(secret: string): string {
  return secret.trim().replace(/^["']|["']$/g, "");
}

function parseSignatureHeader(signatureHeader: string): { timestamp: string; v1: string } | null {
  let timestamp = "";
  let v1 = "";
  for (const part of signatureHeader.split(",")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === "t") timestamp = value;
    if (key === "v1") v1 = value;
  }
  if (!timestamp || !v1) return null;
  return { timestamp, v1 };
}

/**
 * Duffel docs: `secret = b"<webhook-secret>"` — HMAC key is the literal secret bytes (UTF-8).
 * @see https://duffel.com/docs/guides/receiving-webhooks
 */
function secretKeyCandidates(secret: string): Buffer[] {
  const normalized = normalizeDuffelWebhookSecret(
    secret.replace(/[\u200B-\u200D\uFEFF]/g, ""),
  );
  if (!normalized) return [];

  const keys: Buffer[] = [Buffer.from(normalized, "utf8")];

  // Pasting into some UIs turns '+' into space — try fixing that.
  if (normalized.includes(" ") && /^[A-Za-z0-9+/= ]+$/.test(normalized)) {
    const fixed = normalized.replace(/ /g, "+");
    keys.push(Buffer.from(fixed, "utf8"));
  }

  if (/^[A-Za-z0-9+/]+=*$/.test(normalized)) {
    try {
      const decoded = Buffer.from(normalized, "base64");
      if (decoded.length > 0) keys.push(decoded);
    } catch {
      /* ignore */
    }
  }

  return keys;
}

export function getDuffelSignatureHeader(req: Request): string | null {
  return (
    req.headers.get("X-Duffel-Signature") ??
    req.headers.get("x-duffel-signature") ??
    req.headers.get("Duffel-Signature")
  );
}

function signedPayload(timestamp: string, payload: Buffer): Buffer {
  return Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), payload]);
}

function computeV1Hex(key: Buffer, timestamp: string, payload: Buffer): string {
  return createHmac("sha256", key).update(signedPayload(timestamp, payload)).digest("hex");
}

function hexEqual(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al.length !== bl.length || al.length % 2 !== 0) return false;
  try {
    return timingSafeEqual(Buffer.from(al, "hex"), Buffer.from(bl, "hex"));
  } catch {
    return false;
  }
}

function isGzipBytes(buf: Buffer): boolean {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

/** Raw body variants (gzip / trailing newline) — Duffel signs exact bytes sent on the wire. */
export function duffelWebhookBodyCandidates(
  rawBody: Buffer,
  contentEncoding: string | null,
): Buffer[] {
  const seen = new Set<string>();
  const out: Buffer[] = [];
  const add = (buf: Buffer) => {
    if (buf.length === 0) return;
    const key = buf.toString("base64");
    if (seen.has(key)) return;
    seen.add(key);
    out.push(buf);
  };

  add(rawBody);
  if (rawBody.length > 0 && rawBody[rawBody.length - 1] === 0x0a) {
    add(rawBody.subarray(0, rawBody.length - 1));
  }

  try {
    const text = rawBody.toString("utf8");
    const reparsed = Buffer.from(JSON.stringify(JSON.parse(text)), "utf8");
    if (!reparsed.equals(rawBody)) add(reparsed);
  } catch {
    /* not JSON */
  }

  const ce = contentEncoding?.toLowerCase() ?? "";
  const treatAsGzip = ce.includes("gzip") || isGzipBytes(rawBody);

  if (treatAsGzip) {
    try {
      add(gunzipSync(rawBody));
    } catch {
      /* not gzip or already plain */
    }
    try {
      add(gzipSync(rawBody));
    } catch {
      /* ignore */
    }
  }

  return out;
}

function verifyWithPayload(
  secret: string,
  timestamp: string,
  v1: string,
  payload: Buffer,
): boolean {
  for (const key of secretKeyCandidates(secret)) {
    if (hexEqual(v1, computeV1Hex(key, timestamp, payload))) return true;
  }
  return false;
}

/** Verify Duffel `X-Duffel-Signature` header (t=timestamp,v1=hex). */
export function verifyDuffelWebhookSignature(
  secret: string,
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader?.trim() || !secret.trim()) return false;

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  for (const payload of duffelWebhookBodyCandidates(rawBody, null)) {
    if (verifyWithPayload(secret, parsed.timestamp, parsed.v1, payload)) return true;
  }
  return false;
}

/** Try each secret and body variant; returns the body buffer that verified. */
export function verifyDuffelWebhookRequest(
  secrets: string[],
  rawBody: Buffer,
  signatureHeader: string | null,
  contentEncoding: string | null,
): Buffer | null {
  if (!signatureHeader?.trim() || secrets.length === 0) return null;

  const bodies = duffelWebhookBodyCandidates(rawBody, contentEncoding);
  for (const body of bodies) {
    for (const secret of secrets) {
      if (!verifyDuffelWebhookSignature(secret, body, signatureHeader)) continue;
      if (isGzipBytes(body)) {
        try {
          return gunzipSync(body);
        } catch {
          /* fall through */
        }
      }
      return body;
    }
  }
  return null;
}

/** Try each configured secret (env + Upstash) until one verifies. */
export function verifyDuffelWebhookSignatureAny(
  secrets: string[],
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  return verifyDuffelWebhookRequest(secrets, rawBody, signatureHeader, null) !== null;
}

/** True if secret may have been corrupted when pasted (e.g. + → space). */
export function duffelWebhookSecretLooksCorrupted(secret: string): boolean {
  const n = normalizeDuffelWebhookSecret(secret);
  return /\s/.test(n) && /[A-Za-z0-9+/=]/.test(n);
}
