// tests/content/references.test.ts — the bibliography, and the `original`
// marker that distinguishes patterns implemented from a published construction
// from those whose construction is this project's own.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { parseFrontMatter } from '../../src/content/explain';
import { REFERENCES } from '../../src/content/references';
import { renderReferencesModule, REFERENCES_FILE } from '../../scripts/render-references';

const DIR = path.join(process.cwd(), 'src', 'content', 'explain');

// Written out rather than derived from the data, because the point of this
// list is to be a decision that has to be made again on purpose. Adding a
// pattern to the list, or dropping one, should require editing this line and
// thinking about whether the claim is true — not merely editing a markdown
// file and watching a test go green on its own.
//
// knot and hyperweave (2026-08-31): the mathematics is classical and cited
// (Lissajous knots after Bogle–Hearst–Jones–Stoilov; Poincaré-disk geodesics),
// but the composition — knot's depth-banded projection and its 1-periodic
// motions, hyperweave's closed coprime walk with the (B/m)-periodic ripple —
// was worked out for this project.
const OWN_CONSTRUCTION = ['bands', 'chirp', 'helix', 'hyperweave', 'isoweave', 'knot', 'nested', 'roselattice'];

describe('references', () => {
  it('marks exactly the patterns whose construction is this project\'s own', () => {
    const marked = Object.entries(REFERENCES)
      .filter(([, ref]) => ref.original)
      .map(([id]) => id)
      .sort();
    expect(marked).toEqual([...OWN_CONSTRUCTION].sort());
  });

  // The marker annotates a citation; it never stands in for one. A marked
  // entry with a thin or missing source would read as a claim of new
  // mathematics, which is the one thing it must not say.
  it('still cites real, classical mathematics under every marked entry', () => {
    for (const id of OWN_CONSTRUCTION) {
      const ref = REFERENCES[id];
      expect(ref, `no reference entry for '${id}'`).toBeDefined();
      expect(ref!.source.length, `${id} source`).toBeGreaterThan(20);
      expect(ref!.url, `${id} url`).toMatch(/^https?:\/\//);
    }
  });

  it('carries the marker in both languages of the explain doc', () => {
    for (const id of OWN_CONSTRUCTION) {
      for (const lang of ['en', 'es']) {
        const doc = parseFrontMatter(readFileSync(path.join(DIR, `${id}.${lang}.md`), 'utf-8'));
        expect(doc.original, `${id}.${lang}.md is missing 'construction: original'`).toBe(true);
      }
    }
  });

  it('leaves every other explain doc unmarked, in both languages', () => {
    const own = new Set(OWN_CONSTRUCTION);
    const stray: string[] = [];
    for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
      const id = file.replace(/\.(en|es)\.md$/, '');
      if (own.has(id)) continue;
      if (parseFrontMatter(readFileSync(path.join(DIR, file), 'utf-8')).original) stray.push(file);
    }
    expect(stray).toEqual([]);
  });

  it('rejects any construction value other than "original"', () => {
    const raw = '---\nsource: Something real\nurl: https://example.com\nconstruction: ours\n---\n\nbody';
    expect(() => parseFrontMatter(raw)).toThrow(/only accepted value/);
  });

  // Catches a hand-edit of the generated table, and equally a front-matter
  // change that was never regenerated. Either way the committed file and the
  // explainers have stopped agreeing, which is the whole reason it is
  // generated.
  it('has a committed references.ts identical to a fresh render', () => {
    expect(readFileSync(REFERENCES_FILE, 'utf-8')).toBe(renderReferencesModule());
  });

  it('renders identically twice — the generator is idempotent', () => {
    expect(renderReferencesModule()).toBe(renderReferencesModule());
  });

  it('gives every registered pattern a reference', () => {
    const missing = listPatterns().map((d) => d.id).filter((id) => !REFERENCES[id]);
    expect(missing).toEqual([]);
  });
});

