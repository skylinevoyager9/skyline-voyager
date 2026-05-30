"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MultiCityLegsEditor } from "@/components/flights/MultiCityLegsEditor";
import { PlaceAutocomplete } from "@/components/flights/PlaceAutocomplete";
import { TripTypeSelector } from "@/components/flights/TripTypeSelector";
import {
  flightFieldInput,
  flightFieldLabel,
  flightSearchPanel,
  flightSearchSubmit,
} from "@/components/flights/flight-search-ui";
import { FlightCustomerPricingNote } from "@/components/flights/FlightCustomerPricingNote";
import { PublishedServiceFeePanel } from "@/components/flights/PublishedServiceFeePanel";
import type { FlightMarkupPolicy } from "@/lib/duffel/pricing";
import type { FlightSearchResponse } from "@/lib/duffel/types";
import type { FlightPaymentMode } from "@/lib/flights/payment-mode";
import {
  applyTripTypeChange,
  createDefaultSearchForm,
  formStateFromUrlQuery,
  formStateToSearchRequest,
  type FlightSearchFormState,
} from "@/lib/flights/search-form";
import { parseFlightSearchParams } from "@/lib/flights/search-url";
import {
  readStoredOwnerPricingKey,
  storeOwnerPricingKey,
} from "@/lib/flights/owner-pricing";
import { defaultDepartureDate } from "@/lib/flights/trip-types";
import { FlightResultsExplorer } from "@/components/flights/FlightResultsExplorer";

type Status = {
  configured: boolean;
  mode: string;
  markupPercent: number;
  markupPolicy: FlightMarkupPolicy;
  stripeConfigured: boolean;
  paymentMode: FlightPaymentMode;
};

type FlightSearchExperienceProps = {
  configured: boolean;
  /** Set when URL has ?owner= matching OWNER_PRICING_KEY (server-validated). */
  initialOwnerKey?: string;
};

