import type { Metadata } from "next";
import Link from "next/link";
import { StaysBookClient } from "@/components/stays/StaysBookClient";
import { isDuffelConfigured } from "@/lib/duffel/config";

export const metadata: Metadata = {
  title: "Book your stay",
  description: "Complete your hotel booking on Skyline Voyager.",
};

export default function StaysBookPage() {
  const configured = isDuffelConfigured();

  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-stone-500">
          <Link href="/stays/search" className="hover:text-stone-800 hover:underline">
            ← Back to search
          </Link>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Book your stay</h1>
        {!configured ? (
          <p className="mt-4 text-sm text-stone-600">Stays booking is not configured on this server.</p>
        ) : (
          <div className="mt-10">
            <StaysBookClient />
          </div>
        )}
      </div>
    </main>
  );
}
