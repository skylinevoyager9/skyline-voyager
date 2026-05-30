import type { Metadata } from "next";
import { AffiliateDisclosureBlock } from "@/components/AffiliateDisclosureBlock";
import { CategoryHubPage } from "@/components/CategoryHubPage";
import { getCategoryMeta } from "@/lib/guides";

const category = "hotels" as const;
const m = getCategoryMeta(category);

export const metadata: Metadata = {
  title: m.shortTitle,
  description:
    "Hotel guides plus live stay search—book hotels and flights on Skyline Voyager via Duffel.",
};

export default function HotelsHubPage() {
  return (
    <CategoryHubPage
      category={category}
      showLiveFlightSearch
      showLiveStaysSearch
      prePartnerSlot={<AffiliateDisclosureBlock />}
    />
  );
}
