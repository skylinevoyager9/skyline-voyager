import { site } from "@/lib/site";
import { duffelRequest } from "@/lib/duffel/client";
import { assertDuffelReady } from "@/lib/duffel/config";

export const DUFFEL_WEBHOOK_EVENTS = [
  "order.airline_initiated_change_detected",
  "order.created",
  "order_cancellation.created",
  "order_cancellation.confirmed",
  "order.creation_failed",
] as const;

type WebhookRecord = {
  id: string;
  url: string;
  live_mode: boolean;
  active: boolean;
  events: string[];
};

type WebhookCreateResponse = {
  data: WebhookRecord & { secret: string };
};

type WebhookListResponse = {
  data: WebhookRecord[];
};

export function getDuffelWebhookPublicUrl(): string {
  const override = process.env.DUFFEL_WEBHOOK_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return `${site.url}/api/duffel/webhook`;
}

export async function listDuffelWebhooks(): Promise<WebhookRecord[]> {
  const json = await duffelRequest<WebhookListResponse>({
    path: "/air/webhooks",
    query: { limit: 50 },
  });
  return json.data ?? [];
}

export async function deleteDuffelWebhook(id: string): Promise<void> {
  await duffelRequest<unknown>({
    method: "DELETE",
    path: `/air/webhooks/${encodeURIComponent(id)}`,
  });
}

export async function createDuffelWebhook(): Promise<{
  endpointId: string;
  secret: string;
  url: string;
  liveMode: boolean;
}> {
  const { mode } = assertDuffelReady();
  const url = getDuffelWebhookPublicUrl();
  const json = await duffelRequest<WebhookCreateResponse>({
    method: "POST",
    path: "/air/webhooks",
    body: {
      data: {
        url,
        events: [...DUFFEL_WEBHOOK_EVENTS],
      },
    },
  });

  const data = json.data;
  if (!data?.secret || !data.id) {
    throw new Error("Duffel did not return webhook id/secret.");
  }

  return {
    endpointId: data.id,
    secret: data.secret,
    url: data.url,
    liveMode: data.live_mode ?? mode === "live",
  };
}

export async function pingDuffelWebhook(endpointId: string): Promise<void> {
  await duffelRequest<unknown>({
    method: "POST",
    path: `/air/webhooks/${encodeURIComponent(endpointId)}/actions/ping`,
    body: {},
  });
}

/** Duffel allows one webhook per live_mode; replace to obtain a fresh secret. */
export async function replaceDuffelWebhook(): Promise<{
  endpointId: string;
  secret: string;
  url: string;
  liveMode: boolean;
  deletedEndpointIds: string[];
}> {
  const { mode } = assertDuffelReady();
  const wantLive = mode === "live";
  const existing = await listDuffelWebhooks();
  const deletedEndpointIds: string[] = [];

  for (const hook of existing) {
    if (hook.live_mode !== wantLive) continue;
    await deleteDuffelWebhook(hook.id);
    deletedEndpointIds.push(hook.id);
  }

  const created = await createDuffelWebhook();
  return { ...created, deletedEndpointIds };
}
