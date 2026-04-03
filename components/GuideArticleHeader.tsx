import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/lib/guides";
import { getCategoryMeta, getDestinationMeta, guideRegions } from "@/lib/guides";
import { guideCoverImageSrc } from "@/lib/guides/cover-images";
import { HUB_THEME } from "@/lib/guides/hub-theme";

export function GuideArticleHeader({ guide }: { guide: Guide }) {
  const cat = getCategoryMeta(guide.category);
  const theme = HUB_THEME[guide.category];
  const src = guideCoverImageSrc(guide);
  const regions = guideRegions(guide);

  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl shadow-xl shadow-stone-900/10 ring-1 ring-black/5 sm:mb-10">
      <div className="relative aspect-[5/4] min-h-[240px] sm:aspect-[2.1/1] sm:min-h-[260px] lg:min-h-[300px]">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/82 to-stone-900/40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{ background: theme.heroGlow }}
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-8 lg:p-10">
          <nav className="text-sm text-white/65" aria-label="Breadcrumb">
            <Link
              href="/"
              className="font-medium text-white/90 hover:text-white hover:underline"
            >
              Home
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <Link
              href="/guides"
              className="font-medium text-white/90 hover:text-white hover:underline"
            >
              Guides
            </Link>
            <span className="mx-2 text-white/35">/</span>
            <Link
              href={cat.path}
              className="font-medium text-white/90 hover:text-white hover:underline"
            >
              {cat.shortTitle}
            </Link>
          </nav>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/95">
              {theme.eyebrow}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                <span aria-hidden>{cat.icon}</span>
                {cat.shortTitle}
              </span>
              {regions.map((rid) => {
                const d = getDestinationMeta(rid);
                return (
                  <Link
                    key={rid}
                    href={d.path}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-black/35 hover:text-white"
                  >
                    <span aria-hidden>{d.icon}</span>
                    {d.shortTitle}
                  </Link>
                );
              })}
            </div>
            <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
              {guide.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {guide.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/15 pt-5 text-sm text-white/60">
              <time dateTime={guide.date}>Published {guide.date}</time>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>{guide.readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
