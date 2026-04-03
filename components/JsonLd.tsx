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
