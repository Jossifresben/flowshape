import { describe, it, expect } from 'vitest';
import { curlicue } from '../../src/patterns/curlicue';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(curlicue, { maxElements: 2 });

describe('curlicue specifics', () => {
  it('is a single unbroken polyline of curls/alpha segments', () => {
    const base = { ...defaultParams(curlicue), alpha: 0.01, curls: 50 };
    const d = render(curlicue, base, 1).match(/ d="([^"]*)"/)?.[1] ?? '';
    expect((d.match(/M/g) ?? []).length).toBe(1);
    expect((d.match(/L/g) ?? []).length).toBe(5000);
  });

  it('caps the adaptive step count at the lowest alpha', () => {
    const base = { ...defaultParams(curlicue), alpha: 0.001, curls: 120 };
    const d = render(curlicue, base, 1).match(/ d="([^"]*)"/)?.[1] ?? '';
    expect((d.match(/L/g) ?? []).length).toBe(40000);
  });

  it('fits the frame at wildly different alphas (data-dependent extent is normalized)', () => {
    const base = defaultParams(curlicue);
    for (const alpha of [0.001, 0.0025, 0.007, 0.02, 0.06]) {
      const d = render(curlicue, { ...base, alpha }, 1).match(/ d="([^"]*)"/)?.[1] ?? '';
      for (const m of d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) {
        const x = Number(m[1]), y = Number(m[2]);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(600);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(840);
      }
    }
  });

  it('alpha reshapes the walk (the figure is a function of the one number)', () => {
    const base = defaultParams(curlicue);
    const a = render(curlicue, { ...base, alpha: 0.025 }, 1);
    const b = render(curlicue, { ...base, alpha: 0.007 }, 1);
    expect(a).not.toBe(b);
  });
});
