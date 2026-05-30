import { createHmac, timingSafeEqual } from "node:crypto";

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
  const signed = Buffer.from(`${timestamp}.`, "utf8");
  const local = createHmac("sha256", secret)
    .update(Buffer.concat([signed, payload]))
    .digest("hex");

  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(local, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
