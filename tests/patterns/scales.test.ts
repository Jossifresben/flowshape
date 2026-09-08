import { describe, it, expect } from 'vitest';
import { scales } from '../../src/patterns/scales';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(scales, { maxElements: 600 });

describe('scales specifics', () => {
  const base = defaultParams(scales);
  const discs = (svg: string): number => (svg.match(/<circle/g) ?? []).length;

  it('a larger radius means fewer discs', () => {
    expect(discs(render(scales, { ...base, radius: 40 }, 1))).toBeGreaterThan(discs(render(scales, { ...base, radius: 120 }, 1)));
  });

  it('boldShare 1 is all ink discs, boldShare 0 all accent discs', () => {
    const bold = render(scales, { ...base, boldShare: 1 }, 1);
    const fine = render(scales, { ...base, boldShare: 0 }, 1);
    expect(bold).not.toContain('fill="#e3261a"');
    expect(fine).not.toContain('fill="#000000"');
  });

  it('spokes 0 removes the spokes but keeps the fine rings', () => {
    const withSpokes = render(scales, { ...base, boldShare: 0, spokes: 16 }, 1);
    const without = render(scales, { ...base, boldShare: 0, spokes: 0 }, 1);
    expect(withSpokes.length).toBeGreaterThan(without.length);
  });
});
