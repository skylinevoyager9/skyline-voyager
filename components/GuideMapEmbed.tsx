type Props = {
  title: string;
  embedSrc: string;
  openInMapsHref: string;
};

/** Responsive Google Maps embed for long-form road-trip guides. */
export function GuideMapEmbed({ title, embedSrc, openInMapsHref }: Props) {
  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
        <figcaption className="font-display text-sm font-semibold text-stone-900">
          {title}
        </figcaption>
        <a
          href={openInMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs font-medium text-sky-800 hover:underline"
        >
          Open full route in Google Maps →
        </a>
      </div>
      <div className="relative aspect-[16/10] w-full bg-stone-100">
        <iframe
          title={title}
          src={embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </figure>
  );
}
