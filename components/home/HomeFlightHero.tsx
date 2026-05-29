"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CompactFlightSearchForm,
  type CompactFlightSearchState,
} from "@/components/flights/CompactFlightSearchForm";
import type { TripType } from "@/lib/duffel/types";
import { buildFlightSearchUrl } from "@/lib/flights/search-url";
import { FLIGHTS_SEARCH_PATH } from "@/lib/flights/links";
import { applyTripTypeChange, createDefaultSearchForm } from "@/lib/flights/search-form";
import type { FlightLeg } from "@/lib/flights/trip-types";
import { defaultDepartureDate, defaultReturnDate } from "@/lib/flights/trip-types";

type Props = {
  liveSearch: boolean;
};

const HERO_GLOW =
  "radial-gradient(ellipse 70% 55% at 75% 5%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(ellipse 50% 45% at 15% 95%, rgba(251,191,36,0.12), transparent 50%)";

export function HomeFlightHero({ liveSearch }: Props) {
  const router = useRouter();
  const [state, setState] = useState<CompactFlightSearchState>(() => {
    const dep = defaultDepartureDate();
    return {
      tripType: "return",
      origin: "LHR",
      destination: "JFK",
      departureDate: dep,
      returnDate: defaultReturnDate(dep),
      legs: [
        { origin: "LHR", destination: "JFK", departureDate: dep },
        { origin: "JFK", destination: "", departureDate: defaultReturnDate(dep, 5) },
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
    <section className="relative w-full min-w-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 px-4 pb-20 pt-16 text-white sm:px-6 sm:pb-24 sm:pt-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: HERO_GLOW }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
            <span aria-hidden>✈</span>
            {liveSearch ? "Live airfares" : "Flight planning"}
          </p>
          {liveSearch ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-400/40">
              Real-time prices
            </span>
          ) : null}
        </div>

        <h1 className="font-display mt-8 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
          Search flights with{" "}
          <span className="bg-gradient-to-r from-sky-200 to-amber-100 bg-clip-text text-transparent">
            live fares
          </span>
          —book on Skyline Voyager
        </h1>
        <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg">
          One way, return, or multi-city. Type any city or airport—we&apos;ll find the right
          codes for you.
        </p>

        <div className="mt-10 max-w-4xl">
          <div className="relative overflow-visible rounded-3xl border border-white/15 bg-white/[0.08] p-1 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md ring-1 ring-white/10">
            <div
              className="pointer-events-none absolute right-0 top-0 h-32 w-48 bg-gradient-to-bl from-sky-400/25 via-amber-300/10 to-transparent"
              aria-hidden
            />
            <CompactFlightSearchForm
              liveSearch={liveSearch}
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
              footerNote={false}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => goToSearch()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-sky-500 px-7 py-3 text-sm font-bold text-slate-950 shadow-lg ring-1 ring-sky-300/50 transition hover:from-sky-300 hover:to-sky-400"
            >
              {liveSearch ? "View live ticket prices" : "Explore flights"}
            </button>
            <Link
              href={liveSearch ? FLIGHTS_SEARCH_PATH : "/flights"}
              className="text-sm font-semibold text-sky-200/95 underline decoration-sky-200/40 underline-offset-4 hover:text-white hover:decoration-white"
            >
              Open full search page
            </Link>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-1 gap-6 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-7 backdrop-blur-sm sm:grid-cols-3 sm:gap-8 sm:px-8">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
              Search
            </dt>
            <dd className="mt-2 text-sm font-medium leading-snug text-white">
              One way · Return · Multi-city
            </dd>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-8">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
              Book
            </dt>
            <dd className="mt-2 text-sm font-medium leading-snug text-white">
              Pay by card on Skyline Voyager
            </dd>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-8">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
              Guides
            </dt>
            <dd className="mt-2 text-sm font-medium leading-snug text-white">
              <Link href="/guides" className="underline decoration-white/30 hover:decoration-white">
                Plan smarter trips →
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
