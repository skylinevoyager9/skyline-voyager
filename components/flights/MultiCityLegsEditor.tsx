"use client";

import { PlaceAutocomplete } from "@/components/flights/PlaceAutocomplete";
import {
  flightFieldInput,
  flightFieldLabel,
  flightSearchPanel,
} from "@/components/flights/flight-search-ui";
import type { FlightLeg } from "@/lib/flights/trip-types";
import { MAX_MULTI_CITY_LEGS, MIN_MULTI_CITY_LEGS } from "@/lib/flights/trip-types";

type Props = {
  legs: FlightLeg[];
  onChange: (legs: FlightLeg[]) => void;
  enableSuggestions: boolean;
  maxLegs?: number;
  showAddMoreHint?: boolean;
};

export function MultiCityLegsEditor({
  legs,
  onChange,
  enableSuggestions,
  maxLegs = MAX_MULTI_CITY_LEGS,
  showAddMoreHint = false,
}: Props) {
  function updateLeg(index: number, patch: Partial<FlightLeg>) {
    onChange(legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  }

  function addLeg() {
    if (legs.length >= maxLegs) return;
    const last = legs[legs.length - 1];
    const nextDate = new Date(`${last?.departureDate ?? ""}T00:00:00`);
    if (!Number.isNaN(nextDate.getTime())) {
      nextDate.setDate(nextDate.getDate() + 3);
    } else {
      nextDate.setDate(nextDate.getDate() + 17);
    }
    onChange([
      ...legs,
      {
        origin: last?.destination ?? "",
        destination: "",
        departureDate: nextDate.toISOString().slice(0, 10),
      },
    ]);
  }

  function removeLeg(index: number) {
    if (legs.length <= MIN_MULTI_CITY_LEGS) return;
    onChange(legs.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {legs.map((leg, index) => (
        <div key={`leg-${index}`} className={`${flightSearchPanel} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] text-white">
                {index + 1}
              </span>
              Flight {index + 1}
            </span>
            {legs.length > MIN_MULTI_CITY_LEGS ? (
              <button
                type="button"
                onClick={() => removeLeg(index)}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PlaceAutocomplete
              label="From"
              value={leg.origin}
              onChange={(origin) => updateLeg(index, { origin })}
              enableSuggestions={enableSuggestions}
              placeholder="City or airport"
              required
            />
            <PlaceAutocomplete
              label="To"
              value={leg.destination}
              onChange={(destination) => updateLeg(index, { destination })}
              enableSuggestions={enableSuggestions}
              placeholder="City or airport"
              required
            />
            <label className="block text-sm">
              <span className={flightFieldLabel}>Depart</span>
              <input
                required
                type="date"
                value={leg.departureDate}
                onChange={(e) => updateLeg(index, { departureDate: e.target.value })}
                className={flightFieldInput}
              />
            </label>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {legs.length < maxLegs ? (
          <button
            type="button"
            onClick={addLeg}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-sky-300 bg-sky-50/80 px-4 py-2 text-sm font-bold text-sky-800 transition hover:border-sky-400 hover:bg-sky-50"
          >
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
            Add flight
          </button>
        ) : null}
        {showAddMoreHint && maxLegs < MAX_MULTI_CITY_LEGS ? (
          <p className="text-xs text-stone-500">
            Up to {MAX_MULTI_CITY_LEGS} flights on the full search page.
          </p>
        ) : null}
      </div>
    </div>
  );
}
