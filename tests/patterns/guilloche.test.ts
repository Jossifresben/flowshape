import { describe, it, expect } from 'vitest';
import { guilloche } from '../../src/patterns/guilloche';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(guilloche, { maxElements: 50 });

describe('guilloche specifics', () => {
  it('draws one closed path per ring', () => {
    const base = defaultParams(guilloche);
    const svg = render(guilloche, { ...base, rings: 10 }, 1);
    expect((svg.match(/<path/g) ?? []).length).toBe(10);
    expect((svg.match(/Z"/g) ?? []).length).toBe(10);
  });

  it('never leaves its outer radius at maximal depth', () => {
    const base = { ...defaultParams(guilloche), depth: 0.3, rings: 30 };
    const d = render(guilloche, base, 1);
    const Rmax = 600 * 0.44 + 0.5;
    for (const m of d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) {
      const x = Number(m[1]) - 300, y = Number(m[2]) - 420;
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(Rmax);
    }
  });
});
