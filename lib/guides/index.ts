import { guides } from "./data";
import type { Guide, GuideCategory } from "./types";
export type {
  CategoryMeta,
  Guide,
  GuideCategory,
  GuideDestination,
} from "./types";
export { CATEGORY_META, getCategoryMeta } from "./types";
export { guides };
export { guideCoverImageSrc } from "./cover-images";
export {
  DESTINATION_META,
  getAllDestinationIds,
  getDestinationMeta,
  getGuidesByDestination,
  guideRegions,
} from "./destinations";
export { buildHeadingIdMap, getGuideToc } from "./headings";

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}

export function getAllSlugs(): string[] {
  return guides.map((g) => g.slug);
}

export function getGuidesByCategory(category: GuideCategory) {
  return guides.filter((g) => g.category === category);
}

export function guidesSortedByDate() {
  return [...guides].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/** Same topic first, then newest from other topics. */
export function getRelatedGuides(guide: Guide, limit = 4): Guide[] {
  const sorted = guidesSortedByDate();
  const same = sorted.filter(
    (g) => g.slug !== guide.slug && g.category === guide.category,
  );
  const other = sorted.filter(
    (g) => g.slug !== guide.slug && g.category !== guide.category,
  );
  return [...same, ...other].slice(0, limit);
}
