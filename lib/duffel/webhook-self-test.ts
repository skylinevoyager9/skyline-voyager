import { createHmac } from "node:crypto";
import { getDuffelWebhookPublicUrl } from "@/lib/duffel/webhook-admin-service";
import { listDuffelWebhookSecrets } from "@/lib/duffel/webhook-secret-store";
import { duffelEventJsonVariants } from "@/lib/duffel/webhook-signature";

function signBody(secret: string, timestamp: string, body: Buffer): string {
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), body]);
  return createHmac("sha256", Buffer.from(secret, "utf8")).update(signed).digest("hex");
}

export async function postSignedWebhook(
  body: Buffer,
  secret: string,
): Promise<{ status: number; response: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = `t=${timestamp},v1=${signBody(secret, timestamp, body)}`;
  const res = await fetch(getDuffelWebhookPublicUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Duffel-Signature": signature,
    },
    body: new Uint8Array(body),
    cache: "no-store",
  });
  return { status: res.status, response: (await res.text()).slice(0, 300) };
}

/** POST to our webhook using the Upstash secret (validates secret + handler). */
export async function selfTestDuffelWebhookFromStore(
  body?: Buffer,
): Promise<{
  ok: boolean;
  status: number;
  response: string;
  bodyLength: number;
  secretFingerprint?: string;
}> {
  const secrets = await listDuffelWebhookSecrets();
  const secret = secrets[0];
  if (!secret) {
    return { ok: false, status: 0, response: "No webhook secret configured.", bodyLength: 0 };
  }

  const payload =
    body ??
    Buffer.from(
      JSON.stringify({
        type: "ping.triggered",
        api_version: "v2",
        live_mode: true,
        data: { object: {} },
      }),
      "utf8",
    );

  const result = await postSignedWebhook(payload, secret);
  return {
    ok: result.status >= 200 && result.status < 300,
    status: result.status,
    response: result.response,
    bodyLength: payload.length,
  };
}

export { duffelEventJsonVariants as duffelPingBodyCandidates };
