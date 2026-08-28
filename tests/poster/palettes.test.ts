import { describe, it, expect } from 'vitest';
import { resolvePalette, COLOR_DEFAULTS } from '../../src/poster/palettes';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Relative-luminance-ish sRGB brightness, good enough to assert a wide gap. */
function srgbLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

describe('resolvePalette', () => {
  it('defaults produce a near-black paper and a light, high-contrast ink', () => {
    const p = resolvePalette({});
    const [pr, pg, pb] = hexToRgb(p.paper);
    const [ir, ig, ib] = hexToRgb(p.ink);
    expect(pr).toBeLessThan(40);
    expect(pg).toBeLessThan(40);
    expect(pb).toBeLessThan(40);
    // Li = paperL + 0.72 (OKLab lightness), which is *not* linear in sRGB —
    // at the default paperL of 0.09 this lands ink around sRGB 193, a light
    // grey rather than literal white. Still >190 sRGB points of contrast
    // against the near-black paper (see the luminance-gap test below for
    // the actual readability guarantee).
    expect(ir).toBeGreaterThan(180);
    expect(ig).toBeGreaterThan(180);
    expect(ib).toBeGreaterThan(180);
  });

  it('chroma: 0 gives greys for paper and ink (accent keeps its baked-in +0.09 chroma by design, so it always registers even in monochrome mode)', () => {
    const p = resolvePalette({ chroma: 0, hue: 137 });
    for (const hex of [p.paper, p.ink]) {
      const [r, g, b] = hexToRgb(hex);
      expect(r).toBe(g);
      expect(g).toBe(b);
    }
    const [ar, ag, ab] = hexToRgb(p.accent);
    expect(ar === ag && ag === ab).toBe(false);
  });

  it('a hex override wins over the derived colour', () => {
    const p = resolvePalette({ hue: 10, chroma: 0.1, bg: '131a2b', ink: 'e8dcc0', acc: 'd9a441' });
    expect(p).toEqual({ paper: '#131a2b', ink: '#e8dcc0', accent: '#d9a441' });
  });

  it('rejects malformed hex overrides and falls back to the derived colour', () => {
    const derived = resolvePalette({});
    const p = resolvePalette({ bg: 'xyz', ink: '<script>' });
    expect(p.paper).toBe(derived.paper);
    expect(p.ink).toBe(derived.ink);
  });

  it('uses COLOR_DEFAULTS when no colour state is given', () => {
    expect(resolvePalette({})).toEqual(
      resolvePalette({ ...COLOR_DEFAULTS }),
    );
  });

  it('guarantees a wide perceptual gap between paper and ink across the full paperL range, at every chroma and hue', () => {
    // Integer-stepped (not accumulated float addition) so paperL hits exact
    // values like 0.50 — the single point where both branches of the Li
    // tie-break clamp to an extreme and the guarantee is tightest.
    for (let i = 4; i <= 96; i += 2) {
      const paperL = i / 100;
      for (const chroma of [0, 0.11, 0.22]) {
        for (const hue of [0, 90, 180, 250, 270, 300]) {
          const p = resolvePalette({ paperL, chroma, hue });
          const gap = Math.abs(srgbLuminance(p.paper) - srgbLuminance(p.ink));
          expect(gap).toBeGreaterThan(0.35);
        }
      }
    }
  });
});
