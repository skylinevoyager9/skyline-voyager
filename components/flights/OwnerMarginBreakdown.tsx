import { formatMoney } from "@/lib/flights/format";

type Props = {
  visible: boolean;
  baseAmount: string;
  markupPercent: number;
  markupAmount: string;
  customerAmount: string;
  currency: string;
};

/** Private margin row — only when pricingView is owner (not shown to customers). */
export function OwnerMarginBreakdown({
  visible,
  baseAmount,
  markupPercent,
  markupAmount,
  customerAmount,
  currency,
}: Props) {
  if (!visible) return null;

  return (
    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
      <div className="rounded-lg border border-stone-200/80 bg-stone-50 px-2 py-2">
        <dt className="font-medium text-stone-500">Airline cost</dt>
        <dd className="mt-0.5 font-semibold tabular-nums text-stone-800">
          {formatMoney(baseAmount, currency)}
        </dd>
      </div>
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2 py-2">
        <dt className="font-medium text-emerald-800">Your margin ({markupPercent}%)</dt>
        <dd className="mt-0.5 font-semibold tabular-nums text-emerald-900">
          {formatMoney(markupAmount, currency)}
        </dd>
      </div>
      <div className="rounded-lg border border-sky-200/80 bg-sky-50/80 px-2 py-2">
        <dt className="font-medium text-sky-800">Customer pays</dt>
        <dd className="mt-0.5 font-semibold tabular-nums text-sky-950">
          {formatMoney(customerAmount, currency)}
        </dd>
      </div>
    </dl>
  );
}
