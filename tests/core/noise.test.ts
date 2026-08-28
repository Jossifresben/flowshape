import { describe, it, expect } from 'vitest';
import { makeNoise2D, fbm2D } from '../../src/core/noise';

describe('value noise', () => {
  it('is deterministic per seed and varies across seeds', () => {
    const a = makeNoise2D(7);
    const b = makeNoise2D(7);
    const c = makeNoise2D(8);
    expect(a(1.3, 4.2)).toBe(b(1.3, 4.2));
    expect(a(1.3, 4.2)).not.toBe(c(1.3, 4.2));
  });

  it('stays within [-1, 1] and is continuous-ish', () => {
    const n = makeNoise2D(3);
    for (let i = 0; i < 500; i++) {
      const x = i * 0.173, y = i * 0.291;
      const v = n(x, y);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
      expect(Math.abs(n(x + 0.001, y) - v)).toBeLessThan(0.05);
    }
  });

  it('fbm blends octaves deterministically within [-1, 1]', () => {
    const f = fbm2D(5, 2);
    expect(f(0.4, 0.9)).toBe(fbm2D(5, 2)(0.4, 0.9));
    for (let i = 0; i < 200; i++) {
      const v = f(i * 0.37, i * 0.11);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
