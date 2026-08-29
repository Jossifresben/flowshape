import { describe, it, expect } from 'vitest';
import { tumbling } from '../../src/patterns/tumbling';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(tumbling, { maxElements: 10000 });

const body = (svg: string): string[] =>
  (svg.match(/<(circle|path|line|rect|polygon|polyline|ellipse)[^>]*>/g) ?? [])
    .filter((tag) => !tag.startsWith('<rect'));

describe('tumbling specifics', () => {
  it('hatch mode emits exactly four body elements at any cell size', () => {
    for (const cell of [8, 16, 30, 44]) {
      const els = body(render(tumbling, { ...defaultParams(tumbling), render: 1, cell }, 1));
      expect(els.length).toBe(4);
      for (const tag of els) expect(tag.startsWith('<path')).toBe(true);
    }
  });

  it('coherence 0 and coherence 1 place the flips differently at the same seed', () => {
    const base = { ...defaultParams(tumbling), render: 1 };
    const noisy = render(tumbling, { ...base, coherence: 0 }, 3);
    const smooth = render(tumbling, { ...base, coherence: 1 }, 3);
    expect(noisy).not.toBe(smooth);
    // Same lattice, same void cull: only which tone bucket each rhombus lands
    // in changed, so the hexagon outline path must be byte-identical.
    expect(body(noisy)[3]).toBe(body(smooth)[3]);
  });

  it('a higher voidChance leaves strictly fewer rhombi in tones mode', () => {
    const base = { ...defaultParams(tumbling), render: 0 };
    const count = (v: number): number =>
      (render(tumbling, { ...base, voidChance: v }, 5).match(/<polygon/g) ?? []).length;
    const few = count(0.02);
    const many = count(0.4);
    expect(many).toBeLessThan(few);
    expect(few % 3).toBe(0);
    expect(many).toBeGreaterThan(0);
  });
});
