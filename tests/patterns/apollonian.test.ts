import { describe, it, expect } from 'vitest';
import { apollonian } from '../../src/patterns/apollonian';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(apollonian, { maxElements: 4200 });

describe('apollonian specifics', () => {
  it('emits only circles (besides the universal paper background rect)', () => {
    const svg = render(apollonian, defaultParams(apollonian), 1);
    const els = svg.match(/<(circle|path|line|rect|polygon)[^>]*>/g) ?? [];
    const body = els.filter((tag) => !tag.startsWith('<rect'));
    expect(body.length).toBeGreaterThan(0);
    for (const tag of body) expect(tag.startsWith('<circle')).toBe(true);
  });

  it('a deeper maxDepth produces strictly more circles', () => {
    const base = defaultParams(apollonian);
    const shallow = (render(apollonian, { ...base, maxDepth: 3 }, 1).match(/<circle/g) ?? []).length;
    const deep = (render(apollonian, { ...base, maxDepth: 7 }, 1).match(/<circle/g) ?? []).length;
    expect(deep).toBeGreaterThan(shallow);
  });

  it('fillAlternate fills even-depth circles at low opacity and leaves the rest unfilled', () => {
    const base = defaultParams(apollonian);
    const svg = render(apollonian, { ...base, fillAlternate: 1 }, 1);
    expect(svg).toContain('fill-opacity="0.12"');
    expect(svg).toContain('fill="none"');
  });

  it('stays within the defensive 4000-circle budget even at the extreme sweep', () => {
    const base = defaultParams(apollonian);
    const svg = render(apollonian, { ...base, maxDepth: 8, minRadius: 1 }, 1);
    const n = (svg.match(/<circle/g) ?? []).length;
    expect(n).toBeLessThanOrEqual(4000);
  });
});
