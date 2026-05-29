import { formatMoney } from "@/lib/flights/format";
import { getFlightPriceDisclosureMode } from "@/lib/flights/pricing-disclosure";
import { CUSTOMER_FEE_LINE } from "@/lib/flights/pricing-policy";

type OfferPricing = {
  markupPercent: number;
  baseAmount: string;
  currency: string;
};

type Props = {
  offer: OfferPricing;
  className?: string;
};

/** Subline under the customer total on search results and similar. */
export function FlightPriceDisclosure({
  offer,
  className = "mt-1 text-xs text-stone-500",
}: Props) {
  const mode = getFlightPriceDisclosureMode();

  if (mode === "hidden") return null;

  const text =
    mode === "simple"
      ? CUSTOMER_FEE_LINE
      : `Includes ${offer.markupPercent}% agency service fee · Base ${formatMoney(offer.baseAmount, offer.currency)}`;

  return <p className={className}>{text}</p>;
}
