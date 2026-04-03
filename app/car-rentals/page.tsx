import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/CategoryHubPage";
import { getCategoryMeta } from "@/lib/guides";

const category = "cars" as const;
const m = getCategoryMeta(category);

export const metadata: Metadata = {
  title: m.shortTitle,
  description: m.description,
};

export default function CarRentalsHubPage() {
  return <CategoryHubPage category={category} />;
}
