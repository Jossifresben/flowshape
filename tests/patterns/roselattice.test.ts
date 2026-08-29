import { describe, it, expect } from 'vitest';
import { roselattice } from '../../src/patterns/roselattice';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(roselattice, { maxElements: 200 });

describe('roselattice specifics', () => {
  it('emits rings + 1 + spokes paths', () => {
    const p = defaultParams(roselattice);
    const svg = render(roselattice, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(p['rings']! + 1 + p['spokes']!);
  });

  it('changing petals changes the output', () => {
    const base = defaultParams(roselattice);
    const a = render(roselattice, { ...base, petals: 3 }, 1);
    const b = render(roselattice, { ...base, petals: 12 }, 1);
    expect(a).not.toBe(b);
  });
});
