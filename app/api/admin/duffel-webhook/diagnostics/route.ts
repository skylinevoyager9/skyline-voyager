import { DuffelApiError, duffelRequest } from "@/lib/duffel/client";
import { assertDuffelReady, DuffelConfigError } from "@/lib/duffel/config";
import { isDuffelWebhookSetupAuthorized } from "@/lib/duffel/webhook-auth";
import { listDuffelWebhooks } from "@/lib/duffel/webhook-admin-service";
import {
  fingerprintDuffelWebhookSecret,
  getDuffelWebhookLastFailure,
  getStoredDuffelWebhookEndpointId,
  listDuffelWebhookSecrets,
} from "@/lib/duffel/webhook-secret-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeliveryRecord = {
  id: string;
  type: string;
  response_status_code: number;
  response_body: string;
  endpoint_id: string;
  created_at: string;
};

type DeliveryListResponse = {
  data: DeliveryRecord[];
};

/** Owner-only: compare Duffel dashboard vs Upstash and show last failed delivery. */
export async function GET(req: Request) {
  if (!isDuffelWebhookSetupAuthorized(req)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    assertDuffelReady();
  } catch (err) {
    const message = err instanceof DuffelConfigError ? err.message : "Duffel is not configured.";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }

  const [secrets, storedEndpointId, lastFailure, duffelWebhooks] = await Promise.all([
    listDuffelWebhookSecrets(),
    getStoredDuffelWebhookEndpointId(),
    getDuffelWebhookLastFailure(),
    listDuffelWebhooks().catch(() => []),
  ]);

  const fingerprints = secrets.map((secret) => fingerprintDuffelWebhookSecret(secret));
  const liveWebhooks = duffelWebhooks.filter((hook) => hook.live_mode);
  const storedHook = storedEndpointId
    ? duffelWebhooks.find((hook) => hook.id === storedEndpointId) ?? null
    : null;

  let deliveries: DeliveryRecord[] = [];
  const endpointForDeliveries = storedEndpointId ?? liveWebhooks[0]?.id;
  if (endpointForDeliveries) {
    try {
      const json = await duffelRequest<DeliveryListResponse>({
        path: "/air/webhooks/deliveries",
        query: { limit: 5, endpoint_id: endpointForDeliveries },
      });
      deliveries = json.data ?? [];
    } catch (err) {
      if (!(err instanceof DuffelApiError)) throw err;
    }
  }

  const endpointMismatch =
    Boolean(storedEndpointId) &&
    liveWebhooks.length > 0 &&
    !liveWebhooks.some((hook) => hook.id === storedEndpointId);

  return Response.json({
    ok: true,
    storedEndpointId,
    secretFingerprints: fingerprints,
    secretCount: secrets.length,
    duffelLiveWebhooks: liveWebhooks.map((hook) => ({
      id: hook.id,
      url: hook.url,
      active: hook.active,
      events: hook.events,
    })),
    storedHookFound: Boolean(storedHook),
    endpointMismatch,
    lastFailure,
    recentDeliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      type: delivery.type,
      status: delivery.response_status_code,
      responseBody: delivery.response_body?.slice(0, 500),
      createdAt: delivery.created_at,
    })),
    hint: endpointMismatch
      ? "Stored endpoint id does not match any live Duffel webhook. Run POST /api/admin/duffel-webhook/sync — do not recreate the webhook manually in Duffel."
      : "If ping still fails, check lastFailure.bodyPreview and recentDeliveries.responseBody.",
  });
}
