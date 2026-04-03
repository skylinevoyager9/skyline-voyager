import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllDestinationIds,
  getDestinationMeta,
  getGuidesByDestination,
  type GuideDestination,
} from "@/lib/guides";
import { guideCoverImageSrc } from "@/lib/guides/cover-images";
import { site } from "@/lib/site";

type Props = { params: Promise<{ region: string }> };

function isDestination(s: string): s is GuideDestination {
  return getAllDestinationIds().includes(s as GuideDestination);
}

export function generateStaticParams() {
  return getAllDestinationIds().map((region) => ({ region }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  if (!isDestination(region)) return {};
  const d = getDestinationMeta(region);
  return {
    title: d.shortTitle,
    description: d.description,
    openGraph: {
      title: `${d.title} | ${site.name}`,
      description: d.description,
    },
  };
}

export default async function DestinationGuidesPage({ params }: Props) {
  const { region } = await params;
  if (!isDestination(region)) notFound();

  const d = getDestinationMeta(region);
  const list = getGuidesByDestination(region).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <main className="bg-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
          <Link
            href="/"
            className="font-medium text-stone-700 hover:text-amber-950 hover:underline"
          >
            Home
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <Link
            href="/destinations"
            className="font-medium text-stone-700 hover:text-amber-950 hover:underline"
          >
            Destinations
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="text-stone-600">{d.shortTitle}</span>
        </nav>

        <p className="mt-8 text-4xl" aria-hidden>
          {d.icon}
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold text-stone-900 sm:text-4xl">
          {d.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          {d.description}
        </p>

        {list.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-dashed border-stone-300 bg-white px-8 py-16 text-center shadow-sm">
            <p className="font-display text-xl font-semibold text-stone-800">
              More {d.shortTitle} guides on the way
            </p>
            <p className="mt-2 text-stone-600">
              Browse the full library or try another destination.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/guides"
                className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800"
              >
                All guides
              </Link>
              <Link
                href="/destinations"
                className="inline-flex rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-stone-800 hover:border-amber-800/30"
              >
                Other destinations
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {list.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-md transition hover:-translate-y-0.5 hover:border-amber-900/25 hover:shadow-xl"
                >
                  <div className="relative h-28 sm:h-32">
                    <Image
                      src={guideCoverImageSrc(g)}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <time
                      dateTime={g.date}
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                    >
                      {g.date} · {g.readTime}
                    </time>
                    <h2 className="font-display mt-2 text-lg font-bold text-stone-900 group-hover:text-amber-950">
                      {g.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm text-stone-600">
                      {g.description}
                    </p>
                    <span className="mt-4 text-sm font-bold text-amber-900">
                      Read guide →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
