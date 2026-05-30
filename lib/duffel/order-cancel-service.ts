import { duffelRequest } from "./client";

export type OrderCancellationQuote = {
  id: string;
  orderId: string;
  refundAmount: string | null;
  refundCurrency: string;
  refundTo: string;
  expiresAt: string | null;
  confirmedAt: string | null;
};

type DuffelOrderCancellation = {
  id?: string;
  order_id?: string;
  refund_amount?: string | null;
  refund_currency?: string | null;
  refund_to?: string;
  expires_at?: string | null;
  confirmed_at?: string | null;
};

function mapQuote(data: DuffelOrderCancellation): OrderCancellationQuote {
  if (!data.id) throw new Error("Duffel did not return a cancellation id.");
  return {
    id: data.id,
    orderId: data.order_id ?? "",
    refundAmount: data.refund_amount ?? null,
    refundCurrency: data.refund_currency ?? "USD",
    refundTo: data.refund_to ?? "unknown",
    expiresAt: data.expires_at ?? null,
    confirmedAt: data.confirmed_at ?? null,
  };
}

export async function createOrderCancellationQuote(
  orderId: string,
): Promise<OrderCancellationQuote> {
  const res = await duffelRequest<{ data?: DuffelOrderCancellation }>({
    method: "POST",
    path: "/air/order_cancellations",
    body: { data: { order_id: orderId } },
  });
  if (!res.data) throw new Error("Empty cancellation response from Duffel.");
  return mapQuote(res.data);
}

export async function getOrderCancellation(
  cancellationId: string,
): Promise<OrderCancellationQuote> {
  const res = await duffelRequest<{ data?: DuffelOrderCancellation }>({
    method: "GET",
    path: `/air/order_cancellations/${encodeURIComponent(cancellationId)}`,
  });
  if (!res.data) throw new Error("Cancellation not found.");
  return mapQuote(res.data);
}

export async function confirmOrderCancellation(
  cancellationId: string,
): Promise<OrderCancellationQuote> {
  const res = await duffelRequest<{ data?: DuffelOrderCancellation }>({
    method: "POST",
    path: `/air/order_cancellations/${encodeURIComponent(cancellationId)}/actions/confirm`,
  });
  if (!res.data) throw new Error("Confirm cancellation failed.");
  return mapQuote(res.data);
}
