import { describe, it, expect } from 'vitest';
import { truchet } from '../../src/patterns/truchet';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(truchet, { maxElements: 1200 });

describe('truchet specifics', () => {
  it('smaller cells produce more arc paths', () => {
    const base = defaultParams(truchet);
    const coarse = (render(truchet, { ...base, cell: 60 }, 2).match(/<path/g) ?? []).length;
    const fine = (render(truchet, { ...base, cell: 24 }, 2).match(/<path/g) ?? []).length;
    expect(fine).toBeGreaterThan(coarse);
  });

  it('render mode 1 (tiles) fills with ink and strokes nothing, for both variants', () => {
    const base = defaultParams(truchet);
    for (const variant of [0, 1]) {
      const svg = render(truchet, { ...base, variant, render: 1 }, 2);
      const paths = svg.match(/<path[^>]*>/g) ?? [];
      // exclude the universal paper background rect (not a path anyway)
      expect(paths.length).toBeGreaterThan(0);
      for (const tag of paths) {
        expect(tag).toContain('fill="#000000"');
        expect(tag).toContain('stroke="none"');
      }
    }
  });

  it('render mode 0 output is unaffected by the render param existing (still strokes, no fills)', () => {
    const base = defaultParams(truchet);
    const svg = render(truchet, { ...base, render: 0 }, 2);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths.length).toBeGreaterThan(0);
    for (const tag of paths) {
      expect(tag).toContain('fill="none"');
    }
  });
});
