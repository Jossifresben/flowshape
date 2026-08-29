import { describe, it, expect } from 'vitest';
import { bands } from '../../src/patterns/bands';
import { standardPatternTests, render, SIZE } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';
import { substance } from '../anim/coverage';

standardPatternTests(bands, { maxElements: 20 });

describe('bands specifics', () => {
  it('emits exactly bandCount filled paths with stroke none', () => {
    const p = defaultParams(bands);
    const svg = render(bands, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(p['bandCount']!);
    for (const path of paths) {
      expect(path).toMatch(/fill="[^"]+"/);
      expect(path).toContain('stroke="none"');
    }
  });

  it('a different growthExponent changes the geometry', () => {
    const base = defaultParams(bands);
    const a = render(bands, { ...base, growthExponent: 0.4 }, 1);
    const b = render(bands, { ...base, growthExponent: 3 }, 1);
    expect(a).not.toBe(b);
  });

  /**
   * Each band used to be one elliptical arc from a0 to a0 + sweepAngle, and at
   * the declared max of 360 its endpoints coincided: SVG drew nothing and the
   * poster came out near-blank. It bit before 360 as well, because endpoints
   * are written at two decimals — 359.9999 rounds to the same pair. Both are
   * reachable from the playground and from any shared URL, so the whole top of
   * the range has to survive, not just the integer.
   */
  it('keeps its substance across the top of the sweep range', () => {
    const base = defaultParams(bands);
    const at = (sweepAngle: number) =>
      substance(generateSafe(bands, { ...base, sweepAngle }, 1, SIZE), SIZE.w, SIZE.h);
    const ref = at(359);
    for (const sweepAngle of [359.5, 359.9, 359.99, 359.9999, 360]) {
      const s = at(sweepAngle);
      expect(s.elements, `elements at ${sweepAngle}`).toBe(ref.elements);
      expect(s.coverage / ref.coverage, `coverage at ${sweepAngle}`).toBeGreaterThan(0.9);
      expect(s.ink / ref.ink, `ink at ${sweepAngle}`).toBeGreaterThan(0.9);
    }
  });
});
