import { describe, it, expect } from 'vitest';
import { DEFAULT_COLOUR_ROUTE } from '../../src/anim/presets';
import { resolvePalette, COLOR_DEFAULTS } from '../../src/poster/palettes';

/** Mirrors animate.ts's private `paletteFor` — kept in lockstep by this test
 *  rather than by exporting an implementation detail out of the UI module. */
function paletteAt(feature: number, intensity: number) {
  const route = DEFAULT_COLOUR_ROUTE;
  const hue = route.hue.from + (route.hue.to - route.hue.from) * feature;
  const chroma = feature * route.chroma.max * intensity;
  return resolvePalette({ hue, chroma });
}

describe('DEFAULT_COLOUR_ROUTE', () => {
  it('sweeps hue 250°(blue) → 30°(orange) as the driving feature (bright) goes 0 → 1', () => {
    expect(DEFAULT_COLOUR_ROUTE.hue.feature).toBe('bright');
    expect(DEFAULT_COLOUR_ROUTE.hue.from).toBe(250);
    expect(DEFAULT_COLOUR_ROUTE.hue.to).toBe(30);
  });
  it('drives chroma from level, floored at 0 — never a positive floor', () => {
    expect(DEFAULT_COLOUR_ROUTE.chroma.feature).toBe('level');
    expect(DEFAULT_COLOUR_ROUTE.chroma.max).toBeGreaterThan(0);
  });
  it('silence (feature 0) always resolves to the same ink as plain monochrome, regardless of hue', () => {
    const mono = resolvePalette({});
    const silentAtLowHue = paletteAt(0, 1);
    // At feature 0, chroma is 0 no matter where hue landed — same ink hex as
    // COLOR_DEFAULTS.chroma (0). This is the "decays to monochrome" property
    // that made the audio-spike mapping tasteful rather than gimmicky.
    expect(silentAtLowHue.ink).toBe(mono.ink);
    expect(silentAtLowHue.paper).toBe(mono.paper);
    expect(COLOR_DEFAULTS.chroma).toBe(0);
  });
  it('intensity 0 also collapses to monochrome even at full feature', () => {
    const mono = resolvePalette({});
    const p = paletteAt(1, 0);
    expect(p.ink).toBe(mono.ink);
  });
  it('full feature at full intensity introduces real chroma', () => {
    const p = paletteAt(1, 1);
    const mono = resolvePalette({});
    expect(p.ink).not.toBe(mono.ink);
  });
});
