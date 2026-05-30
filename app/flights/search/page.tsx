import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlightSearchExperience } from "@/components/flights/FlightSearchExperience";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { isOwnerPricingKeyValid } from "@/lib/flights/owner-pricing";
import { getFlightRuntimeLabels } from "@/lib/flights/runtime-labels";

export const metadata: Metadata = {
  title: "Search flights",
  description: "Search and book flights on Skyline Voyager with transparent total pricing.",
};

type Props = { searchParams: Promise<{ owner?: string }> };

export default async function FlightSearchPage({ searchParams }: Props) {
  const { owner } = await searchParams;
  const ownerPricingKey = isOwnerPricingKeyValid(owner) ? owner!.trim() : undefined;

  const configured = isDuffelConfigured();
  const labels = getFlightRuntimeLabels();

  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-800 hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/flights" className="hover:text-stone-800 hover:underline">
            Flights
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">Search</span>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900 sm:text-4xl">
          {labels.searchHeadline}
        </h1>
        <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">
          {labels.searchSubline}
          {!labels.isProductionBooking && labels.duffelMode === "test"
            ? " Use a test card (4242…) if paying by card."
            : null}
        </p>
        <p className="mt-2 text-sm">
          <Link href="/flights/lookup" className="font-semibold text-sky-800 underline-offset-2 hover:underline">
            Look up an existing booking →
          </Link>
        </p>
        <div className="mt-10">
          <Suspense
            fallback={
              <p className="text-sm text-stone-600">Loading flight search…</p>
            }
          >
            <FlightSearchExperience
              configured={configured}
              initialOwnerKey={ownerPricingKey}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
