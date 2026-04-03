/** URL-safe ids for `##` headings (must match GuideBody `h2` ids). */
export function slugifyGuideHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Line index → `id` for each `##` line in markdown. */
export function buildHeadingIdMap(markdown: string): Map<number, string> {
  const lines = markdown.split("\n");
  const map = new Map<number, string>();
  const used = new Set<string>();
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("## ")) {
      const raw = t.slice(3);
      let id = slugifyGuideHeading(raw);
      const base = id;
      let n = 0;
      while (used.has(id)) id = `${base}-${++n}`;
      used.add(id);
      map.set(i, id);
    }
  });
  return map;
}

export function getGuideToc(markdown: string): { id: string; text: string }[] {
  const lines = markdown.split("\n");
  const used = new Set<string>();
  const out: { id: string; text: string }[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## ")) {
      const text = t.slice(3);
      let id = slugifyGuideHeading(text);
      const base = id;
      let n = 0;
      while (used.has(id)) id = `${base}-${++n}`;
      used.add(id);
      out.push({ id, text });
    }
  }
  return out;
}
