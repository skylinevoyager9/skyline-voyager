import { guides } from "./data";
import type { Guide, GuideDestination } from "./types";

export type DestinationMeta = {
  id: GuideDestination;
  title: string;
  shortTitle: string;
  path: string;
  description: string;
  icon: string;
};

export const DESTINATION_META: DestinationMeta[] = [
  {
    id: "usa",
    title: "United States travel",
    shortTitle: "USA",
    path: "/destinations/usa",
    description:
      "Domestic flights, national parks, weekend trips, and US-focused planning.",
    icon: "🇺🇸",
  },
  {
    id: "australia",
    title: "Australia travel",
    shortTitle: "Australia",
    path: "/destinations/australia",
    description:
      "Cities, coasts, and outback logistics for visitors from the US and beyond.",
    icon: "🇦🇺",
  },
  {
    id: "bali",
    title: "Bali & Indonesia travel",
    shortTitle: "Bali",
    path: "/destinations/bali",
    description:
      "Island logistics, visas on arrival, and planning a first Bali trip.",
    icon: "🇮🇩",
  },
  {
    id: "europe",
    title: "Europe travel",
    shortTitle: "Europe",
    path: "/destinations/europe",
    description:
      "Schengen basics, rail and hubs, and multi-country trip framing.",
    icon: "🇪🇺",
  },
  {
    id: "uk",
    title: "United Kingdom travel",
    shortTitle: "UK",
    path: "/destinations/uk",
    description:
      "London hubs, UK entry rules for US visitors, and island hopping.",
    icon: "🇬🇧",
  },
];

export function getDestinationMeta(id: GuideDestination): DestinationMeta {
  const m = DESTINATION_META.find((d) => d.id === id);
  if (!m) throw new Error(`Unknown destination: ${id}`);
  return m;
}

/** Regions for a guide; legacy guides without `regions` are treated as USA-only. */
export function guideRegions(guide: Guide): GuideDestination[] {
  if (guide.regions?.length) return guide.regions;
  return ["usa"];
}

export function getGuidesByDestination(region: GuideDestination): Guide[] {
  return guides.filter((g) => guideRegions(g).includes(region));
}

export function getAllDestinationIds(): GuideDestination[] {
  return DESTINATION_META.map((d) => d.id);
}
