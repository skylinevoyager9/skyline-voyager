import { site, siteLogoAbsoluteUrl } from "@/lib/site";

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: site.legalName,
      url: site.url,
      email: site.email,
      logo: siteLogoAbsoluteUrl(),
      description:
        "Independent editorial travel publisher focused on US trips—hotels and lodging, flights, weekends, national parks, and premium ground transport—with transparent partner links.",
    },
    {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      publisher: { "@type": "Organization", name: site.legalName },
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
