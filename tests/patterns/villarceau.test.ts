import { describe, it, expect } from 'vitest';
import { villarceau, hopfFibers, JITTER_MAX } from '../../src/patterns/villarceau';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

// SPIKE: villarceau is not registered in src/patterns/index.ts; importing the
// module registers it in the module-local registry for these tests only.
standardPatternTests(villarceau, { maxElements: 48 });

/** All numeric coordinates of every path's d, as [x, y]. */
function pathPoints(svg: string): [number, number][] {
  const pts: [number, number][] = [];
  for (const m of svg.matchAll(/[ML](-?[\d.e+-]+) (-?[\d.e+-]+)/g)) pts.push([Number(m[1]), Number(m[2])]);
  return pts;
}

describe('villarceau specifics', () => {
  it('phase 1 is byte-identical to phase 0 (R(1) = −I fixes every fiber; % 1 folds the bytes)', () => {
    const p = defaultParams(villarceau);
    expect(render(villarceau, { ...p, phase: 1 }, 3)).toBe(render(villarceau, { ...p, phase: 0 }, 3));
    // And the theorem itself, before folding: the sample set at α → π is the
    // sample set at α = 0 (−I is e^{iπ} on each fiber; N is even), so every
    // sample just before the wrap has a phase-0 sample within 1e-4.
    const a = hopfFibers({ ...p, phase: 0 }, 3).fibers;
    const b = hopfFibers({ ...p, phase: 1 - 1e-7 }, 3).fibers;
    for (let i = 0; i < a.length; i++) {
      for (const qb of b[i]!.pts) {
        if (!qb) continue;
        let best = Infinity;
        for (const qa of a[i]!.pts) if (qa) best = Math.min(best, Math.hypot(qa[0] - qb[0], qa[1] - qb[1]));
        expect(best).toBeLessThan(1e-4);
      }
    }
  });

  it('phase 0 is the resting composition and mid-cycle differs from it', () => {
    const p = defaultParams(villarceau);
    expect(render(villarceau, { ...p, phase: 0.5 }, 1)).not.toBe(render(villarceau, p, 1));
  });

  it('every drawn circle moves across the cycle (no frozen dominant elements)', () => {
    const p = defaultParams(villarceau);
    const runs = [0, 0.25, 0.5, 0.75].map((phase) => hopfFibers({ ...p, phase }, 1));
    const rExt = runs[0]!.rExt;
    const K = (0.42 * 1080) / rExt; // px per core radius at 1920×1080
    const cent = (f: { pts: ([number, number, number] | null)[] }): [number, number] | null => {
      let x = 0, y = 0, n = 0;
      for (const q of f.pts) if (q) { x += q[0]; y += q[1]; n++; }
      return n ? [x / n, y / n] : null;
    };
    let moved = 0;
    const total = runs[0]!.fibers.length;
    for (let i = 0; i < total; i++) {
      const c0 = cent(runs[0]!.fibers[i]!);
      let best = 0;
      for (const r of runs.slice(1)) {
        const c = cent(r.fibers[i]!);
        best = Math.max(best, c0 && c ? Math.hypot(c[0] - c0[0], c[1] - c0[1]) * K : Infinity);
      }
      if (best > 10.8) moved++; // > 1% of frame height
    }
    expect(moved / total).toBeGreaterThanOrEqual(0.99);
  });

  it('is non-empty and non-exploded at every single-param extreme, across phases', () => {
    const combos: Record<string, number>[] = [defaultParams(villarceau)];
    for (const pd of villarceau.params) {
      combos.push({ ...defaultParams(villarceau), [pd.key]: pd.min });
      combos.push({ ...defaultParams(villarceau), [pd.key]: pd.max });
    }
    for (const c of combos) {
      for (const phase of [0, 0.31, 0.5, 0.77]) {
        const pts = pathPoints(render(villarceau, { ...c, phase }, 5));
        // Something on the sheet: at least a hundred segment endpoints
        // land inside the 600×840 frame.
        const inside = pts.filter(([x, y]) => x >= 0 && x <= 600 && y >= 0 && y <= 840).length;
        expect(inside, JSON.stringify({ c, phase })).toBeGreaterThan(100);
        // Nothing absurd: the pole clip bounds every coordinate.
        for (const [x, y] of pts) {
          expect(Math.abs(x - 300)).toBeLessThan(600 * 12);
          expect(Math.abs(y - 420)).toBeLessThan(600 * 12);
        }
      }
    }
  }, 60_000);

  it('below the tilt threshold the radius is bounded by cot(δmin/4) and nothing is clipped', () => {
    // At defaults θ'max = 0.32 + nest (+ jitter); the pole point stays at
    // least δmin = π − 2β − θ'max from every base point at every phase.
    const p = defaultParams(villarceau);
    const thetaMax = 0.32 + p['nest']! + JITTER_MAX;
    const beta = p['tilt']! * Math.PI / 2;
    const dMin = Math.PI - 2 * beta - thetaMax;
    expect(dMin).toBeGreaterThan(0);
    const bound = 1 / Math.tan(dMin / 4);
    let maxR = 0, nulls = 0;
    for (let k = 0; k < 40; k++) {
      const { fibers } = hopfFibers({ ...p, phase: k / 40 }, 1);
      for (const f of fibers) for (const q of f.pts) {
        if (!q) { nulls++; continue; }
        maxR = Math.max(maxR, Math.hypot(q[0], q[1], q[2]));
      }
    }
    expect(nulls).toBe(0);
    expect(maxR).toBeLessThanOrEqual(bound * 1.001);
    expect(maxR).toBeGreaterThan(bound * 0.6); // the bound is genuinely approached
  });

  it('above the threshold fibers cross the pole and the clip bounds every coordinate', () => {
    const p = { ...defaultParams(villarceau), tilt: 1, pole: 1, spread: 1 };
    let nulls = 0;
    for (let k = 0; k < 40; k++) {
      const { fibers, rExt } = hopfFibers({ ...p, phase: k / 40 }, 1);
      for (const f of fibers) for (const q of f.pts) {
        if (!q) { nulls++; continue; }
        expect(Math.hypot(q[0], q[1])).toBeLessThanOrEqual(12 * rExt);
      }
    }
    expect(nulls).toBeGreaterThan(0);
    const svg = render(villarceau, { ...p, phase: 0.4 }, 1);
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
  });

  it('pole > 1 pulls the outer rings in', () => {
    const p = { ...defaultParams(villarceau), tilt: 1, spread: 1, phase: 0.5 };
    const ext = (pole: number) => hopfFibers({ ...p, pole }, 1).fibers
      .reduce((m, f) => Math.max(m, ...f.pts.map((q) => (q ? Math.hypot(q[0], q[1]) : 0))), 0);
    expect(ext(1.3)).toBeLessThan(ext(1) * 0.5);
  });
});
