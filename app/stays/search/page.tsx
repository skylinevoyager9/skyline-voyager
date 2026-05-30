import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StaysSearchExperience } from "@/components/stays/StaysSearchExperience";
import { isDuffelConfigured } from "@/lib/duffel/config";
import { getStayRuntimeLabels } from "@/lib/stays/runtime-labels";

export const metadata: Metadata = {
  title: "Search hotels & stays",
  description: "Search and book hotels on Skyline Voyager with transparent total pricing.",
};

export default function StaysSearchPage() {
  const configured = isDuffelConfigured();
  const labels = getStayRuntimeLabels();

  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-800 hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/hotels" className="hover:text-stone-800 hover:underline">
            Hotels
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">Search</span>
        </nav>
        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900 sm:text-4xl">
          {labels.searchHeadline}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-stone-600">{labels.searchSubline}</p>
        <p className="mt-2 text-sm">
          <Link
            href="/stays/lookup"
            className="font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Look up an existing stay →
          </Link>
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-sm text-stone-600">Loading stay search…</p>}>
            <StaysSearchExperience configured={configured} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
