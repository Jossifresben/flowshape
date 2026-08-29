import { describe, it, expect } from 'vitest';
import { nested } from '../../src/patterns/nested';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(nested, { maxElements: 10 });

const countEls = (svg: string): number => (svg.match(/<(circle|path|line|rect|polygon)/g) ?? []).length;
const dataLength = (svg: string): number =>
  (svg.match(/ d="[^"]*"/g) ?? []).reduce((n, s) => n + s.length, 0);

describe('nested specifics', () => {
  it('keeps a constant element count as the lattice gets denser', () => {
    const p = defaultParams(nested);
    const counts = [70, 40, 30, 20, 14].map((cell) => countEls(render(nested, { ...p, cell }, 1)));
    // Bucketing means density changes the `d` strings, never the element list.
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBeLessThanOrEqual(10);
    // ...and the densest render really is doing much more work.
    expect(dataLength(render(nested, { ...p, cell: 14 }, 1)))
      .toBeGreaterThan(4 * dataLength(render(nested, { ...p, cell: 70 }, 1)));
  });

  it('twist changes the picture', () => {
    const p = defaultParams(nested);
    const off = render(nested, { ...p, twist: 0 }, 1);
    const on = render(nested, { ...p, twist: 1 }, 1);
    expect(on).not.toBe(off);
    // Same elements, different ink/paper split: the twist rotates which face
    // of each ring is inked, it does not add or remove geometry.
    expect(countEls(on)).toBe(countEls(off));
  });

  it('depth adds path data but not elements', () => {
    const p = defaultParams(nested);
    const shallow = render(nested, { ...p, depth: 2 }, 1);
    const deep = render(nested, { ...p, depth: 5 }, 1);
    expect(dataLength(deep)).toBeGreaterThan(2 * dataLength(shallow));
    expect(countEls(deep)).toBe(countEls(shallow));
    // depth 1 is the one honest exception: with a single ring there is no
    // paper-parity band at all, so that bucket is dropped rather than emitted
    // empty. It is still a two-tone hex field with a core cube, not a break.
    const one = render(nested, { ...p, depth: 1 }, 1);
    expect(countEls(one)).toBe(countEls(shallow) - 1);
  });

  it('all three render modes differ, and outline emits no fills', () => {
    const p = defaultParams(nested);
    const svgs = [0, 1, 2].map((render_) => render(nested, { ...p, render: render_ }, 1));
    expect(new Set(svgs).size).toBe(3);
    const outlineBody = (svgs[1]!.match(/<path[^>]*>/g) ?? []);
    expect(outlineBody.length).toBe(1);
    expect(outlineBody[0]).toContain('fill="none"');
  });
});
