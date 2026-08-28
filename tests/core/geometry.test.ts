import { describe, it, expect } from 'vitest';
import { delaunay, voronoiCell, centroid, type Pt } from '../../src/core/geometry';

describe('delaunay', () => {
  it('triangulates a square into 2 triangles covering all 4 points', () => {
    const pts: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const tris = delaunay(pts);
    expect(tris.length).toBe(2);
    const used = new Set(tris.flat());
    expect([...used].sort()).toEqual([0, 1, 2, 3]);
  });

  it('is deterministic and only references real points', () => {
    const pts: Pt[] = Array.from({ length: 60 }, (_, i) => [
      (i * 97) % 200, (i * 61) % 280,
    ]);
    const a = delaunay(pts);
    expect(delaunay(pts)).toEqual(a);
    for (const t of a) for (const idx of t) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(60);
    }
  });
});

describe('voronoiCell', () => {
  it('clips the center site of a 3x3 grid to its unit cell', () => {
    const sites: Pt[] = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) sites.push([x * 10, y * 10]);
    const cell = voronoiCell(sites, 4, [[-5, -5], [25, -5], [25, 25], [-5, 25]]);
    const c = centroid(cell);
    expect(c[0]).toBeCloseTo(10, 5);
    expect(c[1]).toBeCloseTo(10, 5);
    // the middle cell is the square 5..15 x 5..15
    for (const [x, y] of cell) {
      expect(x).toBeGreaterThanOrEqual(4.999);
      expect(x).toBeLessThanOrEqual(15.001);
      expect(y).toBeGreaterThanOrEqual(4.999);
      expect(y).toBeLessThanOrEqual(15.001);
    }
  });
});
