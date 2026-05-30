import { normalizeDuffelWebhookSecret } from "@/lib/duffel/webhook-signature";

export const runtime = "nodejs";

/** Safe check that webhook secret is configured (never exposes the secret). */
export async function GET() {
  const raw = process.env.DUFFEL_WEBHOOK_SECRET ?? "";
  const secret = normalizeDuffelWebhookSecret(raw);

  return Response.json({
    ok: true,
    secretConfigured: Boolean(secret),
    secretLength: secret.length,
    /** Common mistake: pasting the webhook URL instead of the secret. */
    looksLikeUrl: /^https?:\/\//i.test(secret),
    /** Common mistake: pasting webhook id (end_…) from the ping curl command. */
    looksLikeWebhookId: secret.startsWith("end_"),
    hint: secret
      ? looksHealthy(secret)
        ? "Secret is set. If ping fails with Invalid signature, recreate the webhook in Duffel and paste the new secret, then redeploy."
        : "Secret value looks wrong — use the secret string from Duffel (often ends with ==), not the URL or end_… id."
      : "Add DUFFEL_WEBHOOK_SECRET in Vercel (Production), then redeploy.",
  });
}

function looksHealthy(secret: string): boolean {
  if (/^https?:\/\//i.test(secret)) return false;
  if (secret.startsWith("end_")) return false;
  return secret.length >= 16;
}
