import Link from "next/link";

type Item = { id: string; text: string };

type Props = {
  items: Item[];
};

function TocList({ items }: Props) {
  return (
    <ol className="space-y-2 text-sm">
      {items.map((h) => (
        <li key={h.id}>
          <Link
            href={`#${h.id}`}
            className="text-stone-600 hover:text-amber-950 hover:underline"
          >
            {h.text}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function GuideTocMobile({ items }: Props) {
  if (items.length < 2) return null;
  return (
    <nav
      className="mb-6 rounded-2xl border border-stone-200 bg-stone-50/90 p-4 lg:hidden"
      aria-label="On this page"
    >
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-bold text-stone-800 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            On this page
            <span className="text-stone-400 transition group-open:rotate-180">
              ▼
            </span>
          </span>
        </summary>
        <div className="mt-3 border-t border-stone-200 pt-3">
          <TocList items={items} />
        </div>
      </details>
    </nav>
  );
}

export function GuideTocDesktop({ items }: Props) {
  if (items.length < 2) return null;
  return (
    <nav
      className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block"
      aria-label="On this page"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
        On this page
      </p>
      <div className="mt-3 border-l border-stone-200 pl-4">
        <ol className="space-y-2.5 text-sm">
          {items.map((h) => (
            <li key={h.id}>
              <Link
                href={`#${h.id}`}
                className="-ml-px block border-l-2 border-transparent pl-3 text-pretty text-stone-600 transition hover:border-amber-600 hover:text-amber-950"
              >
                {h.text}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
