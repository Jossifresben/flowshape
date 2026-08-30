import { describe, it, expect } from 'vitest';
import { mystery } from '../../src/patterns/mystery';
import { standardPatternTests, render } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(mystery, { maxElements: 8 });

describe('mystery specifics', () => {
  it('layers controls the path count', () => {
    const base = defaultParams(mystery);
    expect((render(mystery, { ...base, layers: 1 }, 1).match(/<path/g) ?? []).length).toBe(1);
    expect((render(mystery, { ...base, layers: 5 }, 1).match(/<path/g) ?? []).length).toBe(5);
  });

  it('the curve has exact m-fold rotational symmetry (Farris congruence)', () => {
    // Sample the rendered path and check that rotating the point set by
    // 2π/m about the centre maps it onto itself. Done on raw path data:
    // for each sampled point, its rotation must be within a pixel of some
    // path point. m=4 keeps the check cheap.
    const params = { ...defaultParams(mystery), symmetry: 4, layers: 1 };
    const node = generateSafe(mystery, params, 9, { w: 600, h: 600 });
    const d = String(node.children.find((c) => c.tag === 'path')?.attrs['d'] ?? node.children[1]?.attrs['d'] ?? '');
    const pts = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => [Number(m[1]) - 300, Number(m[2]) - 300]);
    expect(pts.length).toBeGreaterThan(500);
    // The path closes with a duplicate of point 0, so the cycle length is
    // pts.length − 1; the modulo must use it or wrapped indices go off by one.
    const M = pts.length - 1;
    const step = Math.round(M / 4);
    for (let i = 0; i < M; i += 97) {
      const x = pts[i]![0]!, y = pts[i]![1]!;
      const rx = -y, ry = x; // rotation by 2π/4
      // The quarter-turn of point i is point i + N/4 along the same curve.
      const j = (i + step) % M;
      const qx = pts[j]![0]!, qy = pts[j]![1]!;
      expect(Math.hypot(rx - qx, ry - qy)).toBeLessThan(1.5);
    }
  });
});
