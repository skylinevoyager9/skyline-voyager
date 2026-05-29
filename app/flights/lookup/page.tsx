import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlightLookupForm } from "@/components/flights/FlightLookupForm";

export const metadata: Metadata = {
  title: "Look up flight booking",
  description: "Find your Skyline Voyager flight booking with email and airline reference.",
};

export default function FlightLookupPage() {
  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-stone-500">
          <Link href="/flights" className="hover:text-stone-800 hover:underline">
            Flights
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">Look up booking</span>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Look up a booking</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Enter the email and booking reference from your confirmation message.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-stone-600">Loading…</p>}>
            <FlightLookupForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
