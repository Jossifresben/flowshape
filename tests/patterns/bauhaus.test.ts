import { describe, it, expect } from 'vitest';
import { bauhaus, buildCells, traceChains } from '../../src/patterns/bauhaus';
import { standardPatternTests, render } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(bauhaus, { maxElements: 120 });

describe('bauhaus specifics', () => {
  const base = defaultParams(bauhaus);
  const SIZE = { w: 600, h: 840 };

  it('every motif × symmetry renders something under every render mode', () => {
    for (let motif = 0; motif <= 8; motif++) for (let symmetry = 0; symmetry <= 3; symmetry++) for (const render of [0, 1]) {
      const svg = generateSafe(bauhaus, { ...base, motif, symmetry, render }, 5, SIZE);
      expect(svg.children.length, `motif ${motif} symmetry ${symmetry} render ${render}`).toBeGreaterThan(1);
    }
  });

  it('stripe count sets the number of stroke lanes (one path bucket per lane)', () => {
    const paths = (n: number): number => (render(bauhaus, { ...base, stripes: n }, 3).match(/<path/g) ?? []).length;
    expect(paths(6)).toBeGreaterThan(paths(2));
  });

  it('bands mode draws only the even lanes, so a two-stripe band is one lane', () => {
    const svg = generateSafe(bauhaus, { ...base, motif: 1, stripes: 2, render: 1 }, 3, SIZE);
    const strokes = svg.children.filter((c) => c.tag === 'path' && c.attrs['stroke'] === 'ink');
    expect(strokes).toHaveLength(1);
  });

  it('the dot chain motif emits discs and ignores the stripe params', () => {
    const a = render(bauhaus, { ...base, motif: 8, stripes: 3 }, 3);
    const b = render(bauhaus, { ...base, motif: 8, stripes: 9, width: 0.2, tilt: 1 }, 3);
    expect(a).toContain('<circle');
    expect(a).toBe(b);
  });

  it('accentEvery paints some chains in the accent colour', () => {
    const svg = render(bauhaus, { ...base, accentEvery: 3 }, 3);
    expect(svg).toContain('stroke="#e3261a"');
  });

  it('repeat 2 under free placement tiles the field with a 2×2 period', () => {
    // With a 2-cell repeat, the cell at (I, J) is a copy of (I mod 2, J mod 2):
    // the rendering at repeat 2 and repeat 4 must differ, since 4 admits more
    // distinct cells.
    expect(render(bauhaus, { ...base, repeat: 2 }, 3)).not.toBe(render(bauhaus, { ...base, repeat: 4 }, 3));
  });

  /**
   * The ribbon argument, as a test. A ribbon along a closed curve in the
   * plane has a trivial normal bundle, so a stripe at transverse position p
   * must return to p after one circuit: no closed chain may compose to
   * p → 1 − p. An earlier tracer reported such "Möbius loops"; they were
   * chains between two dead ends walked from a mid-point in one direction,
   * whose other half later stopped at the first half's start and was
   * labelled closed. This pins both facts: every chain runs end to end, and
   * every round trip is the identity.
   */
  it('every chain runs end to end, and no closed chain reverses a stripe', () => {
    const ACROSS = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]] as const;
    for (const motif of [0, 4, 6, 7]) for (const symmetry of [0, 1, 3]) for (const seed of [1, 7, 42]) {
      const params = { ...base, motif, symmetry, repeat: 0 };
      const cols = 10, rows = 14;
      const cells = buildCells(params, seed, cols, rows);
      const chains = traceChains(cells, cols, rows);
      const cellAt = (I: number, J: number) => (I < 0 || J < 0 || I >= cols || J >= rows ? null : cells[J * cols + I]!);
      const endsFree = (I: number, J: number, side: number): boolean => {
        const [dI, dJ, ns] = ACROSS[side]!;
        const nb = cellAt(I + dI, J + dJ);
        return nb === null || !nb.prims.some((pr) => pr.sides.includes(ns as 0 | 1 | 2 | 3));
      };
      const seen = new Set<string>();
      for (const c of chains) {
        for (const st of c.steps) {
          const k = `${st.cell.I},${st.cell.J}:${st.cell.prims.indexOf(st.prim)}`;
          expect(seen.has(k), `segment ${k} on two chains (motif ${motif}, sym ${symmetry}, seed ${seed})`).toBe(false);
          seen.add(k);
        }
        const first = c.steps[0]!, last = c.steps[c.steps.length - 1]!;
        if (c.closed) {
          expect(c.frozen, `closed chain reverses a stripe (motif ${motif}, sym ${symmetry}, seed ${seed})`).toBe(false);
        } else {
          expect(endsFree(first.cell.I, first.cell.J, first.sin), `open chain starts mid-band (motif ${motif}, sym ${symmetry}, seed ${seed})`).toBe(true);
          expect(endsFree(last.cell.I, last.cell.J, last.sout), `open chain ends mid-band (motif ${motif}, sym ${symmetry}, seed ${seed})`).toBe(true);
        }
      }
      // and every segment of every cell is on exactly one chain
      expect(seen.size).toBe(cells.reduce((n, c) => n + c.prims.length, 0));
    }
  });
});
