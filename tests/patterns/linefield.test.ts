import { describe, it, expect } from 'vitest';
import { linefield } from '../../src/patterns/linefield';
import { standardPatternTests, render, SIZE } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(linefield, { maxElements: 1500 });

interface Stroke { x1: number; y1: number; x2: number; y2: number; op: number }

function strokes(svg: string): Stroke[] {
  const out: Stroke[] = [];
  for (const m of svg.matchAll(/<line ([^/>]*)\/>/g)) {
    const attr = (k: string): number => {
      const a = m[1]!.match(new RegExp(`${k}="([^"]*)"`));
      return a ? Number(a[1]) : NaN;
    };
    out.push({ x1: attr('x1'), y1: attr('y1'), x2: attr('x2'), y2: attr('y2'), op: attr('opacity') });
  }
  return out;
}

describe('linefield specifics', () => {
  const d = defaultParams(linefield);

  it('loop closure: phase 1 is byte-identical to phase 0', () => {
    expect(render(linefield, { ...d, phase: 1 }, 9)).toBe(render(linefield, { ...d, phase: 0 }, 9));
  });

  it('phase is live between the wraps and moves only orientations, never the grid', () => {
    const a = render(linefield, { ...d, phase: 0 }, 9);
    const b = render(linefield, { ...d, phase: 0.37 }, 9);
    expect(a).not.toBe(b);
    const sa = strokes(a), sb = strokes(b);
    expect(sb.length).toBe(sa.length);
    // Stroke midpoints are the grid, and the grid must not move with phase.
    for (let i = 0; i < sa.length; i++) {
      expect((sa[i]!.x1 + sa[i]!.x2) / 2).toBeCloseTo((sb[i]!.x1 + sb[i]!.x2) / 2, 1);
      expect((sa[i]!.y1 + sa[i]!.y2) / 2).toBeCloseTo((sb[i]!.y1 + sb[i]!.y2) / 2, 1);
    }
  });

  it('seed is live at defaults in the element set (endpoint coordinates change)', () => {
    const a = strokes(render(linefield, d, 1));
    const b = strokes(render(linefield, d, 2));
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBe(a.length);
    const moved = a.filter((s, i) => s.x1 !== b[i]!.x1 || s.y1 !== b[i]!.y1).length;
    // A different seed is a different field: most orientations must change.
    expect(moved).toBeGreaterThan(a.length / 2);
  });

  it('swirl 0 + waviness 0 still draws an honest full grid', () => {
    const svg = render(linefield, { ...d, swirl: 0, waviness: 0 }, 3);
    const s = strokes(svg);
    expect(s.length).toBeGreaterThan(100);
    expect(svg).not.toContain('NaN');
    // Every stroke keeps its full length (θ defined everywhere via the ε
    // base rotation) and stays visible (opacity floor).
    for (const st of s) {
      expect(Math.hypot(st.x2 - st.x1, st.y2 - st.y1)).toBeGreaterThan(1);
      expect(st.op).toBeGreaterThan(0.15);
      expect(st.op).toBeLessThanOrEqual(1);
    }
  });

  it('every param at min and max yields a non-empty, non-exploded figure', () => {
    const cases: Record<string, number>[] = [];
    for (const pd of linefield.params) {
      cases.push({ ...d, [pd.key]: pd.min });
      cases.push({ ...d, [pd.key]: pd.max });
    }
    for (const c of cases) {
      const svg = render(linefield, c, 5);
      const s = strokes(svg);
      expect(s.length).toBeGreaterThan(50);
      // Strokes are centred on grid points inside the frame; endpoints may
      // overhang by at most half a stroke (< one grid spacing at every
      // legal strokeLen), so a generous frame margin catches any blow-up.
      const M = 100;
      for (const st of s) {
        for (const v of [st.x1, st.x2]) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThan(-M);
          expect(v).toBeLessThan(SIZE.w + M);
        }
        for (const v of [st.y1, st.y2]) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThan(-M);
          expect(v).toBeLessThan(SIZE.h + M);
        }
        expect(st.op).toBeGreaterThan(0);
        expect(st.op).toBeLessThanOrEqual(1);
      }
    }
  });

  it('opacity varies across the frame (|V| breathing is real)', () => {
    const s = strokes(render(linefield, d, 1));
    const ops = new Set(s.map((st) => st.op));
    expect(ops.size).toBeGreaterThan(10);
  });
});
