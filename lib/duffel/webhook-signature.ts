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

function computeV1Hex(key: Buffer, timestamp: string, payload: Buffer): string {
  const signed = Buffer.from(`${timestamp}.`, "utf8");
  return createHmac("sha256", key)
    .update(Buffer.concat([signed, payload]))
    .digest("hex");
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

  try {
    const expected = Buffer.from(v1, "hex");
    for (const key of secretKeyCandidates(secret)) {
      const localHex = computeV1Hex(key, timestamp, payload);
      const local = Buffer.from(localHex, "hex");
      if (expected.length === local.length && timingSafeEqual(expected, local)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
