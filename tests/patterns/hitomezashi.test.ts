import { describe, it, expect } from 'vitest';
import { hitomezashi } from '../../src/patterns/hitomezashi';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(hitomezashi, { maxElements: 2600 });

describe('hitomezashi specifics', () => {
  it('fillParity toggles the rect fills', () => {
    const base = defaultParams(hitomezashi);
    expect(render(hitomezashi, { ...base, fillParity: 1 }, 4)).toContain('<rect');
    expect(render(hitomezashi, { ...base, fillParity: 0 }, 4)).not.toContain('<rect');
  });
});
