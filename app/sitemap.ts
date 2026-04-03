import type { MetadataRoute } from "next";
import { getAllDestinationIds, getAllSlugs } from "@/lib/guides";
import { site } from "@/lib/site";

const base = site.url;

export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllSlugs().map((slug) => ({
    url: `${base}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const hubs = [
    "/flights",
    "/hotels",
    "/weekend-trips",
    "/national-parks",
    "/car-rentals",
    "/travel-planning",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${base}/destinations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.88,
    },
    ...getAllDestinationIds().map((region) => ({
      url: `${base}/destinations/${region}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
    ...hubs,
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${base}/legal`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.45,
    },
    {
      url: `${base}/affiliate-disclosure`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    ...guides,
  ];
}
