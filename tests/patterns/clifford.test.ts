import { describe, it, expect } from 'vitest';
import { clifford } from '../../src/patterns/clifford';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(clifford, { maxElements: 12500 });

describe('clifford specifics', () => {
  it('different variants produce different images', () => {
    const base = defaultParams(clifford);
    expect(render(clifford, { ...base, variant: 0 }, 1)).not.toBe(
      render(clifford, { ...base, variant: 3 }, 1),
    );
  });
});
