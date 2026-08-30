import { describe, it, expect } from 'vitest';
import { billiard } from '../../src/patterns/billiard';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(billiard, { maxElements: 3 });

describe('billiard specifics', () => {
  it('showEllipse toggles the rim path', () => {
    const base = defaultParams(billiard);
    expect((render(billiard, { ...base, showEllipse: 1 }, 1).match(/<path/g) ?? []).length).toBe(2);
    expect((render(billiard, { ...base, showEllipse: 0 }, 1).match(/<path/g) ?? []).length).toBe(1);
  });

  it('draws exactly the requested number of chords', () => {
    const base = { ...defaultParams(billiard), bounces: 150 };
    const d = render(billiard, base, 1).match(/ d="([^"]*)"/)?.[1] ?? '';
    expect((d.match(/L/g) ?? []).length).toBe(150);
  });

  it('every bounce lands on the ellipse (the orbit never drifts off the table)', () => {
    const base = { ...defaultParams(billiard), bounces: 800, showEllipse: 0 };
    const d = render(billiard, base, 1).match(/ d="([^"]*)"/)?.[1] ?? '';
    const A = 600 * 0.46; // harness SIZE min(w,h)=600
    const B = A * Math.sqrt(1 - 0.74 * 0.74);
    const pts = [...d.matchAll(/([ML])([\d.-]+) ([\d.-]+)/g)];
    expect(pts.length).toBe(801);
    for (const m of pts) {
      const x = Number(m[2]) - 300, y = Number(m[3]) - 420;
      const v = (x / A) ** 2 + (y / B) ** 2;
      expect(Math.abs(v - 1)).toBeLessThan(1e-3);
    }
  });
});
