import type { Guide } from "@/lib/guides";
import { guideCoverImageSrc } from "@/lib/guides/cover-images";
import { site } from "@/lib/site";

type Props = {
  guide: Guide;
  pageUrl: string;
};

export function GuideArticleJsonLd({ guide, pageUrl }: Props) {
  const imageUrl = guideCoverImageSrc(guide);

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date,
    image: imageUrl.startsWith("http") ? imageUrl : `${site.url}${imageUrl}`,
    author: {
      "@type": "Organization",
      name: site.legalName,
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      name: site.legalName,
      url: site.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
