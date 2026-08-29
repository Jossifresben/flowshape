import { describe, it, expect } from 'vitest';
import { stipple } from '../../src/patterns/stipple';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(stipple, { maxElements: 9000 });

describe('stipple specifics', () => {
  it('emits only circles, denser center than corners at defaults', () => {
    const svg = render(stipple, defaultParams(stipple), 3);
    expect(svg).toContain('<circle');
    expect(svg).not.toContain('<path');
  });
});
