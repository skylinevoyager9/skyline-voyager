"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlightCustomerPricingNote } from "@/components/flights/FlightCustomerPricingNote";
import type { StaySearchResponse, StaySearchResultSummary } from "@/lib/duffel/stays-types";
import { STAY_SEARCH_LOCATIONS } from "@/lib/stays/locations";
import {
  staysFieldInput,
  staysFieldLabel,
  staysSearchPanel,
  staysSearchSubmit,
} from "@/components/stays/stays-search-ui";
import { formatMoney } from "@/lib/flights/format";

type Status = {
  configured: boolean;
  mode: string;
  markupPercent: number;
  paymentMode: string;
};

function defaultCheckIn(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function defaultCheckOut(from: string): string {
  const d = new Date(`${from}T12:00:00`);
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

type Props = { configured: boolean };

export function StaysSearchExperience({ configured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ranUrlSearch = useRef(false);

  const [status, setStatus] = useState<Status | null>(null);
  const [location, setLocation] = useState("New York, NY");
  const [checkIn, setCheckIn] = useState(defaultCheckIn());
  const [checkOut, setCheckOut] = useState(defaultCheckOut(defaultCheckIn()));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StaySearchResponse | null>(null);

  useEffect(() => {
    const loc = searchParams.get("location");
    const ci = searchParams.get("checkIn");
    const co = searchParams.get("checkOut");
    if (loc) setLocation(loc);
    if (ci) setCheckIn(ci);
    if (co) setCheckOut(co);
    const r = searchParams.get("rooms");
    const a = searchParams.get("adults");
    if (r) setRooms(Number.parseInt(r, 10) || 1);
    if (a) setAdults(Number.parseInt(a, 10) || 2);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/stays/status")
      .then((r) => r.json())
      .then((j: Status) => setStatus(j))
      .catch(() => null);
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const preset = STAY_SEARCH_LOCATIONS.find((p) => p.label === location);
      const res = await fetch("/api/stays/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationQuery: location,
          latitude: preset?.latitude,
          longitude: preset?.longitude,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          rooms,
          adults,
          children,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: StaySearchResponse;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Search failed.");
        return;
      }
      setResults(json.data);
      const q = new URLSearchParams({
        location,
        checkIn,
        checkOut,
        rooms: String(rooms),
        adults: String(adults),
      });
      router.replace(`/stays/search?${q.toString()}`, { scroll: false });
    } catch {
      setError("Search request failed.");
    } finally {
      setLoading(false);
    }
  }, [location, checkIn, checkOut, rooms, adults, children, router]);

  useEffect(() => {
    if (ranUrlSearch.current || !configured) return;
    const loc = searchParams.get("location");
    const ci = searchParams.get("checkIn");
    if (loc && ci) {
      ranUrlSearch.current = true;
      void runSearch();
    }
  }, [configured, searchParams, runSearch]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch();
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-stone-700">
        <p className="font-semibold">Duffel is not configured on this server.</p>
        <p className="mt-2">
          Add <code className="rounded bg-white/80 px-1">DUFFEL_API_TOKEN</code> to{" "}
          <code className="rounded bg-white/80 px-1">.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {status ? (
        <p className="text-sm text-stone-600">
          Duffel mode: <strong className="text-stone-800">{status.mode}</strong>
          {status.markupPercent > 0 ? (
            <>
              {" "}
              · Service fee: <strong className="text-stone-800">{status.markupPercent}%</strong>
            </>
          ) : null}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className={staysSearchPanel}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={staysFieldLabel}>Destination</span>
            <input
              className={staysFieldInput}
              list="stay-locations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <datalist id="stay-locations">
              {STAY_SEARCH_LOCATIONS.map((p) => (
                <option key={p.label} value={p.label} />
              ))}
            </datalist>
          </label>
          <label>
            <span className={staysFieldLabel}>Check-in</span>
            <input
              type="date"
              className={staysFieldInput}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) setCheckOut(defaultCheckOut(e.target.value));
              }}
              required
            />
          </label>
          <label>
            <span className={staysFieldLabel}>Check-out</span>
            <input
              type="date"
              className={staysFieldInput}
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </label>
          <label>
            <span className={staysFieldLabel}>Rooms</span>
            <input
              type="number"
              min={1}
              max={8}
              className={staysFieldInput}
              value={rooms}
              onChange={(e) => setRooms(Number.parseInt(e.target.value, 10) || 1)}
            />
          </label>
          <label>
            <span className={staysFieldLabel}>Adults</span>
            <input
              type="number"
              min={1}
              max={9}
              className={staysFieldInput}
              value={adults}
              onChange={(e) => setAdults(Number.parseInt(e.target.value, 10) || 1)}
            />
          </label>
          <label>
            <span className={staysFieldLabel}>Children</span>
            <input
              type="number"
              min={0}
              max={8}
              className={staysFieldInput}
              value={children}
              onChange={(e) => setChildren(Number.parseInt(e.target.value, 10) || 0)}
            />
          </label>
        </div>
        <button type="submit" disabled={loading} className={`${staysSearchSubmit} mt-6`}>
          {loading ? "Searching…" : "Search stays"}
        </button>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-medium">{error}</p>
            {error.includes("not enabled") || error.includes("contact-us") ? (
              <p className="mt-2 text-red-800">
                Duffel replied: this feature is not enabled for your account. Flights can work
                while Stays is off. Contact{" "}
                <a
                  href="mailto:support@duffel.com"
                  className="font-semibold underline underline-offset-2"
                >
                  support@duffel.com
                </a>{" "}
                or{" "}
                <a
                  href="https://duffel.com/contact-us"
                  className="font-semibold underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  duffel.com/contact-us
                </a>
                . No code or env change fixes this until they enable Stays.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

      <FlightCustomerPricingNote />

      {results ? (
        <section>
          <h2 className="font-display text-xl font-bold text-stone-900">
            {results.results.length} propert{results.results.length === 1 ? "y" : "ies"} found
          </h2>
          <ul className="mt-6 space-y-4">
            {results.results.map((r) => (
              <StayResultCard key={r.searchResultId} result={r} />
            ))}
          </ul>
          {results.results.length === 0 ? (
            <p className="mt-4 text-sm text-stone-600">No availability for these dates. Try different dates or a wider area.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function StayResultCard({ result }: { result: StaySearchResultSummary }) {
  const href = `/stays/book?searchResultId=${encodeURIComponent(result.searchResultId)}&name=${encodeURIComponent(result.name)}`;
  return (
    <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-900/25 hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {result.photoUrl ? (
          <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-44">
            <Image
              src={result.photoUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
              unoptimized
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900">{result.name}</h3>
            <p className="mt-1 text-sm text-stone-600">
              {[result.lineOne, result.cityName].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {result.checkInDate} → {result.checkOutDate} · {result.rooms} room
              {result.rooms > 1 ? "s" : ""}
            </p>
            {result.reviewScore ? (
              <p className="mt-2 text-sm text-stone-700">
                Guest rating: <strong>{result.reviewScore.toFixed(1)}</strong>
                {result.rating ? ` · ${result.rating}-star` : ""}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="text-lg font-bold text-stone-900">
              {formatMoney(result.customerAmount, result.currency)}
              <span className="ml-1 text-sm font-normal text-stone-500">total</span>
            </p>
            <Link
              href={href}
              className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-amber-950 px-5 text-sm font-bold text-white hover:bg-amber-900"
            >
              View rooms
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
