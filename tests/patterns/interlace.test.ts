import { describe, it, expect } from 'vitest';
import { interlace } from '../../src/patterns/interlace';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(interlace, { maxElements: 4000 });

const countPaths = (svg: string): number => (svg.match(/<path/g) ?? []).length;

describe('interlace specifics', () => {
  it('junctions off emits strictly fewer elements than the woven form', () => {
    const base = defaultParams(interlace);
    const bare = render(interlace, { ...base, junctions: 0 }, 1);
    const woven = render(interlace, { ...base, junctions: 1 }, 1);
    expect(countPaths(bare)).toBeGreaterThan(0);
    expect(countPaths(bare)).toBeLessThan(countPaths(woven));
  });

  it('every ink band has a matching paper core over the identical geometry', () => {
    const svg = render(interlace, defaultParams(interlace), 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    const ink = paths.filter((t) => t.includes('stroke="#000000"'));
    const paper = paths.filter((t) => t.includes('stroke="#ffffff"'));
    expect(ink.length).toBeGreaterThan(0);
    expect(paper.length).toBe(ink.length);
    // The ribbon invariant: same `d`, two widths — the pair *is* the band.
    const dOf = (tag: string): string => /\bd="([^"]*)"/.exec(tag)?.[1] ?? '';
    const wOf = (tag: string): number => Number(/stroke-width="([^"]*)"/.exec(tag)?.[1]);
    for (let i = 0; i < ink.length; i++) {
      expect(dOf(paper[i]!)).toBe(dOf(ink[i]!));
      expect(wOf(paper[i]!)).toBeLessThan(wOf(ink[i]!));
      expect(dOf(ink[i]!).length).toBeGreaterThan(0);
    }
  });

  it('survives the degenerate corner: fat ribbon on a small ring', () => {
    // Without the gap clamp, t exceeds the strand's own length here and the
    // under-strands are cut away to nothing.
    const svg = render(interlace, {
      ...defaultParams(interlace), ribbonWidth: 0.30, ringScale: 0.45, gapScale: 2.5,
    }, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    const dOf = (tag: string): string => /\bd="([^"]*)"/.exec(tag)?.[1] ?? '';
    expect(paths.length).toBe(4);
    for (const tag of paths) expect(dOf(tag).length).toBeGreaterThan(100);
    // Both strand families still draw: rings (three arcs per face) and arms.
    const [ringInk, , armInk] = paths;
    expect((dOf(ringInk!).match(/M/g) ?? []).length).toBeGreaterThan(100);
    expect((dOf(armInk!).match(/M/g) ?? []).length).toBeGreaterThan(100);
    expect(svg).not.toContain('NaN');
  });

  it('the honeycomb is bipartite by corner index parity (the free weave rule)', () => {
    // Load-bearing: the over/under alternation is derived from `k % 2` alone,
    // which is only legitimate if every honeycomb vertex is seen with the same
    // parity by all three faces that share it.
    const S = 34;
    const byVertex = new Map<string, Set<number>>();
    for (let r = -4; r <= 4; r++) {
      for (let q = -4; q <= 4; q++) {
        const hx = S * Math.sqrt(3) * (q + r / 2);
        const hy = S * 1.5 * r;
        for (let k = 0; k < 6; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 3;
          const key = `${(hx + S * Math.cos(a)).toFixed(3)},${(hy + S * Math.sin(a)).toFixed(3)}`;
          if (!byVertex.has(key)) byVertex.set(key, new Set());
          byVertex.get(key)!.add(k % 2);
        }
      }
    }
    const shared = [...byVertex.values()].filter((s) => s.size > 0);
    expect(shared.length).toBeGreaterThan(50);
    for (const parities of shared) expect(parities.size).toBe(1);
  });
});
