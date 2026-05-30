"use client";

import Link from "next/link";
import { STAY_SEARCH_LOCATIONS } from "@/lib/stays/locations";
import {
  staysFieldInput,
  staysFieldLabel,
  staysSearchPanel,
  staysSearchSubmit,
} from "@/components/stays/stays-search-ui";

function defaultCheckIn(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function defaultCheckOut(checkIn: string): string {
  const d = new Date(`${checkIn}T12:00:00`);
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

type Props = {
  className?: string;
  defaultLocation?: string;
};

export function StaysSearchCard({ className = "", defaultLocation = "New York, NY" }: Props) {
  const checkIn = defaultCheckIn();
  const checkOut = defaultCheckOut(checkIn);
  const q = new URLSearchParams({
    location: defaultLocation,
    checkIn,
    checkOut,
    rooms: "1",
    adults: "2",
  });

  return (
    <div className={`${staysSearchPanel} ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Hotels &amp; stays
      </p>
      <h2 className="font-display mt-2 text-xl font-bold text-stone-900 sm:text-2xl">
        Search live hotel rates
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Book accommodation on Skyline Voyager with secure checkout—same transparent total pricing
        as flights.
      </p>
      <Link
        href={`/stays/search?${q.toString()}`}
        className={`${staysSearchSubmit} mt-6`}
      >
        Search stays
      </Link>
      <p className="mt-3 text-xs text-stone-500">
        Popular:{" "}
        {STAY_SEARCH_LOCATIONS.slice(0, 4).map((loc, i) => (
          <span key={loc.label}>
            {i > 0 ? " · " : ""}
            <Link
              href={`/stays/search?location=${encodeURIComponent(loc.label)}&checkIn=${checkIn}&checkOut=${checkOut}`}
              className="font-semibold text-amber-900/90 hover:underline"
            >
              {loc.label}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
