import { describe, it, expect } from 'vitest';
import { FORMATS, DEFAULT_FORMAT, getFormat, renderSize, physicalSize } from '../../src/poster/formats';

describe('formats', () => {
  it('has unique ids and positive dimensions', () => {
    const ids = FORMATS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FORMATS) {
      expect(f.wmm).toBeGreaterThan(0);
      expect(f.hmm).toBeGreaterThan(0);
      expect(f.label.length).toBeGreaterThan(0);
    }
  });

  it('defaults to A3', () => {
    expect(DEFAULT_FORMAT).toBe('a3');
    expect(getFormat('a3')!.wmm).toBe(297);
  });

  it('falls back rather than throwing on an unknown id', () => {
    expect(getFormat('nope')).toBeUndefined();
    expect(renderSize({ format: 'nope' })).toEqual(renderSize({}));
  });

  it('fixes the short edge at 600 and follows the aspect ratio', () => {
    for (const f of FORMATS) {
      const s = renderSize({ format: f.id });
      expect(Math.min(s.w, s.h)).toBe(600);
      const wantRatio = f.hmm / f.wmm;
      expect(s.h / s.w).toBeCloseTo(wantRatio, 2);
    }
    // derived from the stored mm values, not the ideal √2 ratio — ISO sizes are themselves whole-mm roundings
    expect(renderSize({ format: 'a3' })).toEqual({ w: 600, h: 848 });
    expect(renderSize({ format: 'square' })).toEqual({ w: 600, h: 600 });
  });

  it('converts custom units to mm', () => {
    expect(physicalSize({ format: 'custom', cw: 20, ch: 30, cu: 'cm' })).toEqual({ wmm: 200, hmm: 300 });
    expect(physicalSize({ format: 'custom', cw: 2, ch: 4, cu: 'in' })).toEqual({ wmm: 50.8, hmm: 101.6 });
    expect(physicalSize({ format: 'custom', cw: 100, ch: 200, cu: 'mm' })).toEqual({ wmm: 100, hmm: 200 });
  });

  it('ignores a degenerate custom size and falls back to the default', () => {
    expect(physicalSize({ format: 'custom', cw: 0, ch: 30, cu: 'cm' })).toEqual(physicalSize({}));
    expect(physicalSize({ format: 'custom' })).toEqual(physicalSize({}));
  });
});
