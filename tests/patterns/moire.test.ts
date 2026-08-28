import { describe, it, expect } from 'vitest';
import { moire } from '../../src/patterns/moire';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(moire, { maxElements: 600 });

describe('moire specifics', () => {
  it('identical gratings produce a different result from the defaults', () => {
    const base = defaultParams(moire);
    const identical = render(moire, { ...base, spacingB: base['spacingA']!, angleB: base['angleA']! }, 1);
    const defaults = render(moire, base, 1);
    expect(identical).not.toBe(defaults);
  });

  it('both modes render elements', () => {
    const base = defaultParams(moire);
    const lines = render(moire, { ...base, mode: 0 }, 1);
    const circles = render(moire, { ...base, mode: 1 }, 1);
    expect((lines.match(/<path/g) ?? []).length).toBeGreaterThan(0);
    expect((circles.match(/<circle/g) ?? []).length).toBeGreaterThan(0);
  });
});
