import { describe, it, expect } from 'vitest';
import { whorl } from '../../src/patterns/whorl';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(whorl, { maxElements: 4000 });

describe('whorl specifics', () => {
  it('the core and delta counts change the ridge topology', () => {
    const base = defaultParams(whorl);
    const arch = render(whorl, { ...base, cores: 0, deltas: 0 }, 3);
    const loop = render(whorl, { ...base, cores: 1, deltas: 1 }, 3);
    const plain = render(whorl, { ...base, cores: 2, deltas: 2 }, 3);
    expect(arch).not.toBe(loop);
    expect(loop).not.toBe(plain);
  });
  it('an arch with lean 0 is a field of near-horizontal ridges', () => {
    const base = defaultParams(whorl);
    const svg = render(whorl, { ...base, cores: 0, deltas: 0, lean: 0 }, 3);
    // Every path's first and last points share (almost) the same y.
    const paths = svg.match(/ d="([^"]+)"/g) ?? [];
    expect(paths.length).toBeGreaterThan(20);
    for (const d of paths) {
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      const y0 = nums[1]!, y1 = nums[nums.length - 1]!;
      expect(Math.abs(y0 - y1)).toBeLessThan(1);
    }
  });
});
