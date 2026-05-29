"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FlightPriceDisclosure } from "@/components/flights/FlightPriceDisclosure";
import { OfferExpiryCountdown } from "@/components/flights/OfferExpiryCountdown";
import { OwnerMarginBreakdown } from "@/components/flights/OwnerMarginBreakdown";
import { readStoredOwnerPricingKey } from "@/lib/flights/owner-pricing";
import type { FlightOfferSummary, FlightSearchResponse } from "@/lib/duffel/types";
import { formatDateTime, formatDuration, formatMoney } from "@/lib/flights/format";
import {
  filterOffers,
  formatDurationMinutes,
  getOfferAirlines,
  getPriceInsights,
  sortOffers,
  stopsLabel,
  type OfferSortKey,
} from "@/lib/flights/offer-utils";

type Props = {
  results: FlightSearchResponse;
  ownerView?: boolean;
};

export function FlightResultsExplorer({ results, ownerView = false }: Props) {
  const [sortBy, setSortBy] = useState<OfferSortKey>("price");
  const [directOnly, setDirectOnly] = useState(false);
  const [maxStops, setMaxStops] = useState<string>("any");
  const [airline, setAirline] = useState<string>("all");

  const airlines = useMemo(() => {
    const set = new Set<string>();
    for (const offer of results.offers) {
      for (const name of getOfferAirlines(offer)) set.add(name);
    }
    return [...set].sort();
  }, [results.offers]);

  const filtered = useMemo(() => {
    const stopsFilter =
      maxStops === "any" ? null : maxStops === "0" ? 0 : maxStops === "1" ? 1 : 2;
    return filterOffers(results.offers, {
      directOnly,
      maxStops: stopsFilter,
      airline: airline === "all" ? null : airline,
    });
  }, [results.offers, directOnly, maxStops, airline]);

  const sorted = useMemo(() => sortOffers(filtered, sortBy), [filtered, sortBy]);
  const insights = useMemo(() => getPriceInsights(sorted), [sorted]);
  const allInsights = useMemo(() => getPriceInsights(results.offers), [results.offers]);

  const savingsPct =
    insights.cheapestId && allInsights.max > allInsights.min
      ? Math.round(((allInsights.max - allInsights.min) / allInsights.max) * 100)
      : 0;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-amber-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
              Price comparison
            </p>
            <p className="font-display mt-1 text-2xl font-bold text-stone-900">
              {sorted.length} fare{sorted.length === 1 ? "" : "s"}
              {sorted.length !== results.offers.length
                ? ` (of ${results.offers.length})`
                : ""}
            </p>
            {insights.count > 0 ? (
              <p className="mt-2 text-sm text-stone-600">
                From{" "}
                <strong className="text-stone-900">
                  {formatMoney(String(insights.min), insights.currency)}
                </strong>
                {allInsights.max > insights.min ? (
                  <>
                    {" "}
                    up to{" "}
                    <strong className="text-stone-900">
                      {formatMoney(String(allInsights.max), allInsights.currency)}
                    </strong>
                  </>
                ) : null}
                {savingsPct > 5 ? (
                  <span className="ml-1 text-emerald-700">
                    · Save up to {savingsPct}% vs highest listed fare
                  </span>
                ) : null}
              </p>
            ) : null}
            {results.flexDatesSearched?.length ? (
              <p className="mt-2 text-xs text-stone-500">
                Flexible dates searched: {results.flexDatesSearched.join(", ")}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="block text-sm">
              <span className="sr-only">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as OfferSortKey)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 shadow-sm"
              >
                <option value="price">Cheapest first</option>
                <option value="duration">Shortest trip</option>
                <option value="departure">Earliest departure</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-200/80 pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm">
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className="rounded border-stone-300 text-sky-600"
            />
            Nonstop only
          </label>
          <select
            value={maxStops}
            onChange={(e) => setMaxStops(e.target.value)}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm"
          >
            <option value="any">Any stops</option>
            <option value="0">Nonstop</option>
            <option value="1">Up to 1 stop</option>
            <option value="2">Up to 2 stops</option>
          </select>
          {airlines.length > 1 ? (
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="max-w-[12rem] rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm"
            >
              <option value="all">All airlines</option>
              {airlines.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-8 text-center text-stone-600">
          No fares match these filters. Try clearing filters or search nearby dates.
        </p>
      ) : (
        <ul className="space-y-4">
          {sorted.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              ownerView={ownerView}
              isCheapest={offer.id === insights.cheapestId}
              isFastest={offer.id === insights.fastestId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function OfferCard({
  offer,
  ownerView,
  isCheapest,
  isFastest,
}: {
  offer: FlightOfferSummary;
  ownerView: boolean;
  isCheapest: boolean;
  isFastest: boolean;
}) {
  const bookParams = new URLSearchParams({
    offerId: offer.id,
    mp: String(offer.markupPercent),
    quoted: offer.customerAmount,
  });
  const storedOwner = readStoredOwnerPricingKey();
  if (storedOwner) bookParams.set("owner", storedOwner);
  const bookHref = `/flights/book?${bookParams.toString()}`;
  const durationLabel = formatDurationMinutes(offer.totalDurationMinutes);

  return (
    <li
      className={`rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 ${
        isCheapest ? "border-emerald-300 ring-1 ring-emerald-200/80" : "border-stone-200"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isCheapest ? (
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Lowest price
              </span>
            ) : null}
            {isFastest && !isCheapest ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                Shortest
              </span>
            ) : null}
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600">
              {stopsLabel(offer.stops)}
            </span>
            {offer.outboundDate ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Departs {offer.outboundDate}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {offer.ownerName ?? "Airline"}
          </p>
          <p className="font-display mt-1 text-3xl font-bold text-stone-900">
            {formatMoney(offer.customerAmount, offer.currency)}
          </p>
          {!ownerView ? <FlightPriceDisclosure offer={offer} /> : null}
          {offer.expiresAt ? (
            <OfferExpiryCountdown expiresAt={offer.expiresAt} className="mt-1 text-xs text-amber-800" />
          ) : null}
          {offer.fareRules?.baggageSummary && !ownerView ? (
            <p className="mt-1 text-xs text-stone-500">{offer.fareRules.baggageSummary}</p>
          ) : null}
          <OwnerMarginBreakdown
            visible={ownerView}
            baseAmount={offer.baseAmount}
            markupPercent={offer.markupPercent}
            markupAmount={offer.markupAmount}
            customerAmount={offer.customerAmount}
            currency={offer.currency}
          />
          {durationLabel ? (
            <p className="mt-1 text-xs text-stone-500">Total travel time · {durationLabel}</p>
          ) : null}
        </div>
        <Link
          href={bookHref}
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition ${
            isCheapest
              ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
              : "bg-amber-100 text-amber-950 ring-1 ring-amber-300/50 hover:bg-amber-50"
          }`}
        >
          Book this fare →
        </Link>
      </div>
      <ul className="mt-4 space-y-3 border-t border-stone-100 pt-4 text-sm text-stone-700">
        {offer.slices.map((slice, i) => (
          <li key={`${offer.id}-slice-${i}`}>
            <p className="font-semibold text-stone-900">
              {slice.origin} → {slice.destination}{" "}
              <span className="font-normal text-stone-500">({slice.departureDate})</span>
            </p>
            {slice.segments.map((seg, j) => (
              <p key={`${offer.id}-seg-${j}`} className="mt-1 text-stone-600">
                {seg.marketingCarrier}
                {seg.flightNumber ? ` ${seg.flightNumber}` : ""} ·{" "}
                {formatDateTime(seg.departingAt)} → {formatDateTime(seg.arrivingAt)}
                {seg.duration ? ` · ${formatDuration(seg.duration)}` : ""}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </li>
  );
}
