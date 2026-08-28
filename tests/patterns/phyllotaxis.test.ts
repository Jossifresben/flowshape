import { describe, it, expect } from 'vitest';
import { phyllotaxis } from '../../src/patterns/phyllotaxis';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(phyllotaxis, { maxElements: 1600 });

describe('phyllotaxis specifics', () => {
  it('emits one circle per point plus accents', () => {
    const p = { ...defaultParams(phyllotaxis), points: 200, accentEvery: 50 };
    const svg = render(phyllotaxis, p, 1);
    expect(svg.match(/<circle/g)!.length).toBe(200);
    expect(svg.match(/#e3261a/g)!.length).toBe(4); // n = 0, 50, 100, 150
  });
});
