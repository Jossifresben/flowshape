import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { fabric } from '../../src/patterns/fabric';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(fabric, { maxElements: 9000 });

const sha256 = (s: string): string => crypto.createHash('sha256').update(s).digest('hex');

/** Matches the frame the test harness renders at (see tests/patterns/harness.ts SIZE). */
const MARGIN = 20;
const FRAME_W = 600, FRAME_H = 840;
const W = FRAME_W - MARGIN * 2, H = FRAME_H - MARGIN * 2;

function parsePolygons(svg: string): [number, number][][] {
  const polys: [number, number][][] = [];
  const re = /<polygon points="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    const pts = m[1]!.trim().split(/\s+/).map((pair) => {
      const [x, y] = pair.split(',').map(Number) as [number, number];
      return [x, y] as [number, number];
    });
    polys.push(pts);
  }
  return polys;
}

describe('fabric specifics', () => {
  const base = defaultParams(fabric);
  const gridSize = base['gridSize']!;

  it('dots mode emits gridSize^2 circles', () => {
    const svg = render(fabric, { ...base, mode: 0 }, 1);
    const circles = (svg.match(/<circle/g) ?? []).length;
    expect(circles).toBe(gridSize * gridSize);
  });

  it('mesh mode emits 2*gridSize paths and no circles', () => {
    const svg = render(fabric, { ...base, mode: 1 }, 1);
    const paths = (svg.match(/<path/g) ?? []).length;
    const circles = (svg.match(/<circle/g) ?? []).length;
    expect(paths).toBe(2 * gridSize);
    expect(circles).toBe(0);
  });

  /**
   * URL-permanence proof, independent of the committed snapshot (which only
   * covers defaults, i.e. dots mode): renders of the two pre-existing modes,
   * hashed with the fabric.ts from *before* squares mode was added, must
   * still match byte-for-byte. Any change to the shared lattice/warp math
   * that squares mode's addition might have nudged would show up here.
   */
  describe('existing modes are byte-identical to their pre-squares baseline', () => {
    it('dots mode', () => {
      expect(sha256(render(fabric, { ...base, mode: 0 }, 1)))
        .toBe('1f32653d9a56c91ac9ecfc7f59bcd2c877cee05c9e0cb27e1fcff00be1c2769f');
      expect(sha256(render(fabric, { ...base, mode: 0, gridSize: 60, warpAmount: 55, noiseScale: 6.2 }, 3)))
        .toBe('d5927fe2ce812f6bcb6b42e8c24b96c492ea9a2984545618c5ad76222fc5647a');
      expect(sha256(render(fabric, { ...base, mode: 0, gridSize: 80, warpAmount: 80, noiseScale: 10 }, 9)))
        .toBe('fd62f2e45b6142a97c6d3de6cad5fdc8f165c3c7a61514e66b8a316c6d42d8b9');
    });

    it('mesh mode', () => {
      expect(sha256(render(fabric, { ...base, mode: 1 }, 1)))
        .toBe('57daa84ff9b631e18b4381104c830444df3317db19f922a9b890028a6c712dbe');
      expect(sha256(render(fabric, { ...base, mode: 1, gridSize: 60, warpAmount: 55, noiseScale: 6.2 }, 3)))
        .toBe('d23cce1033b8307a19bc960b28f3e7ea5419ac3bb1b4ba27a294962e280732e1');
      expect(sha256(render(fabric, { ...base, mode: 1, gridSize: 80, warpAmount: 80, noiseScale: 10 }, 9)))
        .toBe('9c8954c090c61ac0865027220302b3da576c7db1d384fa06205ee20faf614c22');
    });
  });
});

