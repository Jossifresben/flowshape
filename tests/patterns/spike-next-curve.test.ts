import { describe, it, expect } from 'vitest';
import { knot } from '../../src/patterns/knot';
import { hyperweave } from '../../src/patterns/hyperweave';
import { standardPatternTests, render } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

// SPIKE (spike/next-curve): these two patterns are deliberately NOT imported
// by src/patterns/index.ts — they register here (and in the #/dev/spike
// route) only. The standard invariants still apply in full.

standardPatternTests(knot, { maxElements: 24 });
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

function dsOf(def: typeof knot, params: Record<string, number>, seed: number): string[] {
  const node = generateSafe(def, params, seed, { w: 600, h: 600 });
  const collect = (n: typeof node): string[] =>
    (n.tag === 'path' ? [String(n.attrs['d'] ?? '')] : []).concat(...n.children.map(collect));
  return collect(node);
}

describe('spike phase contract (both candidates)', () => {
  for (const def of [knot, hyperweave]) {
    it(`${def.id}: phase 1 is byte-for-byte phase 0`, () => {
      const p = defaultParams(def);
      expect(render(def, { ...p, phase: 1 }, 5)).toBe(render(def, { ...p, phase: 0 }, 5));
    });
    it(`${def.id}: the phase actually moves the figure`, () => {
      const p = defaultParams(def);
      expect(render(def, { ...p, phase: 0.25 }, 5)).not.toBe(render(def, { ...p, phase: 0 }, 5));
    });
  }
});

describe('hyperweave specifics', () => {
  it('is one continuous line per layer (single M, closed walk)', () => {
    const p = { ...defaultParams(hyperweave), layers: 3 };
    const ds = dsOf(hyperweave, p, 5);
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
      const pts = pathPoints(dsOf(hyperweave, p, 11), 300, 300);
      expect(pts.length).toBe(m * 5 + 1); // B vertices + the closing return
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
      const pts = pathPoints(dsOf(hyperweave, p, 1), 300, 300);
      // B endpoints + the closing return to the start.
      const uniq = new Set(pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`));
      expect(uniq.size).toBe(20);
      expect(pts.length).toBe(21);
    }
  });
});

describe('knot specifics', () => {
  it('never collapses to a line across seeds (degeneracy guard)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const pts = pathPoints(dsOf(knot, defaultParams(knot), seed), 300, 300);
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
    // Every M point of a non-first run must coincide with some L endpoint
    // already drawn — i.e. band handoffs never open a gap.
    const ds = dsOf(knot, { ...defaultParams(knot), layers: 1 }, 5);
    const all = new Set<string>();
    for (const d of ds) {
      for (const m of d.matchAll(/[ML]([\d.e+-]+ [\d.e+-]+)/g)) all.add(m[1]!);
    }
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
