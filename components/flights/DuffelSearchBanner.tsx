import Link from "next/link";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { getFlightRuntimeLabels } from "@/lib/flights/runtime-labels";

export function DuffelSearchBanner() {
  if (!isDuffelConfigured()) return null;

  const labels = getFlightRuntimeLabels();

  const message = labels.isProductionBooking
    ? "Search live flights — prices include our service fee."
    : labels.duffelMode === "test"
      ? "Try flight search (test mode — no real tickets)."
      : "Flight search is available on Skyline Voyager.";

  return (
    <div className="border-b border-teal-200/80 bg-gradient-to-r from-teal-50 to-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-stone-700">
          <strong className="text-stone-900">{message}</strong>
        </p>
        <Link
          href="/flights/search"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Search flights →
        </Link>
      </div>
    </div>
  );
}
