import { describe, it, expect } from 'vitest';
import { hyperweave } from '../../src/patterns/hyperweave';
import { standardPatternTests } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(hyperweave, { maxElements: 8 });

/** All numeric coordinates of every path's d, as [x, y] pairs relative to
 *  the given centre. Handles M/L (2 args) and A (7 args — endpoint last). */
function pathPoints(dAttrs: string[], cx: number, cy: number): [number, number][] {
  const pts: [number, number][] = [];
  for (const d of dAttrs) {
    for (const m of d.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)) {
      pts.push([Number(m[1]) - cx, Number(m[2]) - cy]);
    }
    for (const m of d.matchAll(/A[\d.e+-]+ [\d.e+-]+ \d \d \d ([\d.e+-]+) ([\d.e+-]+)/g)) {
      pts.push([Number(m[1]) - cx, Number(m[2]) - cy]);
    }
  }
  return pts;
}

function dsOf(params: Record<string, number>, seed: number): string[] {
  const node = generateSafe(hyperweave, params, seed, { w: 600, h: 600 });
  const collect = (n: typeof node): string[] =>
    (n.tag === 'path' ? [String(n.attrs['d'] ?? '')] : []).concat(...n.children.map(collect));
  return collect(node);
}

describe('hyperweave specifics', () => {
  it('is one continuous line per layer (single M, closed walk)', () => {
    const p = { ...defaultParams(hyperweave), layers: 3 };
    const ds = dsOf(p, 5);
    expect(ds.length).toBe(3);
    for (const d of ds) {
      expect((d.match(/M/g) ?? []).length).toBe(1);
      // The walk closes: last endpoint returns to the M point.
      const first = /^M([\d.e+-]+) ([\d.e+-]+)/.exec(d)!;
      const nums = pathPoints([d], 0, 0);
      const last = nums[nums.length - 1]!;
      expect(Math.hypot(last[0] - Number(first[1]), last[1] - Number(first[2]))).toBeLessThan(0.05);
    }
  });

  it('has exact m-fold symmetry with the seed ripple on (forced, not tuned)', () => {
    // Rotating the walk's vertex set by 2π/m must map it onto itself even
    // with wobble at maximum — the ripple is (B/m)-periodic by construction.
    for (const m of [3, 5, 8]) {
      const p = { ...defaultParams(hyperweave), symmetry: m, layers: 1, wobble: 0.5 };
      const pts = pathPoints(dsOf(p, 11), 300, 300);
      const grain = defaultParams(hyperweave)['grain']!;
      expect(pts.length).toBe(m * grain + 1); // B vertices + the closing return
      const c = Math.cos((2 * Math.PI) / m), s = Math.sin((2 * Math.PI) / m);
      for (const [x, y] of pts) {
        const rx = x * c - y * s, ry = x * s + y * c;
        const near = pts.some(([qx, qy]) => Math.hypot(rx - qx, ry - qy) < 0.75);
        expect(near).toBe(true);
      }
    }
  });

  it('visits every boundary point exactly once (coprime step forced)', () => {
    // Whatever wind is asked for, the vertex count equals B = m·grain — a
    // non-coprime step would close early and visit only B/gcd points.
    for (const wind of [2, 6, 12, 20, 40]) {
      const p = { ...defaultParams(hyperweave), symmetry: 4, grain: 5, wind, layers: 1, wobble: 0 };
      const pts = pathPoints(dsOf(p, 1), 300, 300);
      // B endpoints + the closing return to the start.
      const uniq = new Set(pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`));
      expect(uniq.size).toBe(20);
      expect(pts.length).toBe(21);
    }
  });

  it('stays hyperbolic at every wind the slider can reach (the wind cap)', () => {
    // The promotion fix: the walk step is capped at ⌊0.3·B⌋, because past it
    // the geodesic radius tan(πδ/B) blows up and the arcs flatten into
    // near-diametral chords — the times-table look. At δ/B = 0.3 the radius
    // is tan(0.3π) ≈ 1.376·R; before the cap, wind 40 at the default B = 35
    // reached δ 17 and radius ≈ 21·R (an arc flat to one part in a hundred).
    // Every emitted arc radius must therefore stay under ~1.4·R, at every
    // wind value randomize can draw.
    const R = 600 * 0.46;
    for (let wind = 2; wind <= 40; wind++) {
      const ds = dsOf({ ...defaultParams(hyperweave), wind, layers: 1 }, 5);
      for (const m of ds[0]!.matchAll(/A([\d.e+-]+) /g)) {
        expect(Number(m[1]), `wind ${wind}: arc radius ${m[1]}`).toBeLessThan(1.45 * R);
      }
    }
  });
});
