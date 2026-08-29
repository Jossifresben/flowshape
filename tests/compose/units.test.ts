import { describe, it, expect } from 'vitest';
import { sheet, u, REF_SHORT, REF_LONG } from '../../src/compose/units';

describe('units', () => {
  it('keeps the handover reference space as A3 at 150dpi', () => {
    expect(REF_SHORT).toBe(1240);
    expect(REF_LONG).toBe(1754);
  });

  it('derives the sheet from an existing format id', () => {
    const s = sheet({ format: 'a3' });
    expect(Math.min(s.w, s.h)).toBe(600);
    expect(s.ratio).toBeCloseTo(420 / 297, 2);
    expect(s.wmm).toBe(297);
  });

  it('scales reference constants by the short edge, not the width', () => {
    const portrait = sheet({ format: 'a3' });
    const landscape = sheet({ format: 'custom', cw: 420, ch: 297, cu: 'mm' });
    expect(portrait.unit).toBeCloseTo(600 / 1240, 6);
    expect(landscape.unit).toBeCloseTo(600 / 1240, 6);
    expect(u(portrait, 88)).toBeCloseTo(88 * (600 / 1240), 6);
  });

  it('reports ratio below 1 for landscape and exactly 1 for square', () => {
    expect(sheet({ format: 'square' }).ratio).toBeCloseTo(1, 3);
    expect(sheet({ format: 'custom', cw: 420, ch: 297, cu: 'mm' }).ratio).toBeLessThan(1);
    expect(sheet({ format: 'letter' }).ratio).toBeCloseTo(279 / 216, 2);
  });

  it('falls back to the default format rather than throwing', () => {
    expect(sheet({ format: 'nope' })).toEqual(sheet({}));
  });
});
