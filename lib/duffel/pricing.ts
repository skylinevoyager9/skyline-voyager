/**
 * Customer-facing flight pricing: one total price, service fee applied server-side.
 * Duffel is paid the airline/base amount; markup is your agency margin.
 */

import type { FlightOfferSummary } from "@/lib/duffel/types";

const DEFAULT_MARKUP_PERCENT = 8;
const DEFAULT_MAX_MARKUP_PERCENT = 20;

export type FlightMarkupPolicy = {
  defaultPercent: number;
  minPercent: number;
  maxPercent: number;
};

function parsePercentEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
  return n;
}

export function getFlightMarkupPolicy(): FlightMarkupPolicy {
  const defaultPercent = parsePercentEnv("FLIGHT_MARKUP_PERCENT", DEFAULT_MARKUP_PERCENT);
  const minPercent = parsePercentEnv("FLIGHT_MARKUP_MIN_PERCENT", 0);
  const maxPercent = parsePercentEnv("FLIGHT_MARKUP_MAX_PERCENT", DEFAULT_MAX_MARKUP_PERCENT);
  return {
    defaultPercent: clampPercent(defaultPercent, 0, 100),
    minPercent: clampPercent(minPercent, 0, 100),
    maxPercent: clampPercent(Math.max(maxPercent, defaultPercent), 0, 100),
  };
}

/** Env/bootstrap default — use getPublishedFlightMarkupPercent() for live guest pricing. */
export function getEnvFlightMarkupPercent(): number {
  return getFlightMarkupPolicy().defaultPercent;
}

/** @deprecated Use getPublishedFlightMarkupPercent() from published-markup-store. */
export function getFlightMarkupPercent(): number {
  return getEnvFlightMarkupPercent();
}

function clampPercent(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamp a requested rate to policy bounds. */
export function clampMarkupPercent(requested: number): number {
  const { minPercent, maxPercent } = getFlightMarkupPolicy();
  return clampPercent(requested, minPercent, maxPercent);
}

/** Apply percentage markup to a Duffel decimal amount string (airline base). */
export function applyFlightMarkup(
  baseAmount: string,
  markupPercent?: number,
): {
  baseAmount: string;
  markupPercent: number;
  markupAmount: string;
  customerAmount: string;
} {
  const base = Number.parseFloat(baseAmount);
  if (!Number.isFinite(base)) {
    throw new Error(`Invalid amount: ${baseAmount}`);
  }
  const percent =
    markupPercent == null ? getFlightMarkupPercent() : clampMarkupPercent(markupPercent);
  const markupValue = base * (percent / 100);
  const customerValue = base + markupValue;
  return {
    baseAmount: base.toFixed(2),
    markupPercent: percent,
    markupAmount: markupValue.toFixed(2),
    customerAmount: customerValue.toFixed(2),
  };
}

/** Re-apply service fee on an already-mapped offer (same airline base). */
export function repriceFlightOffer(
  offer: FlightOfferSummary,
  markupPercent: number,
): FlightOfferSummary {
  const pricing = applyFlightMarkup(offer.baseAmount, markupPercent);
  return {
    ...offer,
    baseAmount: pricing.baseAmount,
    markupPercent: pricing.markupPercent,
    markupAmount: pricing.markupAmount,
    customerAmount: pricing.customerAmount,
    paymentAmount: pricing.baseAmount,
  };
}

export function customerAmountsMatch(a: string, b: string, tolerance = 0.02): boolean {
  const x = Number.parseFloat(a);
  const y = Number.parseFloat(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.abs(x - y) <= tolerance;
}
