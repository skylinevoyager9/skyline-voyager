import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/CategoryHubPage";
import { getCategoryMeta } from "@/lib/guides";

const category = "flights" as const;
const m = getCategoryMeta(category);

export const metadata: Metadata = {
  title: m.shortTitle,
  description: m.description,
};

export default function FlightsHubPage() {
  return <CategoryHubPage category={category} />;
}
