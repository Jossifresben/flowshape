import { describe, it, expect } from 'vitest';
import { coulomb } from '../../src/patterns/coulomb';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(coulomb, { maxElements: 4000 });

describe('coulomb specifics', () => {
  it('more charges changes the output', () => {
    const base = defaultParams(coulomb);
    const a = render(coulomb, { ...base, charges: 2 }, 3);
    const b = render(coulomb, { ...base, charges: 8 }, 3);
    expect(a).not.toBe(b);
  });
});
