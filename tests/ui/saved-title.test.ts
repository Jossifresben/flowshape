import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { autoTitle } from '../../src/ui/saved-title';
import { listPatterns } from '../../src/patterns/registry';

describe('autoTitle', () => {
  it('names a seeded design by its pattern and seed', () => {
    expect(autoTitle('#/p/timestable?v=1&seed=71203', 'en')).toBe('Times-Table Chords · 71203');
  });

  it('translates the pattern name', () => {
    const es = autoTitle('#/p/timestable?v=1&seed=71203', 'es');
    expect(es).toMatch(/ · 71203$/);
    expect(es).not.toBe('Times-Table Chords · 71203');
  });

  it('drops the seed for a pattern that does not use one', () => {
    const unseeded = listPatterns().find((p) => p.usesSeed === false);
    expect(unseeded, 'expected at least one unseeded pattern in the registry').toBeTruthy();
    const title = autoTitle(`#/p/${unseeded!.id}?v=1&seed=5`, 'en');
    expect(title).not.toMatch(/·/);
  });

  it('titles animations and posters the same way', () => {
    expect(autoTitle('#/a/timestable?v=1&seed=7', 'en')).toBe('Times-Table Chords · 7');
    expect(autoTitle('#/c/timestable?v=1&seed=7', 'en')).toBe('Times-Table Chords · 7');
  });

  it('falls back to the site name for a hash that is not a creation', () => {
    expect(autoTitle('#/saved', 'en')).toBe('flowshape.art');
    expect(autoTitle('', 'en')).toBe('flowshape.art');
  });
});
