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

function srgbDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

/** Mirrors the inkL formula in resolvePalette — needed here only to decide
 *  which sampled points fall in the "model has headroom" band below. */
function inkLOf(paperL: number): number {
  return Math.min(
    0.97,
    Math.max(0.05, paperL <= 0.5 ? 0.91 + paperL * 0.09 : 0.02 + (paperL - 0.5) * 0.35),
  );
}

describe('resolvePalette', () => {
  it('defaults produce a near-black paper and a light, high-contrast ink', () => {
    const p = resolvePalette({});
    const [pr, pg, pb] = hexToRgb(p.paper);
    const [ir, ig, ib] = hexToRgb(p.ink);
    expect(pr).toBeLessThan(40);
    expect(pg).toBeLessThan(40);
    expect(pb).toBeLessThan(40);
    // Li = 0.91 + paperL * 0.09 (OKLab lightness) for paperL <= 0.5, which is
    // *not* linear in sRGB — at the default paperL of 0.09 this lands ink
    // around sRGB 228 (#e4e4e4), crisp and near-white rather than mid-grey.
    // (See the luminance-gap test below for the actual readability guarantee.)
    expect(ir).toBeGreaterThan(220);
    expect(ig).toBeGreaterThan(220);
    expect(ib).toBeGreaterThan(220);
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

  // Accent distinctness is asserted in two tiers, and it's worth saying why:
  //
  // Two sRGB colours pinned near the same extreme (true black or true
  // white) cannot be far apart in Euclidean RGB distance no matter how
  // their OKLCH hue differs — that's an 8-bit gamut limit, not a defect.
  // Worked example at inkL≈0.057 (paperL just past 0.5, chroma maxed):
  // hue 0/60/150 resolve to #020001 / #010000 / #000100 — genuinely
  // different hues, distinct by construction, but only 1-2 sRGB levels
  // apart. No accent model can clear a distance of 28 there.
  //
  // So: a distance >= 6 floor holds *everywhere* — this is the "accent
  // never silently equals ink" guarantee, the actual bug the review found.
  // The strong distance >= 28 guarantee is asserted only where the model
  // has lightness headroom to work with (0.12 <= inkL <= 0.90); outside
  // that band it's the documented limit above, not a regression. The
  // paper/accent luminance-gap (legibility) guarantee has no such carve-out
  // — it holds unconditionally, at every sampled point including the
  // headroom band's edges and accentShift = 0.
  describe('accent distinctness', () => {
    const INK_HEADROOM_MIN = 0.12;
    const INK_HEADROOM_MAX = 0.9;

    it('accent never collapses into ink (distance >= 6 everywhere) and stays legible on paper (luminance gap >= 0.28 everywhere)', () => {
      for (let i = 4; i <= 96; i += 2) {
        const paperL = i / 100;
        for (const chroma of [0, 0.08, 0.16]) {
          for (const hue of [0, 90, 180, 250, 270, 300]) {
            for (const accentShift of [0, 60, 150]) {
              const p = resolvePalette({ paperL, chroma, hue, accentShift });
              const dist = srgbDistance(p.ink, p.accent);
              const lumGap = Math.abs(srgbLuminance(p.paper) - srgbLuminance(p.accent));
              expect(dist).toBeGreaterThanOrEqual(6);
              expect(lumGap).toBeGreaterThanOrEqual(0.28);
            }
          }
        }
      }
    });

    it('accent is strongly distinct from ink (distance >= 28) wherever the model has lightness headroom (0.12 <= inkL <= 0.90)', () => {
      let checked = 0;
      for (let i = 4; i <= 96; i += 2) {
        const paperL = i / 100;
        if (inkLOf(paperL) < INK_HEADROOM_MIN || inkLOf(paperL) > INK_HEADROOM_MAX) continue;
        for (const chroma of [0, 0.08, 0.16]) {
          for (const hue of [0, 90, 180, 250, 270, 300]) {
            for (const accentShift of [0, 60, 150]) {
              checked++;
              const p = resolvePalette({ paperL, chroma, hue, accentShift });
              const dist = srgbDistance(p.ink, p.accent);
              expect(dist).toBeGreaterThanOrEqual(28);
            }
          }
        }
      }
      // Sanity check that the headroom band actually sampled something —
      // an empty band would make this test vacuously true.
      expect(checked).toBeGreaterThan(0);
    });
  });
});
