import { describe, it, expect } from 'vitest';
import { curlicue } from '../../src/patterns/curlicue';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(curlicue, { maxElements: 130 });

describe('curlicue specifics', () => {
  it('draws curls/alpha segments in total, chunked but unbroken', () => {
    const base = { ...defaultParams(curlicue), alpha: 0.01, curls: 50 };
    const svg = render(curlicue, base, 1);
    const ds = [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]!);
    expect(ds.length).toBe(120);
    // Total segments = N; every chunk restarts on its neighbour's endpoint,
    // so the chain has no gaps.
    expect(ds.reduce((n, d) => n + (d.match(/L/g) ?? []).length, 0)).toBe(5000);
    for (let i = 1; i < ds.length; i++) {
      const prevEnd = ds[i - 1]!.split('L').pop();
      expect(ds[i]!.startsWith(`M${prevEnd}`)).toBe(true);
    }
  });

  it('caps the adaptive step count at the lowest alpha', () => {
    const base = { ...defaultParams(curlicue), alpha: 0.001, curls: 120 };
    const svg = render(curlicue, base, 1);
    const total = [...svg.matchAll(/ d="([^"]*)"/g)]
      .reduce((n, m) => n + (m[1]!.match(/L/g) ?? []).length, 0);
    expect(total).toBe(40000);
  });

  it('fits the frame at wildly different alphas (data-dependent extent is normalized)', () => {
    const base = defaultParams(curlicue);
    for (const alpha of [0.001, 0.0025, 0.007, 0.02, 0.06]) {
      const svg = render(curlicue, { ...base, alpha }, 1);
      for (const dm of svg.matchAll(/ d="([^"]*)"/g)) {
        for (const m of dm[1]!.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) {
          const x = Number(m[1]), y = Number(m[2]);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(600);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(840);
        }
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
