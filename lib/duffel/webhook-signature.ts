import { createHmac, timingSafeEqual } from "node:crypto";

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

function bodyCandidates(rawBody: Buffer): Buffer[] {
  const out: Buffer[] = [rawBody];
  if (rawBody.length > 0 && rawBody[rawBody.length - 1] === 0x0a) {
    out.push(rawBody.subarray(0, rawBody.length - 1));
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

  for (const payload of bodyCandidates(rawBody)) {
    if (verifyWithPayload(secret, parsed.timestamp, parsed.v1, payload)) return true;
  }
  return false;
}

/** Try each configured secret (env + Upstash) until one verifies. */
export function verifyDuffelWebhookSignatureAny(
  secrets: string[],
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  for (const secret of secrets) {
    if (verifyDuffelWebhookSignature(secret, rawBody, signatureHeader)) return true;
  }
  return false;
}

/** True if secret may have been corrupted when pasted (e.g. + → space). */
export function duffelWebhookSecretLooksCorrupted(secret: string): boolean {
  const n = normalizeDuffelWebhookSecret(secret);
  return /\s/.test(n) && /[A-Za-z0-9+/=]/.test(n);
}
