import type { Metadata } from "next";
import Link from "next/link";
import { StaysLookupClient } from "@/components/stays/StaysBookClient";

export const metadata: Metadata = {
  title: "Look up a stay booking",
  description: "Find your Skyline Voyager hotel booking with email and reference.",
};

export default function StaysLookupPage() {
  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-stone-500">
          <Link href="/stays/search" className="hover:text-stone-800 hover:underline">
            Stays search
          </Link>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Look up a stay</h1>
        <p className="mt-3 text-sm text-stone-600">
          Enter the email used at checkout and your booking reference from the confirmation email.
        </p>
        <div className="mt-8">
          <StaysLookupClient />
        </div>
      </div>
    </main>
  );
}
