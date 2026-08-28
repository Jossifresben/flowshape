import { describe, it, expect } from 'vitest';
import { maurer } from '../../src/patterns/maurer';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(maurer, { maxElements: 10 });

describe('maurer specifics', () => {
  it('emits the walk path and an envelope path when enabled', () => {
    const p = { ...defaultParams(maurer), envelope: 1 };
    const svg = render(maurer, p, 1);
    expect(svg.match(/<path/g)!.length).toBe(2);
  });

  it('emits only the walk path when envelope is off', () => {
    const p = { ...defaultParams(maurer), envelope: 0 };
    const svg = render(maurer, p, 1);
    expect(svg.match(/<path/g)!.length).toBe(1);
  });
});
