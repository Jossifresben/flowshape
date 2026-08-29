import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { decodeState } from '../../src/core/url-state';
import { getPattern } from '../../src/patterns/registry';
import { kindOf } from '../../src/core/saved';
import { SHOWCASE } from '../../src/content/showcase';

// `SHOWCASE` is hand-written URLs pasted from an address bar — exactly where
// a typo enters. These assertions exist so a broken entry fails CI rather
// than rendering "Unavailable pattern" on the site's shopfront.

describe('curated showcase', () => {
  it('is non-empty', () => {
    expect(SHOWCASE.length).toBeGreaterThan(0);
  });

  it('decodes every entry', () => {
    for (const entry of SHOWCASE) {
      expect(decodeState(entry.hash), `does not decode: ${entry.hash}`).not.toBeNull();
    }
  });

  it('is a design (#/p/) for every entry, never an animation or poster', () => {
    for (const entry of SHOWCASE) {
      expect(kindOf(entry.hash), `not a design: ${entry.hash}`).toBe('p');
    }
  });

  it('names a registered pattern for every entry', () => {
    for (const entry of SHOWCASE) {
      const state = decodeState(entry.hash);
      const patternId = state?.patternId;
      expect(getPattern(patternId ?? ''), `unregistered pattern '${patternId}' in ${entry.hash}`).toBeDefined();
    }
  });

  it('has no duplicate hashes', () => {
    const hashes = SHOWCASE.map((e) => e.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});
