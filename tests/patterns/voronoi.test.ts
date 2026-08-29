import { describe, it, expect } from 'vitest';
import { voronoiCells } from '../../src/patterns/voronoi';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(voronoiCells, { maxElements: 400 });

describe('voronoi specifics', () => {
  it('emits one polygon per site (minus degenerate cells)', () => {
    const svg = render(voronoiCells, { ...defaultParams(voronoiCells), sites: 80 }, 5);
    const count = (svg.match(/<polygon/g) ?? []).length;
    expect(count).toBeGreaterThan(70);
    expect(count).toBeLessThanOrEqual(80);
  });
});
