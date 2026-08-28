import { describe, it, expect } from 'vitest';
import { timestable } from '../../src/patterns/timestable';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(timestable, { maxElements: 3 });

describe('timestable specifics', () => {
  it('showCircle toggles the rim', () => {
    const base = defaultParams(timestable);
    expect((render(timestable, { ...base, showCircle: 1 }, 1).match(/<circle/g) ?? []).length).toBe(1);
    expect((render(timestable, { ...base, showCircle: 0 }, 1).match(/<circle/g) ?? []).length).toBe(0);
  });
});
