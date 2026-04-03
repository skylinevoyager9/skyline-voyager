"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getCategoryMeta, type Guide } from "@/lib/guides";
import { guideCoverImageSrc } from "@/lib/guides/cover-images";
import { GUIDE_CARD_GRADIENTS } from "@/lib/guides/hub-theme";

type Props = {
  guide: Guide;
  /** e.g. "relative h-32 sm:h-36" or "relative h-24 sm:h-28" */
  className?: string;
  sizes?: string;
};

function gradientForSlug(slug: string): string {
  const n = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GUIDE_CARD_GRADIENTS[n % GUIDE_CARD_GRADIENTS.length]!;
}

/**
 * Cover photo for guide cards. Image is decorative; the card title is the accessible name.
 * Falls back to a gradient if the remote URL fails (e.g. removed from CDN).
 */
export function GuideCardHero({
  guide,
  className = "relative h-32 sm:h-36",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: Props) {
  const cat = getCategoryMeta(guide.category);
  const src = useMemo(
    () => guideCoverImageSrc(guide),
    [guide.category, guide.slug],
  );
  const [failed, setFailed] = useState(false);
  const gradient = useMemo(() => gradientForSlug(guide.slug), [guide.slug]);

  return (
    <div className={`${className} overflow-hidden`}>
      {failed ? (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
          aria-hidden
        />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        aria-hidden
      />
      <span
        className="absolute bottom-4 left-5 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/95 text-xl text-stone-800 shadow-lg backdrop-blur-sm"
        aria-hidden
      >
        {cat.icon}
      </span>
    </div>
  );
}
