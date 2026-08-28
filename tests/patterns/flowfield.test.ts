import { describe, it, expect } from 'vitest';
import { flowfield } from '../../src/patterns/flowfield';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(flowfield, { maxElements: 4000 });

describe('flowfield specifics', () => {
  it('denser spacing produces more streamline paths', () => {
    const base = defaultParams(flowfield);
    const sparse = (render(flowfield, { ...base, spacing: 20 }, 3).match(/<path/g) ?? []).length;
    const dense = (render(flowfield, { ...base, spacing: 7 }, 3).match(/<path/g) ?? []).length;
    expect(dense).toBeGreaterThan(sparse);
  });
});
