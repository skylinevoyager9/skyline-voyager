import Link from "next/link";
import { usesDuffelFlightBooking } from "@/lib/booking/platform";

/**
 * Visible booking-context note for guides (FTC-style transparency).
 */
export function GuideArticlePartnerNote() {
  const duffelBooking = usesDuffelFlightBooking();

  return (
    <aside className="mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-stone-50/80 px-4 py-3.5 text-sm leading-relaxed text-stone-700 shadow-sm ring-1 ring-amber-900/5 sm:px-5">
      <p className="font-semibold text-stone-900">How booking works on this page</p>
      <p className="mt-2">
        {duffelBooking ? (
          <>
            <strong>Flight booking</strong> on Skyline Voyager uses live airline
            inventory via Duffel—you search, pay on our site, and we place the order.
            This guide is editorial; it does not link to Booking.com or other hotel
            booking sites.
          </>
        ) : (
          <>
            When flight search is enabled, bookings complete on Skyline Voyager.
            Hotel and stay content here is for planning only. See our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-amber-900 underline decoration-amber-900/35 underline-offset-2 hover:decoration-amber-900"
            >
              disclosure
            </Link>
            .
          </>
        )}
      </p>
    </aside>
  );
}
