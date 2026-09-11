import { describe, it, expect } from 'vitest';
import { whorl } from '../../src/patterns/whorl';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(whorl, { maxElements: 4 });

describe('whorl specifics', () => {
  it('bands are one evenodd path; lines are one stroked path', () => {
    const base = defaultParams(whorl);
    expect(render(whorl, base, 3)).toMatch(/<path [^>]*fill-rule="evenodd"/);
    expect(render(whorl, { ...base, render: 1 }, 3)).toMatch(/<path [^>]*fill="none"/);
  });
  it('with no centres to speak of, the loops are the plain stripes', () => {
    const base = defaultParams(whorl);
    const svg = render(whorl, { ...base, pull: 0, push: 0, count: 8, render: 1 }, 3);
    // Every drawn run that travels in x is level: a horizontal stripe. Runs
    // along the frame edge (x fixed) are the lifted ring and may climb.
    const d = svg.match(/ d="([^"]+)"/)![1]!;
    const cmds = [...d.matchAll(/([ML])(-?[\d.]+) (-?[\d.]+)/g)];
    let horizontal = 0;
    for (let i = 1; i < cmds.length; i++) {
      if (cmds[i]![1] !== 'L') continue;
      const dx = Math.abs(Number(cmds[i]![2]) - Number(cmds[i - 1]![2]));
      const dy = Math.abs(Number(cmds[i]![3]) - Number(cmds[i - 1]![3]));
      if (dx > 1) { horizontal++; expect(dy).toBeLessThan(0.2); }
    }
    expect(horizontal).toBeGreaterThan(100);
  });
  it('a full cycle of phase reproduces phase 0 byte for byte', () => {
    const base = defaultParams(whorl);
    expect(render(whorl, { ...base, phase: 1 }, 3)).toBe(render(whorl, { ...base, phase: 0 }, 3));
  });
  it('every point lies inside the frame', () => {
    const svg = render(whorl, defaultParams(whorl), 3);
    for (const m of svg.matchAll(/ d="([^"]+)"/g)) {
      const nums = m[1]!.match(/-?\d+(\.\d+)?/g)!.map(Number);
      for (let i = 0; i < nums.length; i += 2) {
        expect(nums[i]).toBeGreaterThanOrEqual(0);
        expect(nums[i]).toBeLessThanOrEqual(600);
        expect(nums[i + 1]).toBeGreaterThanOrEqual(0);
        expect(nums[i + 1]).toBeLessThanOrEqual(840);
      }
    }
  });
});
