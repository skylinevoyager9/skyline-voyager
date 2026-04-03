import type { Metadata } from "next";
import { AffiliateDisclosureBlock } from "@/components/AffiliateDisclosureBlock";
import { AffiliatePartnerProgramSlot } from "@/components/AffiliatePartnerProgramSlot";
import { AffiliateStaySearchCta } from "@/components/AffiliateStaySearchCta";
import { CategoryHubPage } from "@/components/CategoryHubPage";
import { getCategoryMeta } from "@/lib/guides";

const category = "hotels" as const;
const m = getCategoryMeta(category);

export const metadata: Metadata = {
  title: m.shortTitle,
  description: m.description,
};

export default function HotelsHubPage() {
  return (
    <CategoryHubPage
      category={category}
      prePartnerSlot={
        <>
          <AffiliateStaySearchCta />
          <div className="grid gap-6 lg:grid-cols-2">
            <AffiliateDisclosureBlock />
            <AffiliatePartnerProgramSlot />
          </div>
        </>
      }
    />
  );
}
