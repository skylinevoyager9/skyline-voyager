import {
  CUSTOMER_CHECKOUT_NOTE,
  CUSTOMER_FEE_LINE,
} from "@/lib/flights/pricing-policy";

type Props = {
  variant?: "search" | "checkout";
  className?: string;
};

/** Short, honest pricing note for guests (no base-fare split). */
export function FlightCustomerPricingNote({
  variant = "search",
  className = "text-xs leading-relaxed text-stone-500",
}: Props) {
  return (
    <p className={className}>
      <span className="font-medium text-stone-600">{CUSTOMER_FEE_LINE}.</span>{" "}
      {variant === "checkout" ? CUSTOMER_CHECKOUT_NOTE : "Totals include that fee before you book."}
    </p>
  );
}
