import { describe, it, expect } from 'vitest';
import { truchet } from '../../src/patterns/truchet';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(truchet, { maxElements: 1200 });

describe('truchet specifics', () => {
  it('smaller cells produce more arc paths', () => {
    const base = defaultParams(truchet);
    const coarse = (render(truchet, { ...base, cell: 60 }, 2).match(/<path/g) ?? []).length;
    const fine = (render(truchet, { ...base, cell: 24 }, 2).match(/<path/g) ?? []).length;
    expect(fine).toBeGreaterThan(coarse);
  });
});
