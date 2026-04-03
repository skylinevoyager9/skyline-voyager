import type { Metadata } from "next";
import Link from "next/link";
import { DESTINATION_META } from "@/lib/guides";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Browse Skyline Voyager guides by region—USA, Australia, Bali, Europe, and the UK.",
};

export default function DestinationsIndexPage() {
  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
          <Link
            href="/"
            className="font-medium text-stone-700 hover:text-amber-950 hover:underline"
          >
            Home
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="text-stone-600">Destinations</span>
        </nav>

        <h1 className="font-display mt-6 text-3xl font-bold text-stone-900 sm:text-4xl">
          Guides by destination
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          We started with US travel and are expanding region by region. Pick a
          destination to see guides tagged for that area—plus USA guides that
          stay relevant for domestic trips.
        </p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATION_META.map((d) => (
            <li key={d.id}>
              <Link
                href={d.path}
                className="group flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-800/25 hover:shadow-lg"
              >
                <span className="text-3xl" aria-hidden>
                  {d.icon}
                </span>
                <span className="font-display mt-4 text-xl font-bold text-stone-900 group-hover:text-amber-950">
                  {d.title}
                </span>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {d.description}
                </p>
                <span className="mt-6 text-sm font-bold text-amber-900">
                  View guides →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-center text-sm text-stone-500">
          All topics in one library:{" "}
          <Link
            href="/guides"
            className="font-semibold text-amber-900 hover:underline"
          >
            Browse every guide
          </Link>{" "}
          · {site.name}
        </p>
      </div>
    </main>
  );
}
