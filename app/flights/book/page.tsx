import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlightBookPageClient } from "@/components/flights/FlightBookPageClient";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { getFlightPaymentMode } from "@/lib/flights/payment-mode";

export const metadata: Metadata = {
  title: "Book flight",
  description: "Complete passenger details and payment for your selected flight offer.",
};

function BookFallback() {
  return <p className="text-sm text-stone-600">Loading booking…</p>;
}

export default function FlightBookPage() {
  const configured = isDuffelConfigured();
  const paymentMode = getFlightPaymentMode();

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
          <Link href="/flights/search" className="hover:text-stone-800 hover:underline">
            Search
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">Book</span>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900 sm:text-4xl">
          Complete your booking
        </h1>
        <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">
          Enter passenger details
          {paymentMode === "stripe" ? " and pay by card" : " and confirm (Duffel test balance)"}.
        </p>
        <div className="mt-10">
          <Suspense fallback={<BookFallback />}>
            <FlightBookPageClient configured={configured} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
