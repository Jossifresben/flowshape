import { describe, it, expect } from 'vitest';
import { diffgrowth } from '../../src/patterns/diffgrowth';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(diffgrowth, { maxElements: 8 });

describe('diffgrowth specifics', () => {
  it('is flagged heavy and emits rings+final paths', () => {
    expect(diffgrowth.heavy).toBe(true);
    const base = defaultParams(diffgrowth);
    const svg = render(diffgrowth, { ...base, rings: 2 }, 9);
    expect((svg.match(/<path/g) ?? []).length).toBe(3); // 2 rings + final
  });
});
