import { timingSafeEqual } from "node:crypto";
import { isOwnerPricingKeyValid } from "@/lib/flights/owner-pricing";

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function getDuffelWebhookSetupKey(): string | undefined {
  return process.env.DUFFEL_WEBHOOK_SETUP_KEY?.trim() || undefined;
}

function bearerToken(req: Request): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return null;
}

/** Setup key or owner pricing key (for one-shot webhook repair). */
export function isDuffelWebhookSetupAuthorized(req: Request): boolean {
  const token = bearerToken(req);
  if (token && getDuffelWebhookSetupKey() && safeEqualString(token, getDuffelWebhookSetupKey()!)) {
    return true;
  }
  if (token && isOwnerPricingKeyValid(token)) return true;

  const setupHeader = req.headers.get("x-duffel-webhook-setup-key");
  if (setupHeader && getDuffelWebhookSetupKey()) {
    return safeEqualString(setupHeader.trim(), getDuffelWebhookSetupKey()!);
  }

  const ownerHeader = req.headers.get("x-owner-key");
  if (ownerHeader && isOwnerPricingKeyValid(ownerHeader)) return true;

  const url = new URL(req.url);
  const ownerQuery = url.searchParams.get("owner");
  if (ownerQuery && isOwnerPricingKeyValid(ownerQuery)) return true;

  return false;
}
