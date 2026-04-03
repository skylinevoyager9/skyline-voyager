import Link from "next/link";
import type { ReactNode } from "react";
import { buildHeadingIdMap } from "@/lib/guides/headings";

function parseInline(text: string): ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = linkRegex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const label = m[1];
    const href = m[2];
    const isInternal = href.startsWith("/");
    parts.push(
      isInternal ? (
        <Link
          key={key++}
          href={href}
          className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          {label}
        </Link>
      ) : (
        <a
          key={key++}
          href={href}
          className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function lineToElement(
  line: string,
  idx: number,
  headingIds: Map<number, string>,
): ReactNode {
  const t = line.trim();
  if (!t) return <br key={idx} />;

  if (t.startsWith("## ")) {
    const id = headingIds.get(idx);
    return (
      <h2
        key={idx}
        id={id}
        className="guide-h2 font-display scroll-mt-28 text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl"
      >
        {t.slice(3)}
      </h2>
    );
  }

  const boldParts = t.split(/\*\*(.+?)\*\*/g);
  if (boldParts.length > 1) {
    return (
      <p
        key={idx}
        className="guide-p mt-5 text-[17px] leading-[1.75] text-[var(--color-ink-muted)] first:mt-0"
      >
        {boldParts.map((chunk, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-[var(--color-ink)]">
              {chunk}
            </strong>
          ) : (
            <span key={i}>{parseInline(chunk)}</span>
          ),
        )}
      </p>
    );
  }

  return (
    <p
      key={idx}
      className="guide-p mt-5 text-[17px] leading-[1.75] text-[var(--color-ink-muted)] first:mt-0"
    >
      {parseInline(t)}
    </p>
  );
}

export function GuideBody({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const headingIds = buildHeadingIdMap(markdown);
  return (
    <article className="prose-guide max-w-[42rem]">
      {lines.map((line, i) => lineToElement(line, i, headingIds))}
    </article>
  );
}
