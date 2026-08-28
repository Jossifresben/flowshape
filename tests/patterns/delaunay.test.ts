import { describe, it, expect } from 'vitest';
import { delaunayMesh } from '../../src/patterns/delaunay';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(delaunayMesh, { maxElements: 1600 });

describe('delaunay specifics', () => {
  it('mosaic mode fills polygons; edges mode strokes paths only', () => {
    const base = defaultParams(delaunayMesh);
    expect(render(delaunayMesh, { ...base, mode: 1 }, 1)).toContain('<polygon');
    const edges = render(delaunayMesh, { ...base, mode: 0 }, 1);
    expect(edges).toContain('<path');
    expect(edges).not.toContain('<polygon');
  });
});
