export type GuideCategory =
  | "flights"
  | "hotels"
  | "weekends"
  | "parks"
  | "cars"
  | "planning";

/** Where the guide applies; omit on legacy entries → treated as USA-only. */
export type GuideDestination = "usa" | "australia" | "bali" | "europe" | "uk";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: GuideCategory;
  body: string;
  /** If empty / omitted, the guide is listed under USA only. */
  regions?: GuideDestination[];
};

export type CategoryMeta = {
  id: GuideCategory;
  title: string;
  shortTitle: string;
  path: string;
  description: string;
  icon: string;
};

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: "flights",
    title: "Business & premium air travel",
    shortTitle: "Flights",
    path: "/flights",
    description:
      "Cabins, fare classes, bags, and timing—for travelers who care about comfort and schedule control.",
    icon: "✈",
  },
  {
    id: "hotels",
    title: "Premium hotels & stays",
    shortTitle: "Hotels",
    path: "/hotels",
    description:
      "Five-star, boutique, and suite-style stays—reviews, resort fees, and rentals vs. hotels.",
    icon: "🏨",
  },
  {
    id: "weekends",
    title: "Elevated weekend escapes",
    shortTitle: "Weekends",
    path: "/weekend-trips",
    description:
      "Short breaks with a premium lens—city, coast, wine country, and long-weekend logistics.",
    icon: "🌅",
  },
  {
    id: "parks",
    title: "National parks — refined travel",
    shortTitle: "Parks",
    path: "/national-parks",
    description:
      "Passes, seasons, gateway towns, and comfort-forward ways to experience iconic US parks.",
    icon: "🏞",
  },
  {
    id: "cars",
    title: "Premium & executive car rental",
    shortTitle: "Cars",
    path: "/car-rentals",
    description:
      "SUV and premium classes, airport pickup, insurance clarity, and one-way flexibility.",
    icon: "🚗",
  },
  {
    id: "planning",
    title: "Executive trip planning",
    shortTitle: "Planning",
    path: "/travel-planning",
    description:
      "Insurance, packing, and budgets for travelers who want predictability before they book.",
    icon: "📋",
  },
];

export function getCategoryMeta(id: GuideCategory): CategoryMeta {
  const m = CATEGORY_META.find((c) => c.id === id);
  if (!m) throw new Error(`Unknown category: ${id}`);
  return m;
}
