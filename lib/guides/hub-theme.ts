import type { PartnerKey } from "@/lib/partner-links";
import type { GuideCategory } from "./types";

/**
 * Premium / business-travel hub themes — dark, editorial palettes + soft gold sheen.
 * heroGlow: extra radial layer (CSS) for depth; no layout impact.
 */
export const HUB_THEME: Record<
  GuideCategory,
  {
    gradient: string;
    heroGlow: string;
    eyebrow: string;
    bookingHook: string;
  }
> = {
  flights: {
    gradient:
      "bg-gradient-to-br from-slate-950 via-blue-950 to-black",
    heroGlow:
      "radial-gradient(ellipse 80% 50% at 85% 15%, rgba(212,175,55,0.14), transparent 55%), radial-gradient(ellipse 60% 40% at 10% 90%, rgba(56,189,248,0.08), transparent 50%)",
    eyebrow: "Business & premium cabins · Schedule control",
    bookingHook:
      "Compare cabins—from economy to business and first—side by side with live fares. Flexible dates help you protect your calendar; checkout stays on the airline or OTA you select.",
  },
  hotels: {
    gradient:
      "bg-gradient-to-br from-zinc-900 via-stone-900 to-violet-950",
    heroGlow:
      "radial-gradient(ellipse 70% 50% at 75% 20%, rgba(196,181,253,0.12), transparent 50%), radial-gradient(ellipse 50% 40% at 20% 85%, rgba(212,175,55,0.1), transparent 45%)",
    eyebrow: "Five-star · Boutique · Suites & residences",
    bookingHook:
      "Filter for quality, neighborhood, and the amenities that matter—club floors, spas, late checkout where offered. Book directly with the platform that shows the full rate picture.",
  },
  weekends: {
    gradient:
      "bg-gradient-to-br from-neutral-950 via-stone-900 to-amber-950",
    heroGlow:
      "radial-gradient(ellipse 75% 55% at 80% 25%, rgba(251,191,36,0.12), transparent 50%), radial-gradient(ellipse 45% 35% at 15% 80%, rgba(255,255,255,0.06), transparent 45%)",
    eyebrow: "Short breaks · City & coast · Minimal friction",
    bookingHook:
      "Elevate Friday–Sunday with stays that match your standards—signature dining, skyline views, or quiet country inns. Pair flights or drives in one planning flow.",
  },
  parks: {
    gradient:
      "bg-gradient-to-br from-emerald-950 via-teal-950 to-black",
    heroGlow:
      "radial-gradient(ellipse 70% 50% at 70% 15%, rgba(52,211,153,0.1), transparent 50%), radial-gradient(ellipse 55% 45% at 25% 90%, rgba(212,175,55,0.08), transparent 45%)",
    eyebrow: "Iconic parks · Private & small-group options",
    bookingHook:
      "Secure gateway lodging, premium SUVs for scenic drives, and curated tours when you want logistics off your plate—without sacrificing comfort near the trailhead.",
  },
  cars: {
    gradient:
      "bg-gradient-to-br from-zinc-950 via-neutral-900 to-black",
    heroGlow:
      "radial-gradient(ellipse 65% 45% at 85% 30%, rgba(212,175,55,0.11), transparent 50%), radial-gradient(ellipse 50% 40% at 10% 75%, rgba(161,161,170,0.12), transparent 45%)",
    eyebrow: "Executive & premium SUV classes",
    bookingHook:
      "Compare full-size, luxury, and SUV categories with transparent add-ons—airport meet-and-greet lanes, one-way returns, and toll-ready vehicles when you need them.",
  },
  planning: {
    gradient:
      "bg-gradient-to-br from-slate-950 via-cyan-950 to-black",
    heroGlow:
      "radial-gradient(ellipse 70% 50% at 75% 20%, rgba(34,211,238,0.1), transparent 50%), radial-gradient(ellipse 45% 40% at 20% 85%, rgba(212,175,55,0.09), transparent 45%)",
    eyebrow: "Time-efficient · Risk-aware · Then book with clarity",
    bookingHook:
      "Insurance, baggage, and budget frameworks for travelers who value predictability. When you are ready, open flights and hotels in a new tab—no clutter on this page.",
  },
};

export const HUB_EMPHASIS: Record<GuideCategory, PartnerKey> = {
  flights: "flights",
  hotels: "booking",
  weekends: "booking",
  parks: "viator",
  cars: "cars",
  planning: "flights",
};

/** Rotating gradient caps for guide cards (topic hubs + `/guides` index). */
export const GUIDE_CARD_GRADIENTS = [
  "from-slate-700 to-slate-950",
  "from-zinc-700 to-zinc-950",
  "from-stone-700 to-stone-950",
  "from-neutral-700 to-neutral-950",
  "from-slate-600 to-blue-950",
  "from-stone-600 to-amber-950",
] as const;

/** All-topics library landing — matches hub hero language and depth. */
export const LIBRARY_HUB_THEME = {
  gradient:
    "bg-gradient-to-br from-slate-950 via-zinc-900 to-amber-950",
  heroGlow:
    "radial-gradient(ellipse 78% 52% at 82% 12%, rgba(251,191,36,0.14), transparent 52%), radial-gradient(ellipse 58% 42% at 12% 88%, rgba(56,189,248,0.08), transparent 48%), radial-gradient(ellipse 45% 38% at 55% 55%, rgba(255,255,255,0.05), transparent 55%)",
  eyebrow: "Flights · Hotels · Weekends · Parks · Cars · Planning",
  bookingHook:
    "Editorial guides for travelers who read the fine print—then book with live fares and real inventory on the partners you already trust. Every topic, one library.",
} as const;
