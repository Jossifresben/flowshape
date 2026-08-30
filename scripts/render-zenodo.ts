/**
 * The pure half of the Zenodo deposit's citation block: reads `.zenodo.json`
 * and the explain front matter, and returns the text the file should have.
 * Reads nothing else and writes nothing at all.
 *
 * Why generate it. The About page's reference list and the deposit's
 * `related_identifiers` are two renderings of one fact — which published works
 * this project is built on. Maintained separately they drift, and a deposit
 * that cites a work the page does not (or the reverse) is a citation record
 * nobody can trust. Both are therefore rendered from the same front matter,
 * and the test suite asserts the committed file matches a fresh render.
 *
 * What it does NOT touch: everything else in the deposit — title, description,
 * creators, keywords, version. Those are prose and are edited by hand; this
 * replaces exactly the `cites` entries and leaves the rest byte for byte.
 *
 * Split from `build-zenodo.ts` for the same reason `render-references.ts` is
 * split from its writer: a test can import this and compare, where a CLI entry
 * point that wrote on import would rewrite the file under test.
 *
 * Run the writer with: npm run zenodo
 */
import { parseFrontMatter } from '../src/content/explain';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const explainDir = path.join(here, '..', 'src', 'content', 'explain');

/** Absolute path of the deposit metadata. Named here so the writer and the test that guards it can never point at two different files. */
export const ZENODO_FILE = path.join(here, '..', '.zenodo.json');

/** One entry of Zenodo's `related_identifiers` array. */
export interface RelatedIdentifier {
  identifier: string;
  relation: string;
  resource_type?: string;
  scheme: string;
}

/**
 * The relation and scheme every generated entry carries.
 *
 * `cites` and `doi` are both in Zenodo's own vocabularies (checked against
 * `/api/vocabularies/relationtypes`), and `cites` is the accurate one: these
 * are works flowshape is built on, not works about flowshape (`isCitedBy`),
 * not parts of it (`isPartOf`), and not material it supplements
 * (`isSupplementTo`, which the repository entry already uses for a different
 * relationship).
 *
 * `resource_type` is deliberately omitted. It is optional, Zenodo resolves the
 * DOI's own metadata regardless, and supplying it would mean carrying a second
 * hand-maintained field — article vs. book vs. conference paper — beside every
 * DOI in the front matter. A wrong type asserted with confidence is worse than
 * an absent optional one.
 */
const RELATION = 'cites';
const SCHEME = 'doi';

/**
 * Every DOI named across the explain front matter, in pattern-id order and
 * then in the order each citation names its works, with repeats dropped.
 * Repeats are real: `isoweave` and `voxel` both rest on Newell, Newell &
 * Sancha; `coulomb` and `flowfield` both on Jobard & Lefer. The deposit cites
 * each work once.
 */
export function citedDois(): string[] {
  const ids = readdirSync(explainDir)
    .filter((f) => f.endsWith('.en.md'))
    .map((f) => f.replace(/\.en\.md$/, ''))
    .sort();

  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const { doi } = parseFrontMatter(readFileSync(path.join(explainDir, `${id}.en.md`), 'utf-8'));
    for (const d of doi) {
      if (seen.has(d)) continue;
      seen.add(d);
      out.push(d);
    }
  }
  return out;
}

/** Renders the deposit metadata: the committed file with its `cites` entries replaced by a fresh render of the front matter. */
export function renderZenodoJson(): string {
  const deposit = JSON.parse(readFileSync(ZENODO_FILE, 'utf-8')) as {
    related_identifiers?: RelatedIdentifier[];
    [k: string]: unknown;
  };

  // Hand-written entries — the repository and the live site — keep their place
  // and their order at the head of the list. Only the citations are ours to
  // rewrite, so a relation added by hand later is never silently dropped.
  const kept = (deposit.related_identifiers ?? []).filter((r) => r.relation !== RELATION);
  const cites: RelatedIdentifier[] = citedDois().map((identifier) => ({
    identifier,
    relation: RELATION,
    scheme: SCHEME,
  }));

  deposit.related_identifiers = [...kept, ...cites];
  return `${JSON.stringify(deposit, null, 2)}\n`;
}
