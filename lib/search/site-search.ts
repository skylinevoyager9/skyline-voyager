import { guides } from "@/lib/guides/data";
import {
  DESTINATION_META,
  getDestinationMeta,
  guideRegions,
} from "@/lib/guides/destinations";
import { CATEGORY_META, getCategoryMeta } from "@/lib/guides/types";
import { site } from "@/lib/site";

export type SearchItemType = "guide" | "destination" | "hub" | "page";

export type SearchItem = {
  type: SearchItemType;
  title: string;
  description: string;
  href: string;
  hint?: string;
};

const PAGE_ENTRIES: Omit<SearchItem, "type">[] = [
  {
    title: "Home",
    description: `${site.name} — USA and international travel guides, flights, hotels, and trip planning.`,
    href: "/",
    hint: "Site",
  },
  {
    title: "Travel library",
    description: "All editorial guides with search and filters by topic and destination.",
    href: "/guides",
    hint: "Guides",
  },
  {
    title: "Destinations",
    description: "Browse guides by region — USA, Australia, Bali, Europe, and the UK.",
    href: "/destinations",
    hint: "Regions",
  },
  {
    title: "About",
    description: `What ${site.name} is and how we approach travel content.`,
    href: "/about",
    hint: "Company",
  },
  {
    title: "Contact",
    description: "Email and links to legal pages.",
    href: "/contact",
    hint: "Company",
  },
  {
    title: "Legal overview",
    description: "Privacy, terms, and affiliate disclosure in one place.",
    href: "/legal",
    hint: "Legal",
  },
  {
    title: "Privacy Policy",
    description: "How we handle data on this website.",
    href: "/privacy",
    hint: "Legal",
  },
  {
    title: "Terms & Conditions",
    description: "Rules for using this website.",
    href: "/terms",
    hint: "Legal",
  },
  {
    title: "Affiliate disclosure",
    description: "How partner and affiliate links work on this site.",
    href: "/affiliate-disclosure",
    hint: "Legal",
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function textMatches(haystack: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  const blob = normalize(haystack);
  return q.split(/\s+/).every((token) => token.length > 0 && blob.includes(token));
}

function itemHaystack(item: SearchItem): string {
  return [item.title, item.description, item.hint ?? "", item.href.replace(/\//g, " ")].join(
    " ",
  );
}

let cached: SearchItem[] | null = null;

/** Full index: guides, destinations, topic hubs, and key pages. */
export function getAllSearchItems(): SearchItem[] {
  if (cached) return cached;

  const items: SearchItem[] = [];

  for (const g of guides) {
    const cat = getCategoryMeta(g.category);
    const regionLabels = guideRegions(g)
      .map((r) => {
        const d = getDestinationMeta(r);
        return `${d.shortTitle} ${d.title}`;
      })
      .join(" ");
    items.push({
      type: "guide",
      title: g.title,
      description: g.description,
      href: `/guides/${g.slug}`,
      hint: `Guide · ${cat.shortTitle} · ${regionLabels}`,
    });
  }

  for (const d of DESTINATION_META) {
    items.push({
      type: "destination",
      title: d.title,
      description: d.description,
      href: d.path,
      hint: "Destination hub",
    });
  }

  for (const c of CATEGORY_META) {
    items.push({
      type: "hub",
      title: c.title,
      description: c.description,
      href: c.path,
      hint: `Topic hub · ${c.shortTitle}`,
    });
  }

  for (const p of PAGE_ENTRIES) {
    items.push({
      type: "page",
      ...p,
    });
  }

  cached = items;
  return items;
}

const TYPE_ORDER: Record<SearchItemType, number> = {
  guide: 0,
  destination: 1,
  hub: 2,
  page: 3,
};

export function searchSite(query: string): SearchItem[] {
  const q = query.trim();
  if (!q) return [];

  const all = getAllSearchItems();
  const matched = all.filter((item) => textMatches(itemHaystack(item), q));
  matched.sort(
    (a, b) =>
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.title.localeCompare(b.title),
  );
  return matched;
}
