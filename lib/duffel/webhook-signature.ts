import { createHmac, timingSafeEqual } from "node:crypto";

/** Normalize secret pasted from Duffel / Vercel (trim, strip quotes). */
export function normalizeDuffelWebhookSecret(secret: string): string {
  return secret.trim().replace(/^["']|["']$/g, "");
}

/** Duffel docs use the secret string as UTF-8 key; some setups use base64-decoded bytes. */
function secretKeyCandidates(secret: string): Buffer[] {
  const normalized = normalizeDuffelWebhookSecret(secret);
  if (!normalized) return [];

  const keys: Buffer[] = [Buffer.from(normalized, "utf8")];
  if (/^[A-Za-z0-9+/]+=*$/.test(normalized)) {
    try {
      const decoded = Buffer.from(normalized, "base64");
      if (decoded.length > 0 && !keys.some((k) => k.equals(decoded))) {
        keys.push(decoded);
      }
    } catch {
      /* ignore */
    }
  }
  return keys;
}

function signedPayload(timestamp: string, payload: Buffer): Buffer {
  return Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), payload]);
}

function computeV1Hex(key: Buffer | string, timestamp: string, payload: Buffer): string {
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

/** Verify Duffel `X-Duffel-Signature` header (t=timestamp,v1=hex). */
export function verifyDuffelWebhookSignature(
  secret: string,
  rawBody: Buffer | string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader?.trim() || !secret.trim()) return false;

  const pairs = signatureHeader.split(",").map((part) => part.trim().split("="));
  let timestamp = "";
  let v1 = "";
  for (const pair of pairs) {
    if (pair.length !== 2) continue;
    if (pair[0] === "t") timestamp = pair[1] ?? "";
    if (pair[0] === "v1") v1 = pair[1] ?? "";
  }
  if (!timestamp || !v1) return false;

  const payload = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;

  const normalized = normalizeDuffelWebhookSecret(secret);
  if (hexEqual(v1, computeV1Hex(normalized, timestamp, payload))) return true;

  for (const key of secretKeyCandidates(secret)) {
    if (hexEqual(v1, computeV1Hex(key, timestamp, payload))) return true;
  }
  return false;
}
