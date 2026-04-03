import Link from "next/link";
import { getCategoryMeta, type Guide } from "@/lib/guides";

type Props = {
  guides: Guide[];
};

export function GuideRelated({ guides }: Props) {
  if (guides.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-stone-200 pt-10"
      aria-labelledby="related-guides-heading"
    >
      <h2
        id="related-guides-heading"
        className="font-display text-xl font-bold text-stone-900 sm:text-2xl"
      >
        Related guides
      </h2>
      <p className="mt-2 max-w-xl text-sm text-stone-600">
        Same topic first, then recent picks from other categories.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {guides.map((g) => {
          const cat = getCategoryMeta(g.category);
          return (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="group block rounded-2xl border border-stone-200 bg-stone-50/80 p-5 transition hover:border-amber-800/25 hover:bg-white hover:shadow-md"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-amber-900/85">
                  {cat.shortTitle}
                </span>
                <span className="mt-1 flex items-start gap-2">
                  <span className="text-lg" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="font-display text-base font-semibold leading-snug text-stone-900 group-hover:text-amber-950">
                    {g.title}
                  </span>
                </span>
                <span className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {g.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
