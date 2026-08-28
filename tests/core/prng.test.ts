import { describe, it, expect } from 'vitest';
import { mulberry32, deriveSeed } from '../../src/core/prng';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('yields values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('deriveSeed', () => {
  it('is stable per (seed, name) and differs across names', () => {
    expect(deriveSeed(42, 'points')).toBe(deriveSeed(42, 'points'));
    expect(deriveSeed(42, 'points')).not.toBe(deriveSeed(42, 'angle'));
    expect(deriveSeed(42, 'points')).not.toBe(deriveSeed(43, 'points'));
  });
});
