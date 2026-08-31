import { describe, it, expect } from 'vitest';
import { RangeGain } from '../../src/audio/dsp';

/**
 * The stage's hue route maps the spectral centroid onto a hue arc. The centroid
 * is a timbre POSITION, not an energy, and its resting band depends entirely on
 * the material: measured over the four shipped demos, `bright` spans p10..p90 of
 * 0.318..0.545 on a full-band track and 0.060..0.109 on the solo piano. Mapped
 * linearly, the piano moved 11 degrees of hue across the whole piece — it read
 * as "colour is on but nothing changes", which is what Jossi reported.
 *
 * RangeGain normalizes against the range actually occupied, so a dark
 * instrument sweeps the same arc as a bright one.
 */
describe('RangeGain', () => {
  const DT = 16.7;

  it('stretches a narrow band across the full output', () => {
    const g = new RangeGain(8);
    // A signal wandering inside 0.06..0.11 — the piano's measured band.
    let lo = 1, hi = 0;
    for (let i = 0; i < 4000; i++) {
      const x = 0.085 + 0.024 * Math.sin(i / 40); // the piano's measured band
      const y = g.process(x, DT);
      if (i > 1500) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    expect(hi - lo).toBeGreaterThan(0.8);
  });

  it('does not amplify a constant input into noise', () => {
    const g = new RangeGain(8);
    let out = 0;
    for (let i = 0; i < 2000; i++) out = g.process(0.42, DT);
    // Span below MIN_SPAN parks the output mid-scale rather than stretching
    // dither into a full hue sweep.
    expect(out).toBeCloseTo(0.5, 5);
  });

  it('tracks a shifted band after a section change', () => {
    const g = new RangeGain(8);
    for (let i = 0; i < 3000; i++) g.process(0.1 + 0.02 * Math.sin(i / 30), DT);
    // Material jumps to a much brighter band. After a few half-lives the
    // normalizer must be centred on the NEW band — i.e. still producing a
    // spread, not pinned at either rail. Asserted over the distribution, not
    // a single sample: the input oscillates, so any one frame legitimately
    // lands anywhere in 0..1.
    const tail: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const y = g.process(0.7 + 0.02 * Math.sin(i / 30), DT);
      if (i > 3000) tail.push(y);
    }
    const mean = tail.reduce((a, c) => a + c, 0) / tail.length;
    expect(mean).toBeGreaterThan(0.2);
    expect(mean).toBeLessThan(0.8);
    expect(Math.max(...tail) - Math.min(...tail)).toBeGreaterThan(0.3);
  });

  it('is bounded to 0..1 for any input', () => {
    const g = new RangeGain(8);
    for (const x of [0, 1, 0.5, -0.2, 3, 0.001]) {
      const y = g.process(x, DT);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