describe('fabric squares mode', () => {
  const base = defaultParams(fabric);
  const gridSize = base['gridSize']!;
  const squares: Record<string, number> = { ...base, mode: 2 };

  it('emits gridSize^2 polygons and no circles/paths', () => {
    const svg = render(fabric, squares, 1);
    const polys = (svg.match(/<polygon/g) ?? []).length;
    const circles = (svg.match(/<circle/g) ?? []).length;
    const paths = (svg.match(/<path/g) ?? []).length;
    expect(polys).toBe(gridSize * gridSize);
    expect(circles).toBe(0);
    expect(paths).toBe(0);
  });

  it('is deterministic: same seed and params render identically', () => {
    expect(render(fabric, squares, 42)).toBe(render(fabric, squares, 42));
  });

  it('varies with seed', () => {
    expect(render(fabric, squares, 1)).not.toBe(render(fabric, squares, 2));
  });

  it('loops seamlessly: phase 1 reproduces phase 0 byte-for-byte', () => {
    const p0 = render(fabric, { ...squares, phase: 0 }, 7);
    const p1 = render(fabric, { ...squares, phase: 1 }, 7);
    expect(p1).toBe(p0);
  });

  it('phase actually moves the squares mid-cycle (the hiding wave travels)', () => {
    const p0 = render(fabric, { ...squares, phase: 0 }, 7);
    const pMid = render(fabric, { ...squares, phase: 0.5 }, 7);
    expect(pMid).not.toBe(p0);
  });

  it('dotSize and strokeWidth have no effect (still gated to their own modes)', () => {
    const a = render(fabric, squares, 4);
    const b = render(fabric, { ...squares, dotSize: 4 }, 4); // dotSize max
    const c = render(fabric, { ...squares, strokeWidth: 1.5 }, 4); // strokeWidth max
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('warpAmount=0 draws an untouched, unrotated, axis-aligned grid of full squares', () => {
    const g = squares['gridSize']!;
    const svg = render(fabric, { ...squares, warpAmount: 0 }, 3);
    const polys = parsePolygons(svg);
    expect(polys.length).toBe(g * g);
    const spacingX = W / (g - 1), spacingY = H / (g - 1);
    const half = Math.min(spacingX, spacingY) / 2;
    let k = 0;
    for (let j = 0; j < g; j++) {
      for (let i = 0; i < g; i++) {
        const cx = MARGIN + (i / (g - 1)) * W;
        const cy = MARGIN + (j / (g - 1)) * H;
        const poly = polys[k++]!;
        const xs = poly.map((pt) => pt[0]).sort((a, b) => a - b);
        const ys = poly.map((pt) => pt[1]).sort((a, b) => a - b);
        expect(xs[0]).toBeCloseTo(cx - half, 1);
        expect(xs[3]!).toBeCloseTo(cx + half, 1);
        expect(ys[0]).toBeCloseTo(cy - half, 1);
        expect(ys[3]!).toBeCloseTo(cy + half, 1);
      }
    }
  });

  /**
   * Hard constraint: squares clamped so they never escape their own cell
   * into overlap mush, at any param extreme `randomize` can reach. Checked
   * directly against the geometry, not just "doesn't crash": every corner of
   * every square, at gridSize/warpAmount/noiseScale corners (both directions
   * of each), must stay within its own cell's half-spacing of its lattice
   * centre. Since every neighbouring cell obeys the same bound, this also
   * proves no two squares can overlap into each other's territory.
   */
  it('squares never escape their own cell at param extremes (corner test)', () => {
    const combos: Record<string, number>[] = [
      { gridSize: 80, warpAmount: 80, noiseScale: 10 }, // tightest cells, max bite, max noise frequency
      { gridSize: 20, warpAmount: 80, noiseScale: 10 }, // loosest cells, max bite
      { gridSize: 80, warpAmount: 80, noiseScale: 1 },  // tightest cells, low-frequency noise
      { gridSize: 20, warpAmount: 0, noiseScale: 10 },  // no bite at all
      { gridSize: 80, warpAmount: 0, noiseScale: 10 },
    ];
    const EPS = 0.05; // toFixed(2) rounding slack
    for (const combo of combos) {
      const params = { ...squares, ...combo };
      const g = params['gridSize']!;
      for (const seed of [1, 2, 3]) {
        const svg = render(fabric, params, seed);
        const polys = parsePolygons(svg);
        expect(polys.length).toBe(g * g);
        const spacingX = g === 1 ? W : W / (g - 1);
        const spacingY = g === 1 ? H : H / (g - 1);
        let k = 0;
        for (let j = 0; j < g; j++) {
          for (let i = 0; i < g; i++) {
            const cx = MARGIN + (g === 1 ? 0 : (i / (g - 1)) * W);
            const cy = MARGIN + (g === 1 ? 0 : (j / (g - 1)) * H);
            const poly = polys[k++]!;
            for (const [x, y] of poly) {
              expect(Math.abs(x - cx), `combo=${JSON.stringify(combo)} seed=${seed} cell=(${i},${j})`)
                .toBeLessThanOrEqual(spacingX / 2 + EPS);
              expect(Math.abs(y - cy), `combo=${JSON.stringify(combo)} seed=${seed} cell=(${i},${j})`)
                .toBeLessThanOrEqual(spacingY / 2 + EPS);
            }
          }
        }
      }
    }
  }, 60_000);
});
