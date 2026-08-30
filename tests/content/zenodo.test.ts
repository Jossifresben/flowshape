// tests/content/zenodo.test.ts — the Zenodo deposit metadata: the citations it
// carries, and the pattern count it claims.
//
// Two failure modes this guards against. The first is drift: the About page's
// reference list and the deposit's `related_identifiers` are two renderings of
// one fact, and a deposit that cites a work the page does not (or the reverse)
// is a citation record nobody can trust. The second is rot: the deposit
// described "25 deterministic pattern generators" long after there were
// thirty, and that stale number had already been printed onto eight social
// cards before anyone noticed. A number written into prose cannot check
// itself, so the test checks it against the live registry.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { REFERENCES } from '../../src/content/references';
import {
  renderZenodoJson,
  citedDois,
  ZENODO_FILE,
  type RelatedIdentifier,
} from '../../scripts/render-zenodo';

const CITATION_FILE = path.join(process.cwd(), 'CITATION.cff');
const WELL_FORMED = /^10\.\d{4,9}\/\S+$/;

const deposit = (): { related_identifiers: RelatedIdentifier[]; title: string; description: string } =>
  JSON.parse(readFileSync(ZENODO_FILE, 'utf-8'));

const cites = (): RelatedIdentifier[] =>
  deposit().related_identifiers.filter((r) => r.relation === 'cites');

describe('zenodo deposit', () => {
  // Catches a hand-edit of the generated block, and equally a front-matter
  // change that was never regenerated. Either way the deposit and the
  // explainers have stopped agreeing, which is the whole reason it is
  // generated rather than written out.
  it('has a committed .zenodo.json identical to a fresh render', () => {
    expect(readFileSync(ZENODO_FILE, 'utf-8')).toBe(renderZenodoJson());
  });

  it('renders identically twice — the generator is idempotent', () => {
    expect(renderZenodoJson()).toBe(renderZenodoJson());
  });

  // `cites` and `doi` are both in Zenodo's own vocabularies. A relation
  // outside that list is silently dropped on deposit, which would lose the
  // citations without anything visibly failing.
  it('gives every citation the cites/doi shape Zenodo accepts', () => {
    for (const r of cites()) {
      expect(r.relation).toBe('cites');
      expect(r.scheme).toBe('doi');
      expect(r.identifier, `${r.identifier} is not a bare DOI`).toMatch(WELL_FORMED);
    }
  });

  it('cites every DOI the explainers record, and no others', () => {
    const inDeposit = cites().map((r) => r.identifier).sort();
    const inContent = [...new Set(Object.values(REFERENCES).flatMap((r) => r.doi ?? []))].sort();
    expect(inDeposit).toEqual(inContent);
    expect(inContent.length).toBeGreaterThan(10);
  });

  it('cites each work once, however many patterns rest on it', () => {
    const ids = cites().map((r) => r.identifier);
    expect(new Set(ids).size).toBe(ids.length);
    // Two pairs of patterns genuinely share a source, so the deduplication is
    // doing something rather than passing vacuously.
    expect(citedDois().length).toBeLessThan(
      Object.values(REFERENCES).flatMap((r) => r.doi ?? []).length,
    );
  });

  // The generator rewrites the citations and nothing else. The hand-written
  // relations — the repository, the live site — must survive it.
  it('keeps the hand-written relations alongside the generated ones', () => {
    const kept = deposit().related_identifiers.filter((r) => r.relation !== 'cites');
    expect(kept.map((r) => r.relation)).toEqual(['isSupplementTo', 'isIdenticalTo']);
  });
});

describe('pattern count in citation metadata', () => {
  const CLAIM = /(\d+) deterministic\s+pattern generators/g;

  const claims = (text: string): string[] =>
    [...text.replace(/\s+/g, ' ').matchAll(CLAIM)].map((m) => m[1]!);

  it('states the live registry count everywhere .zenodo.json names it', () => {
    const n = String(listPatterns().length);
    const found = claims(readFileSync(ZENODO_FILE, 'utf-8'));
    expect(found.length, 'no pattern-count claim found in .zenodo.json').toBeGreaterThan(0);
    expect(found).toEqual(found.map(() => n));
  });

  it('states the live registry count in CITATION.cff', () => {
    const n = String(listPatterns().length);
    const found = claims(readFileSync(CITATION_FILE, 'utf-8'));
    expect(found.length, 'no pattern-count claim found in CITATION.cff').toBeGreaterThan(0);
    expect(found).toEqual(found.map(() => n));
  });

  it('states the live registry count in package.json', () => {
    const n = String(listPatterns().length);
    const found = claims(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    expect(found.length, 'no pattern-count claim found in package.json').toBeGreaterThan(0);
    expect(found).toEqual(found.map(() => n));
  });
});
