import { describe, it, expect } from 'vitest';
import { loxodrome } from '../../src/patterns/loxodrome';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(loxodrome, { maxElements: 300 });

describe('loxodrome specifics', () => {
  it('seeds scales the circle count linearly', () => {
    const base = defaultParams(loxodrome);
    const count = (n: number) =>
      (render(loxodrome, { ...base, seeds: n }, 1).match(/<circle/g) ?? []).length;
    // A chain may lose a few members to the pole/size guards, but each
    // seed contributes essentially its full 2·steps+1 orbit.
    expect(count(2)).toBeGreaterThan(count(1) * 1.6);
    expect(count(1)).toBeGreaterThan(base['steps']! * 1.5);
  });

  it('circle radii contract into both fixed points (loxodromic ends shrink)', () => {
    const base = { ...defaultParams(loxodrome), seeds: 1 };
    const svg = render(loxodrome, base, 1);
    const radii = [...svg.matchAll(/<circle[^>]* r="([\d.]+)"/g)].map((m) => Number(m[1]));
    // The orbit blows up mid-flow as circles sweep through the frame, but
    // both tails must spiral down into their fixed points.
    const maxR = Math.max(...radii);
    expect(Math.max(radii[0]!, radii[radii.length - 1]!)).toBeLessThan(maxR * 0.1);
  });
});