export function FlightSearchExperience({
  configured,
  initialOwnerKey,
}: FlightSearchExperienceProps) {
  const searchParams = useSearchParams();
  const ranUrlSearch = useRef(false);
  const [ownerKey, setOwnerKey] = useState<string | undefined>(initialOwnerKey);
  const [publishedPercent, setPublishedPercent] = useState<number | null>(null);
  const [draftPercent, setDraftPercent] = useState<number | null>(null);
  const [publishedUpdatedAt, setPublishedUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [form, setForm] = useState<FlightSearchFormState>(() => createDefaultSearchForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FlightSearchResponse | null>(null);

  useEffect(() => {
    const fromUrl = parseFlightSearchParams(searchParams);
    if (
      (fromUrl?.origin && fromUrl.destination && fromUrl.departureDate) ||
      (fromUrl?.tripType === "multi_city" && fromUrl.slices?.length)
    ) {
      setForm(formStateFromUrlQuery(fromUrl));
      return;
    }
    setForm((f) => ({
      ...f,
      departureDate: f.departureDate || defaultDepartureDate(),
    }));
  }, [searchParams]);

  const loadPublished = useCallback(() => {
    fetch("/api/flights/published-markup")
      .then((r) => r.json())
      .then(
        (j: {
          ok: boolean;
          data?: {
            publishedPercent: number;
            updatedAt: string | null;
          };
        }) => {
          if (!j.ok || !j.data) return;
          setPublishedPercent(j.data.publishedPercent);
          setDraftPercent((prev) => prev ?? j.data!.publishedPercent);
          setPublishedUpdatedAt(j.data.updatedAt);
        },
      )
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/flights/status")
      .then((r) => r.json())
      .then((j: Status) => setStatus(j))
      .catch(() => null);
    loadPublished();
  }, [loadPublished]);

  useEffect(() => {
    if (initialOwnerKey) {
      storeOwnerPricingKey(initialOwnerKey);
      setOwnerKey(initialOwnerKey);
      return;
    }
    const stored = readStoredOwnerPricingKey();
    if (stored) setOwnerKey(stored);
  }, [initialOwnerKey]);

  const runSearch = useCallback(async (payload: FlightSearchFormState) => {
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formStateToSearchRequest(payload),
          ...(ownerKey ? { ownerKey } : {}),
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: FlightSearchResponse;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Search failed. Try again.");
        return;
      }
      setResults(json.data);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [ownerKey]);

  const onSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await runSearch(form);
    },
    [form, runSearch],
  );

  useEffect(() => {
    if (!configured || ranUrlSearch.current) return;
    const fromUrl = parseFlightSearchParams(searchParams);
    const canSearch =
      (fromUrl?.tripType === "multi_city" && fromUrl.slices?.length) ||
      (fromUrl?.origin && fromUrl.destination && fromUrl.departureDate);
    if (!canSearch) return;
    ranUrlSearch.current = true;
    void runSearch(formStateFromUrlQuery(fromUrl));
  }, [configured, searchParams, runSearch]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">Duffel is not configured on this server.</p>
        <p className="mt-2 text-amber-900/90">
          Add <code className="rounded bg-white/80 px-1">DUFFEL_API_TOKEN</code> to{" "}
          <code className="rounded bg-white/80 px-1">.env.local</code> (test token starts with{" "}
          <code className="rounded bg-white/80 px-1">duffel_test_</code>), set{" "}
          <code className="rounded bg-white/80 px-1">DUFFEL_MODE=test</code>, then restart the
          dev server.
        </p>
      </div>
    );
  }

  const isMulti = form.tripType === "multi_city";
  const ownerViewActive = results?.pricingView === "owner";
  const liveFeePercent = publishedPercent ?? status?.markupPercent ?? 8;

  return (
    <div className="space-y-10">
      {status ? (
        <p className="text-sm text-stone-600">
          Duffel mode: <strong className="text-stone-800">{status.mode}</strong>
          {" "}
          · Live service fee:{" "}
          <strong className="text-stone-800">{liveFeePercent}%</strong>
          {ownerKey ? " (you can publish a new rate below)" : null}{" "}
          · Payment:{" "}
          <strong className="text-stone-800">
            {status.paymentMode === "stripe" ? "Stripe card" : "Duffel test balance"}
          </strong>
        </p>
      ) : null}

      <form
        onSubmit={onSearch}
        className="overflow-visible rounded-3xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50/80 p-6 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.15)] sm:p-8"
      >
        <h2 className="font-display text-2xl font-bold text-stone-900">Search flights</h2>
        <p className="mt-2 text-sm text-stone-600">
          Compare live fares, filter by stops or airline, and search flexible dates to find
          competitive prices.
        </p>
        <div className="mt-3">
          <FlightCustomerPricingNote />
        </div>

        {ownerKey && status?.markupPolicy && publishedPercent != null && draftPercent != null ? (
          <div className="mt-6">
            <PublishedServiceFeePanel
              policy={status.markupPolicy}
              publishedPercent={publishedPercent}
              draftPercent={draftPercent}
              ownerKey={ownerKey}
              updatedAt={publishedUpdatedAt}
              onDraftChange={setDraftPercent}
              onPublished={(percent, updatedAt) => {
                setPublishedPercent(percent);
                setDraftPercent(percent);
                setPublishedUpdatedAt(updatedAt);
                loadPublished();
              }}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <TripTypeSelector
            value={form.tripType}
            onChange={(tripType) => setForm((f) => applyTripTypeChange(f, tripType))}
          />
        </div>

        {isMulti ? (
          <div className="mt-6">
            <MultiCityLegsEditor
              legs={form.legs}
              onChange={(legs) => setForm({ ...form, legs })}
              enableSuggestions={configured}
            />
          </div>
        ) : (
          <div className={`mt-6 ${flightSearchPanel} p-4`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr] lg:items-end">
              <PlaceAutocomplete
                label="From"
                value={form.origin}
                onChange={(origin) => setForm({ ...form, origin })}
                enableSuggestions={configured}
                placeholder="e.g. London or LHR"
                required
              />
              <div className="flex items-end justify-center pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      origin: f.destination,
                      destination: f.origin,
                    }))
                  }
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
                  title="Swap origin and destination"
                  aria-label="Swap origin and destination"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <PlaceAutocomplete
                label="To"
                value={form.destination}
                onChange={(destination) => setForm({ ...form, destination })}
                enableSuggestions={configured}
                placeholder="e.g. New York or JFK"
                required
              />
              <label className="block text-sm">
                <span className={flightFieldLabel}>Depart</span>
                <input
                  required
                  type="date"
                  value={form.departureDate}
                  onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                  className={flightFieldInput}
                />
              </label>
              {form.tripType === "return" ? (
                <label className="block text-sm">
                  <span className={flightFieldLabel}>Return</span>
                  <input
                    required
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    className={flightFieldInput}
                  />
                </label>
              ) : null}
            </div>
          </div>
        )}

        {!isMulti ? (
          <div className="mt-5 space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-3">
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={form.directOnly}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      directOnly: e.target.checked,
                      maxConnections: e.target.checked ? 0 : 1,
                    })
                  }
                  className="rounded border-stone-300 text-sky-600"
                />
                Direct / nonstop only
              </label>
              {!form.directOnly ? (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
                  <span>Max connections</span>
                  <select
                    value={String(form.maxConnections)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxConnections: Number.parseInt(e.target.value, 10) as 1 | 2,
                      })
                    }
                    className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm font-semibold"
                  >
                    <option value="1">Up to 1 stop (recommended)</option>
                    <option value="2">Up to 2 stops</option>
                  </select>
                </label>
              ) : null}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
                <span>Flexible dates</span>
                <select
                  value={String(form.flexDays)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      flexDays: Number.parseInt(e.target.value, 10) as 0 | 1 | 3,
                    })
                  }
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm font-semibold"
                >
                  <option value="0">Exact dates only</option>
                  <option value="1">±1 day (recommended)</option>
                  <option value="3">±3 days</option>
                </select>
              </label>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, showTimeFilters: !f.showTimeFilters }))}
                className="text-sm font-semibold text-amber-900/90 hover:underline"
              >
                {form.showTimeFilters ? "Hide" : "Show"} outbound time filters (optional)
              </button>
              {form.showTimeFilters ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-sm">
                    <span className={flightFieldLabel}>Depart after</span>
                    <input
                      type="time"
                      value={form.outboundDepartureTimeFrom}
                      onChange={(e) =>
                        setForm({ ...form, outboundDepartureTimeFrom: e.target.value })
                      }
                      className={flightFieldInput}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className={flightFieldLabel}>Depart before</span>
                    <input
                      type="time"
                      value={form.outboundDepartureTimeTo}
                      onChange={(e) =>
                        setForm({ ...form, outboundDepartureTimeTo: e.target.value })
                      }
                      className={flightFieldInput}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className={flightFieldLabel}>Arrive after</span>
                    <input
                      type="time"
                      value={form.outboundArrivalTimeFrom}
                      onChange={(e) =>
                        setForm({ ...form, outboundArrivalTimeFrom: e.target.value })
                      }
                      className={flightFieldInput}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className={flightFieldLabel}>Arrive before</span>
                    <input
                      type="time"
                      value={form.outboundArrivalTimeTo}
                      onChange={(e) =>
                        setForm({ ...form, outboundArrivalTimeTo: e.target.value })
                      }
                      className={flightFieldInput}
                    />
                  </label>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-stone-500">
                Time filters apply to the outbound flight only and speed up search when you know
                your schedule (Duffel best practice).
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className={flightFieldLabel}>Cabin</span>
            <select
              value={form.cabinClass}
              onChange={(e) =>
                setForm({
                  ...form,
                  cabinClass: e.target.value as FlightSearchFormState["cabinClass"],
                })
              }
              className={flightFieldInput}
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className={flightFieldLabel}>Adults</span>
            <input
              type="number"
              min={1}
              max={9}
              value={form.adults}
              onChange={(e) =>
                setForm({ ...form, adults: Number.parseInt(e.target.value, 10) || 1 })
              }
              className={flightFieldInput}
            />
          </label>
          <label className="block text-sm">
            <span className={flightFieldLabel}>Children</span>
            <input
              type="number"
              min={0}
              max={8}
              value={form.children}
              onChange={(e) =>
                setForm({ ...form, children: Number.parseInt(e.target.value, 10) || 0 })
              }
              className={flightFieldInput}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className={`${flightSearchSubmit} w-full disabled:opacity-60`}
            >
              {loading
                ? form.flexDays && !isMulti
                  ? "Searching flexible dates…"
                  : "Searching airlines…"
                : "Compare fares"}
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900"
        >
          {error}
        </div>
      ) : null}

      {ownerViewActive ? (
        <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-600">
          Private margin view — customers only see the ticket price. Bookmark this page with your{" "}
          <code className="rounded bg-white px-1">?owner=</code> link to keep it in this browser
          session.
        </p>
      ) : null}

      {results ? (
        <FlightResultsExplorer results={results} ownerView={ownerViewActive} />
      ) : null}
    </div>
  );
}
