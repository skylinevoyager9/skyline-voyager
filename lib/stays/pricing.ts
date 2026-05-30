import { clampMarkupPercent, getFlightMarkupPolicy } from "@/lib/duffel/pricing";

export function applyStaysMarkup(
  supplierAmount: string,
  markupPercent?: number,
): {
  supplierAmount: string;
  markupPercent: number;
  markupAmount: string;
  customerAmount: string;
} {
  const base = Number.parseFloat(supplierAmount);
  if (!Number.isFinite(base)) {
    throw new Error(`Invalid amount: ${supplierAmount}`);
  }
  const policy = getFlightMarkupPolicy();
  const percent =
    markupPercent == null
      ? policy.defaultPercent
      : clampMarkupPercent(markupPercent);
  const markupValue = base * (percent / 100);
  const customerValue = base + markupValue;
  return {
    supplierAmount: base.toFixed(2),
    markupPercent: percent,
    markupAmount: markupValue.toFixed(2),
    customerAmount: customerValue.toFixed(2),
  };
}
