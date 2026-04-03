import type { Guide, GuideCategory } from "./types";

/**
 * Hero photos for guide cards — Unsplash (https://unsplash.com/license), free to use.
 * Per-slug URLs are thematic; unknown slugs fall back to category defaults.
 */
const Q = "auto=format&fit=crop&w=1200&q=80";

const DEFAULT_BY_CATEGORY: Record<GuideCategory, string> = {
  flights: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?${Q}`,
  hotels: `https://images.unsplash.com/photo-1566073771259-6a8506099945?${Q}`,
  weekends: `https://images.unsplash.com/photo-1469474968028-56623f02e42e?${Q}`,
  parks: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?${Q}`,
  cars: `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?${Q}`,
  planning: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${Q}`,
};

/** Per-slug Unsplash URLs (verify with `curl -I` if a photo is removed from CDN). */
const BY_SLUG: Record<string, string> = {
  "first-weekend-trip-usa": `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?${Q}`,
  "how-we-pick-hotels": `https://images.unsplash.com/photo-1566073771259-6a8506099945?${Q}`,
  "weekend-getaway-ideas": `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${Q}`,
  "book-smarter-domestic-flights": `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?${Q}`,
  "basic-economy-vs-main-cabin": `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?${Q}`,
  "bag-fees-and-carry-on-rules": `https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?${Q}`,
  "resort-fees-explained": `https://images.unsplash.com/photo-1571896349842-33c89424de2d?${Q}`,
  "vacation-rental-vs-hotel-weekend": `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?${Q}`,
  "long-weekend-holiday-planning": `https://images.unsplash.com/photo-1514565131-fce0801e5785?${Q}`,
  "friday-to-sunday-city-template": `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?${Q}`,
  "national-parks-trip-overview": `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?${Q}`,
  "grand-canyon-south-rim-one-day": `https://images.unsplash.com/photo-1501785888041-af3ef285b470?${Q}`,
  "yellowstone-first-visit-basics": `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?${Q}`,
  "zion-and-bryce-combo-notes": `https://images.unsplash.com/photo-1472214103451-9374bd1c798e?${Q}`,
  "great-smoky-mountains-crowds": `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?${Q}`,
  "airport-car-rental-usa": `https://images.unsplash.com/photo-1550355291-bbee04a92027?${Q}`,
  "one-way-rental-drop-fees": `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?${Q}`,
  "domestic-travel-insurance-basics": `https://images.unsplash.com/photo-1450101499163-c8848c66ca85?${Q}`,
  "packing-carry-on-weekend-usa": `https://images.unsplash.com/photo-1553531384-cc64ac80f931?${Q}`,
  "trip-budget-per-night-framework": `https://images.unsplash.com/photo-1554224155-6726b3ff858f?${Q}`,
  "bali-first-trip-logistics": `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${Q}`,
  "australia-domestic-flights-us-travelers": `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?${Q}`,
  "schengen-uk-basics-us-passport": `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${Q}`,
  "london-heathrow-gatwick-us-arrivals": `https://images.unsplash.com/photo-1514565131-fce0801e5785?${Q}`,
};

export function guideCoverImageSrc(guide: Guide): string {
  return BY_SLUG[guide.slug] ?? DEFAULT_BY_CATEGORY[guide.category];
}