// The DOIs. The whole value of this block is that every identifier in it was
// checked to resolve to the exact work its citation names — a fabricated DOI
// is a false scholarly claim that anyone citing flowshape would inherit, and
// it is worse than no DOI at all. No test can re-do that check offline; what
// these tests do is guard the plumbing around it, so a DOI cannot be mangled,
// half-propagated, or silently disagree between the page and the deposit.
describe('DOIs', () => {
  // Shape only. A DOI has no checksum, so this catches a typo or a URL pasted
  // into the field, and claims nothing about what the identifier resolves to.
  const WELL_FORMED = /^10\.\d{4,9}\/\S+$/;

  const frontMatter = (id: string, lang: 'en' | 'es'): ReturnType<typeof parseFrontMatter> =>
    parseFrontMatter(readFileSync(path.join(DIR, `${id}.${lang}.md`), 'utf-8'));

  const ids = readdirSync(DIR)
    .filter((f) => f.endsWith('.en.md'))
    .map((f) => f.replace(/\.en\.md$/, ''))
    .sort();

  it('records only well-formed DOIs', () => {
    const bad = Object.entries(REFERENCES).flatMap(([id, ref]) =>
      (ref.doi ?? []).filter((d) => !WELL_FORMED.test(d)).map((d) => `${id}: ${d}`),
    );
    expect(bad).toEqual([]);
  });

  it('never records the same DOI twice inside one entry', () => {
    for (const [id, ref] of Object.entries(REFERENCES)) {
      const doi = ref.doi ?? [];
      expect(new Set(doi).size, `${id} repeats a DOI`).toBe(doi.length);
    }
  });

  // The generated table is the front matter or it is nothing. Order matters
  // too: a citation naming two works lists their DOIs in the order it names
  // them, which is the only thing that tells a reader which is which.
  it('carries every front-matter DOI into the generated table, in order', () => {
    for (const id of ids) {
      expect(REFERENCES[id]?.doi ?? [], `${id}`).toEqual(frontMatter(id, 'en').doi);
    }
  });

  // Both languages of an explainer cite the same works, so they carry the same
  // identifiers. A DOI added to one file and not the other would show under
  // the pattern in English and vanish in Spanish.
  it('agrees between the English and Spanish front matter', () => {
    for (const id of ids) {
      expect(frontMatter(id, 'es').doi, `${id}.es.md`).toEqual(frontMatter(id, 'en').doi);
    }
  });

  // Not every citation has one, and that is the point: a 1704 memoir, a 1925
  // archaeological survey, an encyclopedia article and a personal essay have
  // no DOI, and inventing one for them is the failure this whole block exists
  // to prevent. This asserts the field is populated at all, so a parser change
  // that quietly dropped every DOI would fail loudly rather than look tidy.
  it('finds DOIs on a substantial share of the entries', () => {
    const withDoi = Object.values(REFERENCES).filter((r) => (r.doi ?? []).length > 0);
    expect(withDoi.length).toBeGreaterThan(10);
  });

  it('leaves the DOI field absent rather than empty where there is none', () => {
    const empty = Object.entries(REFERENCES)
      .filter(([, ref]) => ref.doi !== undefined && ref.doi.length === 0)
      .map(([id]) => id);
    expect(empty).toEqual([]);
  });

  it('rejects a DOI written as a URL', () => {
    const raw = '---\nsource: Something real\nurl: https://example.com\ndoi: https://doi.org/10.1000/xyz\n---\n\nbody';
    expect(() => parseFrontMatter(raw)).toThrow(/bare DOI/);
  });

  it('parses a two-work DOI list into two entries', () => {
    const raw = '---\nsource: Two works\nurl: https://example.com\ndoi: 10.1000/aaa, 10.1001/bbb\n---\n\nbody';
    expect(parseFrontMatter(raw).doi).toEqual(['10.1000/aaa', '10.1001/bbb']);
  });
});
