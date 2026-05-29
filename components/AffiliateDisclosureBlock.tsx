import Link from "next/link";
import { usesDuffelFlightBooking } from "@/lib/booking/platform";
import { site } from "@/lib/site";

type Props = {
  className?: string;
  /** `compact` = bordered note; `inline` = single paragraph for prose flow */
  variant?: "compact" | "inline";
};

export function AffiliateDisclosureBlock({
  className = "",
  variant = "compact",
}: Props) {
  const duffelOn = usesDuffelFlightBooking();

  const body = duffelOn ? (
    <>
      <strong className="font-semibold text-stone-800">Flights:</strong> search and
      checkout on {site.name} with live fares (Duffel). We may earn a service margin
      on the fare; the price shown is what you pay at checkout.{" "}
      <strong className="font-semibold text-stone-800">Hotels:</strong> guides only—no
      Booking.com or OTA checkout links.
    </>
  ) : (
    <>
      Flight booking opens on {site.name} when configured. Hotel guides are editorial
      and do not link to Booking.com.
    </>
  );

  const noteLabel = "Booking & partners:";

  if (variant === "inline") {
    return (
      <p className={`text-sm leading-relaxed text-stone-600 ${className}`}>
        {body}{" "}
        <Link
          href="/affiliate-disclosure"
          className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
        >
          Full disclosure
        </Link>
        .
      </p>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 text-sm leading-relaxed text-stone-700 ${className}`}
      role="note"
    >
      <p>
        <strong className="text-stone-900">{noteLabel}</strong> {body}
      </p>
      <p className="mt-2">
        <Link
          href="/affiliate-disclosure"
          className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
        >
          Read our disclosure
        </Link>
        .
      </p>
    </aside>
  );
}
