"use client";

import type { TripType } from "@/lib/duffel/types";
import { TRIP_TYPE_OPTIONS } from "@/lib/flights/trip-types";

type Props = {
  value: TripType;
  onChange: (tripType: TripType) => void;
  className?: string;
};

/** One-way · Return · Multi-city in a single horizontal row */
export function TripTypeSelector({ value, onChange, className = "" }: Props) {
  return (
    <div
      className={`w-full ${className}`}
      role="radiogroup"
      aria-label="Trip type"
    >
      <div className="flex w-full flex-nowrap items-stretch gap-1 rounded-full border border-stone-200/90 bg-stone-100/90 p-1 shadow-inner shadow-stone-900/5">
        {TRIP_TYPE_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`min-w-0 flex-1 whitespace-nowrap rounded-full px-2 py-2.5 text-center text-[11px] font-bold tracking-wide transition-all duration-200 sm:px-4 sm:text-sm ${
                active
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/35"
                  : "text-stone-600 hover:bg-white/70 hover:text-stone-900"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
