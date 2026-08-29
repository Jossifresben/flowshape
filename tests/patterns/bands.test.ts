import { describe, it, expect } from 'vitest';
import { bands } from '../../src/patterns/bands';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(bands, { maxElements: 20 });

describe('bands specifics', () => {
  it('emits exactly bandCount filled paths with stroke none', () => {
    const p = defaultParams(bands);
    const svg = render(bands, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(p['bandCount']!);
    for (const path of paths) {
      expect(path).toMatch(/fill="[^"]+"/);
      expect(path).toContain('stroke="none"');
    }
  });

  it('a different growthExponent changes the geometry', () => {
    const base = defaultParams(bands);
    const a = render(bands, { ...base, growthExponent: 0.4 }, 1);
    const b = render(bands, { ...base, growthExponent: 3 }, 1);
    expect(a).not.toBe(b);
  });
});
