import { describe, it, expect } from 'vitest';
import { girih } from '../../src/patterns/girih';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(girih, { maxElements: 3 });

describe('girih specifics', () => {
  it('contact angle changes the geometry', () => {
    const base = defaultParams(girih);
    expect(render(girih, { ...base, contactAngle: 30 }, 1)).not.toBe(
      render(girih, { ...base, contactAngle: 72 }, 1),
    );
  });
});
