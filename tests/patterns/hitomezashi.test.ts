import { describe, it, expect } from 'vitest';
import { hitomezashi } from '../../src/patterns/hitomezashi';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(hitomezashi, { maxElements: 2600 });

describe('hitomezashi specifics', () => {
  it('fillParity toggles the rect fills', () => {
    const base = defaultParams(hitomezashi);
    const on = render(hitomezashi, { ...base, fillParity: 1 }, 4).match(/<rect/g) ?? [];
    const off = render(hitomezashi, { ...base, fillParity: 0 }, 4).match(/<rect/g) ?? [];
    // Every render carries exactly one <rect>: the paper background. fillParity
    // adds grid-cell rects on top of that when enabled.
    expect(on.length).toBeGreaterThan(1);
    expect(off.length).toBe(1);
  });
});
