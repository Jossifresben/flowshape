import { describe, it, expect } from 'vitest';
import { helix } from '../../src/patterns/helix';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(helix, { maxElements: 1000 });

describe('helix specifics', () => {
  it('emits both strand segments and rungs, well over turns * 24 paths', () => {
    const p = defaultParams(helix);
    const svg = render(helix, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths.length).toBeGreaterThan(p['turns']! * 24);
  });

  it('changing turns changes the output', () => {
    const base = defaultParams(helix);
    const a = render(helix, { ...base, turns: 2 }, 1);
    const b = render(helix, { ...base, turns: 12 }, 1);
    expect(a).not.toBe(b);
  });
});
