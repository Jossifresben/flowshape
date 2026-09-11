import { describe, it, expect } from 'vitest';
import { contour } from '../../src/patterns/contour';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(contour, { maxElements: 40 });

describe('contour specifics', () => {
  it('draws one region per level above the base, lowest first', () => {
    const base = defaultParams(contour);
    const svg = render(contour, { ...base, levels: 5, accentEvery: 0 }, 3);
    const fills = [...svg.matchAll(/<path[^>]* fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
    expect(fills).toEqual(['#000000', '#ffffff', '#000000', '#ffffff']);
  });
  it('every loop closes and every point lies inside the frame', () => {
    const base = defaultParams(contour);
    const svg = render(contour, base, 3);
    for (const m of svg.matchAll(/ d="([^"]+)"/g)) {
      const d = m[1]!;
      expect((d.match(/M/g) ?? []).length).toBe((d.match(/Z/g) ?? []).length);
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      for (let i = 0; i < nums.length; i += 2) {
        expect(nums[i]).toBeGreaterThanOrEqual(0);
        expect(nums[i]).toBeLessThanOrEqual(600);
        expect(nums[i + 1]).toBeGreaterThanOrEqual(0);
        expect(nums[i + 1]).toBeLessThanOrEqual(840);
      }
    }
  });
  it('isolines mode strokes instead of filling', () => {
    const base = defaultParams(contour);
    const svg = render(contour, { ...base, mode: 1 }, 3);
    expect(svg).toContain('fill="none"');
    expect(svg).not.toContain('evenodd');
  });
});
