import { applyFlightMarkup } from "@/lib/duffel/pricing";
import type {
  FlightAvailableService,
  FlightOfferSummary,
  SelectedFlightService,
} from "@/lib/duffel/types";

export type FlightCheckoutTotals = {
  fareSupplierAmount: string;
  servicesSupplierAmount: string;
  supplierTotal: string;
  currency: string;
  markupPercent: number;
  markupAmount: string;
  customerAmount: string;
  paymentAmount: string;
  selectedServices: SelectedFlightService[];
};

export function findAvailableService(
  offer: FlightOfferSummary,
  serviceId: string,
): FlightAvailableService | undefined {
  return offer.availableServices?.find((s) => s.id === serviceId);
}

export function validateSelectedServices(
  offer: FlightOfferSummary,
  selected: SelectedFlightService[],
): { ok: true } | { ok: false; error: string } {
  if (!selected.length) return { ok: true };

  const available = offer.availableServices ?? [];
  if (!available.length) {
    return { ok: false, error: "Extra bags are not available for this fare." };
  }

  const byId = new Map(available.map((s) => [s.id, s]));

  for (const pick of selected) {
    const svc = byId.get(pick.serviceId);
    if (!svc) {
      return { ok: false, error: "Invalid extra bag selection." };
    }
    if (
      !Number.isInteger(pick.quantity) ||
      pick.quantity < 1 ||
      pick.quantity > svc.maximumQuantity
    ) {
      return {
        ok: false,
        error: `Quantity for ${svc.label} must be between 1 and ${svc.maximumQuantity}.`,
      };
    }
  }

  const seen = new Set<string>();
  for (const pick of selected) {
    if (seen.has(pick.serviceId)) {
      return { ok: false, error: "Duplicate bag service selected." };
    }
    seen.add(pick.serviceId);
  }

  return { ok: true };
}

export function sumServicesSupplierAmount(
  offer: FlightOfferSummary,
  selected: SelectedFlightService[],
): string {
  let total = 0;
  for (const pick of selected) {
    const svc = findAvailableService(offer, pick.serviceId);
    if (!svc) continue;
    total += Number.parseFloat(svc.totalAmount) * pick.quantity;
  }
  return total.toFixed(2);
}

/** Fare + optional bags with agency markup on the combined supplier total. */
export function computeFlightCheckoutTotals(
  offer: FlightOfferSummary,
  selected: SelectedFlightService[],
  markupPercent?: number,
): FlightCheckoutTotals {
  const percent = markupPercent ?? offer.markupPercent;
  const fareSupplierAmount = offer.baseAmount;
  const servicesSupplierAmount = sumServicesSupplierAmount(offer, selected);
  const supplierTotal = (
    Number.parseFloat(fareSupplierAmount) + Number.parseFloat(servicesSupplierAmount)
  ).toFixed(2);
  const pricing = applyFlightMarkup(supplierTotal, percent);

  return {
    fareSupplierAmount,
    servicesSupplierAmount,
    supplierTotal: pricing.baseAmount,
    currency: offer.currency,
    markupPercent: pricing.markupPercent,
    markupAmount: pricing.markupAmount,
    customerAmount: pricing.customerAmount,
    paymentAmount: supplierTotal,
    selectedServices: selected.filter((s) => s.quantity > 0),
  };
}

export function buildDuffelOrderServices(
  selected: SelectedFlightService[],
): Array<{ id: string; quantity: number }> {
  return selected
    .filter((s) => s.quantity > 0)
    .map((s) => ({ id: s.serviceId, quantity: s.quantity }));
}
