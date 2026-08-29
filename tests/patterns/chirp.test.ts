import { describe, it, expect } from 'vitest';
import { chirp } from '../../src/patterns/chirp';
import { standardPatternTests, render, SIZE } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(chirp, { maxElements: 100 });

describe('chirp specifics', () => {
  it('emits exactly lineCount paths', () => {
    const p = defaultParams(chirp);
    const svg = render(chirp, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(p['lineCount']!);
  });

  it('changing freqEnd changes the output', () => {
    const base = defaultParams(chirp);
    const a = render(chirp, { ...base, freqEnd: 5 }, 1);
    const b = render(chirp, { ...base, freqEnd: 120 }, 1);
    expect(a).not.toBe(b);
  });

  it('stays inside the frame at maximum amplitude (no top/bottom clipping)', () => {
    const amplitude = chirp.params.find((p) => p.key === 'amplitude')!.max;
    const svg = render(chirp, { ...defaultParams(chirp), amplitude }, 1);
    const ys: number[] = [];
    for (const m of svg.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
      ys.push(Number(m[2]));
    }
    expect(ys.length).toBeGreaterThan(0);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SIZE.h);
    }
  });
});
