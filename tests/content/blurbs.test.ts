import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { BLURBS } from '../../src/content/blurbs';
import { NAMES } from '../../src/ui/gallery';

describe('blurbs', () => {
  it('covers every registered pattern in both languages', () => {
    for (const def of listPatterns()) {
      expect(BLURBS[def.id], `missing blurb for ${def.id}`).toBeDefined();
      expect(BLURBS[def.id]!.en.length).toBeGreaterThan(0);
      expect(BLURBS[def.id]!.es.length).toBeGreaterThan(0);
    }
  });

  it('has no blurb for a pattern that does not exist', () => {
    const ids = new Set(listPatterns().map((d) => d.id));
    for (const id of Object.keys(BLURBS)) expect(ids.has(id)).toBe(true);
  });

  it('stays inside the 140-character poster budget in both languages', () => {
    for (const [id, b] of Object.entries(BLURBS)) {
      expect(b.en.length, `${id}.en is ${b.en.length}`).toBeLessThanOrEqual(140);
      expect(b.es.length, `${id}.es is ${b.es.length}`).toBeLessThanOrEqual(140);
    }
  });

  it('keeps parity with the gallery name table', () => {
    expect(Object.keys(BLURBS).sort()).toEqual(Object.keys(NAMES).sort());
  });
});
