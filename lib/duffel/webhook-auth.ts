import { timingSafeEqual } from "node:crypto";

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function getDuffelWebhookSetupKey(): string | undefined {
  return process.env.DUFFEL_WEBHOOK_SETUP_KEY?.trim() || undefined;
}

export function isDuffelWebhookSetupAuthorized(req: Request): boolean {
  const expected = getDuffelWebhookSetupKey();
  if (!expected) return false;

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return safeEqualString(bearer.slice(7).trim(), expected);
  }

  const header = req.headers.get("x-duffel-webhook-setup-key");
  if (header) return safeEqualString(header.trim(), expected);

  return false;
}
