import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/CategoryHubPage";
import { getCategoryMeta } from "@/lib/guides";

const category = "weekends" as const;
const m = getCategoryMeta(category);

export const metadata: Metadata = {
  title: m.shortTitle,
  description:
    "Weekend trip ideas with live flight search—compare real-time airfares, book on Skyline Voyager, and plan premium short breaks.",
};

export default function WeekendTripsHubPage() {
  return (
    <CategoryHubPage
      category={category}
      showLiveFlightSearch
      flightSearchDefaults={{ origin: "LAX", destination: "LAS" }}
    />
  );
}
