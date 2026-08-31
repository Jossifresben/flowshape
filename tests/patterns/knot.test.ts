import { describe, it, expect } from 'vitest';
import { knot } from '../../src/patterns/knot';
import { standardPatternTests } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(knot, { maxElements: 24 });

/** All numeric coordinates of every path's d, as [x, y] pairs relative to
 *  the given centre (M/L commands — knot draws no arcs). */
function pathPoints(dAttrs: string[], cx: number, cy: number): [number, number][] {
  const pts: [number, number][] = [];
  for (const d of dAttrs) {
    for (const m of d.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)) {
      pts.push([Number(m[1]) - cx, Number(m[2]) - cy]);
    }
  }
  return pts;
}

function dsOf(params: Record<string, number>, seed: number): string[] {
  const node = generateSafe(knot, params, seed, { w: 600, h: 600 });
  const collect = (n: typeof node): string[] =>
    (n.tag === 'path' ? [String(n.attrs['d'] ?? '')] : []).concat(...n.children.map(collect));
  return collect(node);
}

describe('knot specifics', () => {
  it('never collapses to a line across seeds (degeneracy guard)', () => {
    // The Lissajous singular set nᵢφⱼ − nⱼφᵢ ≡ 0 (mod π) collapses the
    // projection onto a traced-twice arc; pickPhases resamples away from it,
    // so every seed must keep a genuinely two-dimensional figure.
    for (let seed = 1; seed <= 40; seed++) {
      const pts = pathPoints(dsOf(defaultParams(knot), seed), 300, 300);
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (const [x, y] of pts) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const w = maxX - minX, h = maxY - minY;
      expect(Math.min(w, h)).toBeGreaterThan(0.3 * Math.max(w, h));
    }
  });

  it('depth banding keeps the strand continuous (runs share boundary samples)', () => {
    // Every M point of a non-first run must coincide with some endpoint
    // already drawn — i.e. band handoffs never open a gap.
    const ds = dsOf({ ...defaultParams(knot), layers: 1 }, 5);
    let orphans = 0, starts = 0;
    for (const d of ds) {
      for (const m of d.matchAll(/M([\d.e+-]+ [\d.e+-]+)L/g)) {
        starts++;
        // Each M must also appear as an endpoint of a neighbouring segment.
        const count = [...ds.join('').matchAll(new RegExp(m[1]!.replace(/[.\\]/g, '\\$&'), 'g'))].length;
        if (count < 2) orphans++;
      }
    }
    expect(starts).toBeGreaterThan(1);
    expect(orphans).toBe(0);
  });
});
