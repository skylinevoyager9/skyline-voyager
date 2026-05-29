"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CompactFlightSearchForm,
  type CompactFlightSearchState,
} from "@/components/flights/CompactFlightSearchForm";
import type { TripType } from "@/lib/duffel/types";
import { buildFlightSearchUrl } from "@/lib/flights/search-url";
import { applyTripTypeChange, createDefaultSearchForm } from "@/lib/flights/search-form";
import type { FlightLeg } from "@/lib/flights/trip-types";
import { defaultDepartureDate, defaultReturnDate } from "@/lib/flights/trip-types";

type Props = {
  liveSearch: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  defaultOrigin?: string;
  defaultDestination?: string;
};

export function FlightSearchCard({
  liveSearch,
  title = "Flight search",
  subtitle,
  className = "",
  defaultOrigin = "LHR",
  defaultDestination = "JFK",
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<CompactFlightSearchState>(() => {
    const dep = defaultDepartureDate();
    return {
      tripType: "return",
      origin: defaultOrigin,
      destination: defaultDestination,
      departureDate: dep,
      returnDate: defaultReturnDate(dep),
      legs: [
        { origin: defaultOrigin, destination: defaultDestination, departureDate: dep },
        {
          origin: defaultDestination,
          destination: "",
          departureDate: defaultReturnDate(dep, 5),
        },
      ],
      adults: 1,
      cabinClass: "economy",
    };
  });

  useEffect(() => {
    const depart = defaultDepartureDate();
    setState((s) => ({
      ...s,
      departureDate: s.departureDate || depart,
      returnDate: s.returnDate || defaultReturnDate(depart),
    }));
  }, []);

  function onTripTypeChange(next: TripType) {
    const updated = applyTripTypeChange(
      createDefaultSearchForm({
        tripType: state.tripType,
        origin: state.origin,
        destination: state.destination,
        departureDate: state.departureDate || defaultDepartureDate(),
        returnDate: state.returnDate,
        legs: state.legs,
        adults: state.adults,
        cabinClass: state.cabinClass,
      }),
      next,
    );
    setState({
      tripType: updated.tripType,
      origin: updated.origin,
      destination: updated.destination,
      departureDate: updated.departureDate,
      returnDate: updated.returnDate,
      legs: updated.legs,
      adults: updated.adults,
      cabinClass: updated.cabinClass,
    });
  }

  function goToSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!liveSearch) {
      router.push("/flights");
      return;
    }

    if (state.tripType === "multi_city") {
      const valid = state.legs.every((l) => l.origin && l.destination && l.departureDate);
      if (!valid) return;
      router.push(
        buildFlightSearchUrl({
          tripType: "multi_city",
          origin: state.legs[0]!.origin,
          destination: state.legs[0]!.destination,
          departureDate: state.legs[0]!.departureDate,
          slices: state.legs,
          adults: state.adults,
          cabinClass: state.cabinClass,
        }),
      );
      return;
    }

    if (!state.origin || !state.destination || !state.departureDate) return;
    if (state.tripType === "return" && !state.returnDate) return;

    router.push(
      buildFlightSearchUrl({
        tripType: state.tripType,
        origin: state.origin,
        destination: state.destination,
        departureDate: state.departureDate,
        returnDate: state.tripType === "return" ? state.returnDate : undefined,
        adults: state.adults,
        cabinClass: state.cabinClass,
      }),
    );
  }

  return (
    <div className={className}>
      <div className="relative overflow-visible rounded-3xl border border-white/15 bg-white/[0.08] p-1 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-48 bg-gradient-to-bl from-sky-400/25 via-amber-300/10 to-transparent"
          aria-hidden
        />
        <CompactFlightSearchForm
          liveSearch={liveSearch}
          title={title}
          subtitle={subtitle}
          state={state}
          onTripTypeChange={onTripTypeChange}
          onOriginChange={(origin) => setState((s) => ({ ...s, origin }))}
          onDestinationChange={(destination) => setState((s) => ({ ...s, destination }))}
          onDepartureDateChange={(departureDate) => setState((s) => ({ ...s, departureDate }))}
          onReturnDateChange={(returnDate) => setState((s) => ({ ...s, returnDate }))}
          onLegsChange={(legs: FlightLeg[]) => setState((s) => ({ ...s, legs }))}
          onAdultsChange={(adults) => setState((s) => ({ ...s, adults }))}
          onCabinChange={(cabinClass) => setState((s) => ({ ...s, cabinClass }))}
          onSubmit={goToSearch}
        />
      </div>
    </div>
  );
}
