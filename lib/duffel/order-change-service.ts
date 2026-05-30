import { duffelRequest } from "./client";

type DuffelPlace = { iata_code?: string };
type DuffelSegment = {
  departing_at?: string;
  passengers?: { cabin_class?: string }[];
};
type DuffelSlice = {
  id?: string;
  origin?: DuffelPlace;
  destination?: DuffelPlace;
  segments?: DuffelSegment[];
};
type DuffelOrderData = {
  id?: string;
  booking_reference?: string;
  available_actions?: string[];
  cancelled_at?: string | null;
  void_window_ends_at?: string | null;
  slices?: DuffelSlice[];
};

export type ManageOrderSlice = {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
  cabinClass: string;
  label: string;
};

export type ManageOrder = {
  orderId: string;
  bookingReference: string;
  availableActions: string[];
  canChange: boolean;
  canCancel: boolean;
  voidWindowEndsAt: string | null;
  cancelledAt: string | null;
  slices: ManageOrderSlice[];
};

export type OrderChangeAddCriteria = {
  origin: string;
  destination: string;
  departureDate: string;
  cabinClass: string;
};

export type OrderChangeOfferSummary = {
  id: string;
  changeTotalAmount: string;
  changeTotalCurrency: string;
  penaltyTotalAmount: string;
  expiresAt: string;
  summary: string;
};

function sliceLabel(slice: DuffelSlice): string {
  const origin = slice.origin?.iata_code ?? "?";
  const dest = slice.destination?.iata_code ?? "?";
  const depart = slice.segments?.[0]?.departing_at?.slice(0, 10) ?? "";
  return `${origin} → ${dest}${depart ? ` · ${depart}` : ""}`;
}

function sliceCabin(slice: DuffelSlice): string {
  return slice.segments?.[0]?.passengers?.[0]?.cabin_class ?? "economy";
}

export function mapManageOrder(data: DuffelOrderData): ManageOrder {
  const actions = data.available_actions ?? [];
  const slices = (data.slices ?? [])
    .filter((s) => s.id)
    .map((s) => ({
      id: s.id!,
      origin: s.origin?.iata_code ?? "",
      destination: s.destination?.iata_code ?? "",
      departureAt: s.segments?.[0]?.departing_at ?? "",
      cabinClass: sliceCabin(s),
      label: sliceLabel(s),
    }));

  return {
    orderId: data.id ?? "",
    bookingReference: data.booking_reference ?? "",
    availableActions: actions,
    canChange: actions.includes("change"),
    canCancel: actions.includes("cancel"),
    voidWindowEndsAt: data.void_window_ends_at ?? null,
    cancelledAt: data.cancelled_at ?? null,
    slices,
  };
}

export async function getManageOrder(orderId: string): Promise<ManageOrder | null> {
  const res = await duffelRequest<{ data?: DuffelOrderData }>({
    method: "GET",
    path: `/air/orders/${encodeURIComponent(orderId)}`,
  });
  if (!res.data?.id) return null;
  return mapManageOrder(res.data);
}

export async function createOrderChangeRequest(input: {
  orderId: string;
  sliceIdToRemove: string;
  add: OrderChangeAddCriteria;
}): Promise<{ requestId: string }> {
  const res = await duffelRequest<{ data?: { id?: string } }>({
    method: "POST",
    path: "/air/order_change_requests",
    body: {
      data: {
        order_id: input.orderId,
        slices: {
          remove: [{ slice_id: input.sliceIdToRemove }],
          add: [
            {
              origin: input.add.origin,
              destination: input.add.destination,
              departure_date: input.add.departureDate,
              cabin_class: input.add.cabinClass,
            },
          ],
        },
      },
    },
  });
  const id = res.data?.id;
  if (!id) throw new Error("Duffel did not return a change request id.");
  return { requestId: id };
}

type DuffelChangeOffer = {
  id?: string;
  change_total_amount?: string;
  change_total_currency?: string;
  penalty_total_amount?: string;
  expires_at?: string;
  slices?: {
    add?: DuffelSlice[];
    remove?: DuffelSlice[];
  };
};

function offerSummary(offer: DuffelChangeOffer): string {
  const add = offer.slices?.add?.[0];
  if (!add) return "Alternative flight";
  return sliceLabel(add);
}

export async function getOrderChangeRequest(
  requestId: string,
): Promise<{ requestId: string; offers: OrderChangeOfferSummary[] }> {
  const res = await duffelRequest<{
    data?: { id?: string; order_change_offers?: DuffelChangeOffer[] };
  }>({
    method: "GET",
    path: `/air/order_change_requests/${encodeURIComponent(requestId)}`,
  });

  const offers = (res.data?.order_change_offers ?? [])
    .filter((o) => o.id)
    .map((o) => ({
      id: o.id!,
      changeTotalAmount: o.change_total_amount ?? "0",
      changeTotalCurrency: o.change_total_currency ?? "USD",
      penaltyTotalAmount: o.penalty_total_amount ?? "0",
      expiresAt: o.expires_at ?? "",
      summary: offerSummary(o),
    }));

  return { requestId: res.data?.id ?? requestId, offers };
}

export async function createPendingOrderChange(
  offerId: string,
): Promise<{ orderChangeId: string; changeTotalAmount: string; changeTotalCurrency: string }> {
  const res = await duffelRequest<{
    data?: {
      id?: string;
      change_total_amount?: string;
      change_total_currency?: string;
    };
  }>({
    method: "POST",
    path: "/air/order_changes",
    body: { data: { selected_order_change_offer: offerId } },
  });

  const data = res.data;
  if (!data?.id) throw new Error("Duffel did not return an order change id.");

  return {
    orderChangeId: data.id,
    changeTotalAmount: data.change_total_amount ?? "0",
    changeTotalCurrency: data.change_total_currency ?? "USD",
  };
}

export async function getPendingOrderChange(orderChangeId: string): Promise<{
  orderChangeId: string;
  changeTotalAmount: string;
  changeTotalCurrency: string;
  confirmedAt: string | null;
}> {
  const res = await duffelRequest<{
    data?: {
      id?: string;
      change_total_amount?: string;
      change_total_currency?: string;
      confirmed_at?: string | null;
    };
  }>({
    method: "GET",
    path: `/air/order_changes/${encodeURIComponent(orderChangeId)}`,
  });

  const data = res.data;
  if (!data?.id) throw new Error("Order change not found.");

  return {
    orderChangeId: data.id,
    changeTotalAmount: data.change_total_amount ?? "0",
    changeTotalCurrency: data.change_total_currency ?? "USD",
    confirmedAt: data.confirmed_at ?? null,
  };
}

export async function confirmOrderChange(input: {
  orderChangeId: string;
  currency: string;
  amount: string;
}): Promise<{ confirmedAt: string | null }> {
  const res = await duffelRequest<{
    data?: { confirmed_at?: string | null };
  }>({
    method: "POST",
    path: `/air/order_changes/${encodeURIComponent(input.orderChangeId)}/actions/confirm`,
    body: {
      data: {
        payment: {
          type: "balance",
          currency: input.currency,
          amount: input.amount,
        },
      },
    },
  });

  return { confirmedAt: res.data?.confirmed_at ?? null };
}
