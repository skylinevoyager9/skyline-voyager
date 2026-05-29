"use client";

import Link from "next/link";
import { MultiCityLegsEditor } from "@/components/flights/MultiCityLegsEditor";
import { PlaceAutocomplete } from "@/components/flights/PlaceAutocomplete";
import { TripTypeSelector } from "@/components/flights/TripTypeSelector";
import {
  flightFieldInput,
  flightFieldLabel,
  flightSearchPanel,
  flightSearchSubmit,
} from "@/components/flights/flight-search-ui";
import type { TripType } from "@/lib/duffel/types";
import { FLIGHTS_SEARCH_PATH } from "@/lib/flights/links";
import type { FlightLeg } from "@/lib/flights/trip-types";

type Cabin = "economy" | "premium_economy" | "business" | "first";

export type CompactFlightSearchState = {
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  legs: FlightLeg[];
  adults: number;
  cabinClass: Cabin;
};

type Props = {
  liveSearch: boolean;
  title?: string;
  subtitle?: string;
  state: CompactFlightSearchState;
  onTripTypeChange: (t: TripType) => void;
  onOriginChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  onDepartureDateChange: (v: string) => void;
  onReturnDateChange: (v: string) => void;
  onLegsChange: (legs: FlightLeg[]) => void;
  onAdultsChange: (n: number) => void;
  onCabinChange: (c: Cabin) => void;
  onSubmit: (e?: React.FormEvent) => void;
  footerNote?: boolean;
  footerClassName?: string;
};

function CabinSelect({
  value,
  onChange,
}: {
  value: Cabin;
  onChange: (c: Cabin) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Cabin)} className={flightFieldInput}>
      <option value="economy">Economy</option>
      <option value="premium_economy">Premium economy</option>
      <option value="business">Business</option>
      <option value="first">First</option>
    </select>
  );
}

export function CompactFlightSearchForm({
  liveSearch,
  title = "Flight search",
  subtitle,
  state,
  onTripTypeChange,
  onOriginChange,
  onDestinationChange,
  onDepartureDateChange,
  onReturnDateChange,
  onLegsChange,
  onAdultsChange,
  onCabinChange,
  onSubmit,
  footerNote = true,
  footerClassName = "text-white/75",
}: Props) {
  const isMulti = state.tripType === "multi_city";
  const isReturn = state.tripType === "return";

  return (
    <>
      <form onSubmit={onSubmit} className="relative rounded-[22px] bg-white p-5 text-stone-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">{title}</p>
            {subtitle ? (
              <p className="mt-1 max-w-xl text-sm text-stone-600">{subtitle}</p>
            ) : null}
          </div>
          {liveSearch ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              Live fares
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <TripTypeSelector value={state.tripType} onChange={onTripTypeChange} />
        </div>

        {isMulti ? (
          <div className="mt-5 space-y-4">
            <MultiCityLegsEditor
              legs={state.legs}
              onChange={onLegsChange}
              enableSuggestions={liveSearch}
              maxLegs={2}
              showAddMoreHint
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm">
                <span className={flightFieldLabel}>Cabin</span>
                <CabinSelect value={state.cabinClass} onChange={onCabinChange} />
              </label>
              <label className="block text-sm">
                <span className={flightFieldLabel}>Adults</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={state.adults}
                  onChange={(e) => onAdultsChange(Number.parseInt(e.target.value, 10) || 1)}
                  className={flightFieldInput}
                />
              </label>
              <div className="sm:col-span-2">
                <span className={flightFieldLabel} aria-hidden>
                  Search
                </span>
                <button type="submit" className={`${flightSearchSubmit} sm:mt-[22px]`}>
                  {liveSearch ? "Search flights" : "Flights →"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`relative z-10 mt-5 ${flightSearchPanel} p-3 sm:p-4`}>
            <div className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-6">
              <PlaceAutocomplete
                className="sm:col-span-1 lg:col-span-1"
                label="From"
                value={state.origin}
                onChange={onOriginChange}
                enableSuggestions={liveSearch}
                placeholder="City or airport"
                required
              />
              <PlaceAutocomplete
                className="sm:col-span-1 lg:col-span-1"
                label="To"
                value={state.destination}
                onChange={onDestinationChange}
                enableSuggestions={liveSearch}
                placeholder="City or airport"
                required
              />
              <label className="block text-sm">
                <span className={flightFieldLabel}>Depart</span>
                <input
                  required
                  type="date"
                  value={state.departureDate}
                  onChange={(e) => onDepartureDateChange(e.target.value)}
                  className={flightFieldInput}
                />
              </label>
              {isReturn ? (
                <label className="block text-sm">
                  <span className={flightFieldLabel}>Return</span>
                  <input
                    required
                    type="date"
                    value={state.returnDate}
                    onChange={(e) => onReturnDateChange(e.target.value)}
                    className={flightFieldInput}
                  />
                </label>
              ) : (
                <label className="block text-sm">
                  <span className={flightFieldLabel}>Cabin</span>
                  <CabinSelect value={state.cabinClass} onChange={onCabinChange} />
                </label>
              )}
              <label className="block text-sm">
                <span className={flightFieldLabel}>Adults</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={state.adults}
                  onChange={(e) => onAdultsChange(Number.parseInt(e.target.value, 10) || 1)}
                  className={flightFieldInput}
                />
              </label>
              <div className="flex flex-col justify-end">
                <button type="submit" className={flightSearchSubmit}>
                  {liveSearch ? "Search" : "Go →"}
                </button>
              </div>
            </div>
            {isReturn ? (
              <label className="mt-3 block max-w-xs text-sm">
                <span className={flightFieldLabel}>Cabin</span>
                <CabinSelect value={state.cabinClass} onChange={onCabinChange} />
              </label>
            ) : null}
          </div>
        )}
      </form>

      {footerNote && liveSearch ? (
        <p className={`mt-3 text-sm ${footerClassName}`}>
          <Link
            href={FLIGHTS_SEARCH_PATH}
            className="font-semibold text-amber-100 underline decoration-amber-100/40 underline-offset-2 hover:text-white"
          >
            Full search
          </Link>
          {" · "}Multi-city: up to 4 flights
        </p>
      ) : null}
    </>
  );
}
