import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideArticleHeader } from "@/components/GuideArticleHeader";
import { GuideArticleJsonLd } from "@/components/GuideArticleJsonLd";
import { GuideBody } from "@/components/GuideBody";
import { GuidePartnerStrip } from "@/components/GuidePartnerStrip";
import { GuideRelated } from "@/components/GuideRelated";
import {
  GuideTocDesktop,
  GuideTocMobile,
} from "@/components/GuideTableOfContents";
import {
  getAllSlugs,
  getCategoryMeta,
  getGuide,
  getGuideToc,
  getRelatedGuides,
  type GuideCategory,
} from "@/lib/guides";
import { HUB_EMPHASIS } from "@/lib/guides/hub-theme";
import { hasAnyAffiliateTracking } from "@/lib/partner-links";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const SKIP_ICON: Record<GuideCategory, string> = {
  flights: "✈️",
  hotels: "🏨",
  weekends: "🌅",
  parks: "🏞",
  cars: "🚗",
  planning: "📋",
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      publishedTime: guide.date,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const cat = getCategoryMeta(guide.category);
  const emphasizePartner = HUB_EMPHASIS[guide.category];
  const affiliateOn = hasAnyAffiliateTracking();
  const skipIcon = SKIP_ICON[guide.category];
  const toc = getGuideToc(guide.body);
  const related = getRelatedGuides(guide, 4);
  const pageUrl = `${site.url}/guides/${guide.slug}`;

  return (
    <main className="bg-stone-100">
      <GuideArticleJsonLd guide={guide} pageUrl={pageUrl} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <GuideArticleHeader guide={guide} />

        <a
          href="#book-trip"
          className="group mb-8 flex items-center justify-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-4 text-center shadow-sm ring-1 ring-stone-200/60 transition hover:border-amber-300/60 hover:shadow-md sm:justify-start sm:px-6"
        >
          <span className="text-xl" aria-hidden>
            {skipIcon}
          </span>
          <span className="text-left text-sm font-semibold leading-snug text-stone-800 sm:text-[15px]">
            Skip to booking tools — compare flights, stays, cars &amp; tours
            <span className="mt-0.5 block text-xs font-normal text-stone-500">
              Opens partner sites in a new tab · {cat.shortTitle} picks first
            </span>
          </span>
          <span
            className="ml-auto hidden text-lg text-amber-800 transition group-hover:translate-y-0.5 sm:block"
            aria-hidden
          >
            ↓
          </span>
        </a>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(12.5rem,26%)] lg:items-start lg:gap-10 xl:gap-12">
          <div>
            <GuideTocMobile items={toc} />
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-9 lg:p-10 lg:pl-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
                In this guide
              </p>
              <GuideBody markdown={guide.body} />
            </div>
            <GuideRelated guides={related} />
          </div>
          <aside className="hidden lg:block">
            <GuideTocDesktop items={toc} />
          </aside>
        </div>

        <GuidePartnerStrip
          emphasizePartner={emphasizePartner}
          title="After you read — book on partner sites"
          className="mt-10"
          sectionId="book-trip"
          tone="prestige"
          surface="library"
        />

        <p className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/90 px-5 py-4 text-sm leading-relaxed text-stone-600">
          <strong className="text-stone-900">Disclosure:</strong>{" "}
          {affiliateOn ? (
            <>
              This page may contain affiliate links. You are not charged extra.
            </>
          ) : (
            <>
              Outbound booking links are not tracked as affiliate links on this
              site yet; see our disclosure for how that may change.
            </>
          )}{" "}
          <Link
            href="/affiliate-disclosure"
            className="font-semibold text-amber-900 underline decoration-amber-900/30 underline-offset-2 hover:decoration-amber-900"
          >
            {affiliateOn ? "Learn more" : "Partner disclosure"}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
