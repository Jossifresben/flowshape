export interface ExplainDoc {
  source: string;
  url: string;
  /** True when the front matter carries `construction: original` — the
   *  pattern's *construction* (its composition and parameterisation) was
   *  worked out for this project. Never a claim about the mathematics, which
   *  stays classical and stays cited in `source`. */
  original: boolean;
  body: string;
}

/** Raw markdown text for every explain doc, keyed by `./explain/<id>.<lang>.md`. Lazy: nothing here reaches the initial bundle until a loader is called. */
const files = import.meta.glob('./explain/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

/** Lazily loads a pattern's explanation. Falls back to English when a translation is missing. */
export async function loadExplain(id: string, lang: 'en' | 'es'): Promise<ExplainDoc | null> {
  const key = `./explain/${id}.${lang}.md`;
  const loader = files[key] ?? files[`./explain/${id}.en.md`];
  if (!loader) return null;
  return parseFrontMatter(await loader());
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** The one value `construction:` accepts. A closed vocabulary rather than a free string, so the marker cannot drift into six different spellings across six files. */
const ORIGINAL = 'original';

/** Parses the `source:`/`url:`/`construction:` front matter block and returns the remaining markdown as `body`. Pure and synchronous so it is unit-testable without touching the filesystem or Vite. */
export function parseFrontMatter(raw: string): ExplainDoc {
  const match = FRONT_MATTER.exec(raw);
  if (!match) {
    throw new Error('explain doc is missing its front matter block (expected a leading `---` … `---`)');
  }
  const [, header, rest] = match as unknown as [string, string, string];
  const fields: Record<string, string> = {};
  for (const line of header.split(/\r?\n/)) {
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (m) fields[m[1]!] = m[2]!.trim();
  }
  const source = fields['source'];
  const url = fields['url'];
  if (!source) {
    throw new Error('explain doc front matter is missing required field "source" — a silent empty citation is worse than a loud failure');
  }
  if (!url) {
    throw new Error('explain doc front matter is missing required field "url" — a silent empty citation is worse than a loud failure');
  }
  const construction = fields['construction'];
  if (construction !== undefined && construction !== ORIGINAL) {
    throw new Error(`explain doc front matter has construction: "${construction}" — the only accepted value is "${ORIGINAL}"`);
  }
  return { source, url, original: construction === ORIGINAL, body: rest.trim() };
}

/** Pattern ids present in the explain content directory, derived from the glob keys (each id may appear once per language). */
export function listExplainIds(): string[] {
  const ids = new Set<string>();
  for (const key of Object.keys(files)) {
    const m = /^\.\/explain\/([^.]+)\.(en|es)\.md$/.exec(key);
    if (m) ids.add(m[1]!);
  }
  return [...ids].sort();
}
