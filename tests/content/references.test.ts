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
// seventh pattern to the six, or dropping one, should require editing this
// line and thinking about whether the claim is true — not merely editing a
// markdown file and watching a test go green on its own.
const OWN_CONSTRUCTION = ['bands', 'chirp', 'helix', 'isoweave', 'nested', 'roselattice'];

describe('references', () => {
  it('marks exactly the six patterns whose construction is this project\'s own', () => {
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
