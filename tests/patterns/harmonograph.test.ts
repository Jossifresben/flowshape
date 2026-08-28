import { describe, it, expect } from 'vitest';
import { harmonograph } from '../../src/patterns/harmonograph';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(harmonograph, { maxElements: 2 });

describe('harmonograph specifics', () => {
  it('is one path whose length grows with duration', () => {
    const base = defaultParams(harmonograph);
    const short = render(harmonograph, { ...base, duration: 100 }, 1);
    const long = render(harmonograph, { ...base, duration: 480 }, 1);
    expect((short.match(/<path/g) ?? []).length).toBe(1);
    expect(long.length).toBeGreaterThan(short.length);
  });
});
