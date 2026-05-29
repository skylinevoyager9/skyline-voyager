"use client";

import { useState } from "react";
import type { FlightMarkupPolicy } from "@/lib/duffel/pricing";

type Props = {
  policy: FlightMarkupPolicy;
  publishedPercent: number;
  draftPercent: number;
  ownerKey: string;
  updatedAt: string | null;
  onDraftChange: (percent: number) => void;
  onPublished: (percent: number, updatedAt: string) => void;
};

/** Owner: set the service fee every customer pays on the live site. */
export function PublishedServiceFeePanel({
  policy,
  publishedPercent,
  draftPercent,
  ownerKey,
  updatedAt,
  onDraftChange,
  onPublished,
}: Props) {
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = draftPercent !== publishedPercent;

  async function publish() {
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/flights/published-markup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerKey, markupPercent: draftPercent }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { publishedPercent: number; updatedAt: string };
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not update live fee.");
        return;
      }
      onPublished(json.data.publishedPercent, json.data.updatedAt);
      setMessage(
        `Live site updated — all customers now pay fares with a ${json.data.publishedPercent}% service fee. Run a new search to see totals.`,
      );
    } catch {
      setError("Network error while saving the live fee.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-300 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Published service fee (live)</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            This is the fee <strong>every guest</strong> sees and pays — search, book, and Stripe
            all use this rate. Env default is {policy.defaultPercent}%. On Vercel, set Upstash
            Redis env vars so publish and bookings persist.
          </p>
          {updatedAt ? (
            <p className="mt-1 text-[10px] text-stone-400">
              Last published {new Date(updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Live now</p>
          <p className="font-display text-2xl font-bold tabular-nums text-emerald-800">
            {publishedPercent}%
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-stone-700">New rate to publish</p>
          <p className="font-display text-xl font-bold tabular-nums text-stone-900">
            {draftPercent}%
          </p>
        </div>
        <input
          type="range"
          min={policy.minPercent}
          max={policy.maxPercent}
          step={0.5}
          value={draftPercent}
          onChange={(e) => onDraftChange(Number.parseFloat(e.target.value))}
          className="mt-2 h-2 w-full cursor-pointer accent-stone-800"
          aria-label="Service fee percent to publish"
        />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-stone-400">
          <span>{policy.minPercent}%</span>
          <span>{policy.maxPercent}% max</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void publish()}
          disabled={publishing || !isDirty}
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing ? "Publishing…" : "Publish to live site"}
        </button>
        {isDirty ? (
          <button
            type="button"
            onClick={() => onDraftChange(publishedPercent)}
            className="text-sm font-semibold text-stone-600 underline-offset-2 hover:underline"
          >
            Reset to live {publishedPercent}%
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 text-xs leading-relaxed text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs leading-relaxed text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
