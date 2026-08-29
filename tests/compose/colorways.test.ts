import { describe, it, expect } from 'vitest';
import {
  colorwaysFor, artworkPalette, resolvePresentation,
  COLORWAY_COUNT, GROUND_L, TINT_LUM_MIN,
} from '../../src/compose/colorways';
import { contrastRatio, relativeLuminance } from '../../src/core/contrast';
import { COLOR_DEFAULTS } from '../../src/core/url-state';

const BASE = { hue: 250, chroma: 0.08, paperL: 0.09, accentShift: 150 };

describe('colorways', () => {
  it('returns an ordered, steppable list', () => {
    const ways = colorwaysFor(BASE);
    expect(ways).toHaveLength(COLORWAY_COUNT);
    ways.forEach((c, i) => expect(c.index).toBe(i));
  });

  it('keeps the user own accent as colorway 0', () => {
    const ways = colorwaysFor(BASE);
    const solo = colorwaysFor({ ...BASE }, 1);
    expect(ways[0]!.accent).toBe(solo[0]!.accent);
  });

  it('gives every colorway a print-like sheet regardless of the artwork ground', () => {
    for (const c of colorwaysFor({ ...BASE, paperL: 0.04 })) {
      expect(relativeLuminance(c.paper)).toBeGreaterThan(0.6);
      expect(contrastRatio(c.paper, c.ink)).toBeGreaterThan(7);
    }
  });

  it('separates neighbouring accents', () => {
    const ways = colorwaysFor({ ...BASE, chroma: 0.16 });
    for (let i = 1; i < ways.length; i++) {
      expect(ways[i]!.ground).not.toBe(ways[i - 1]!.ground);
    }
  });

  it('picks accent type by contrast, never by hard-coded rule', () => {
    for (const c of colorwaysFor(BASE)) {
      expect([c.paper, c.ink]).toContain(c.accentType);
      expect(contrastRatio(c.accent, c.accentType)).toBeGreaterThanOrEqual(4.5);
      expect([c.paper, c.ink]).toContain(c.groundType);
      expect(contrastRatio(c.ground, c.groundType)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('samples the ground bright enough that some hues clear the tint guard', () => {
    expect(GROUND_L).toBe(0.78);
    const passing = colorwaysFor({ ...BASE, chroma: 0.16 }).filter((c) => c.groundLum >= TINT_LUM_MIN);
    expect(passing.length).toBeGreaterThan(0);
    expect(passing.length).toBeLessThan(COLORWAY_COUNT);
  });

  it('inverts by swapping the palette, not by filtering', () => {
    const c = colorwaysFor(BASE)[0]!;
    expect(artworkPalette(c, 'as-generated')).toEqual({ paper: c.ink, ink: c.paper, accent: c.accent });
    expect(artworkPalette(c, 'inverted')).toEqual({ paper: c.paper, ink: c.ink, accent: c.accent });
    expect(artworkPalette(c, 'tinted')).toEqual({ paper: c.ground, ink: c.groundType, accent: c.groundType });
  });

  it('falls back from tinted to inverted on a dark ground', () => {
    const ways = colorwaysFor({ ...BASE, chroma: 0.16 });
    const dark = ways.find((c) => c.groundLum < TINT_LUM_MIN)!;
    const light = ways.find((c) => c.groundLum >= TINT_LUM_MIN)!;
    expect(resolvePresentation(dark, 'tinted')).toBe('inverted');
    expect(resolvePresentation(light, 'tinted')).toBe('tinted');
    expect(resolvePresentation(dark, 'as-generated')).toBe('as-generated');
  });

  it('uses defaults when the state is empty', () => {
    const ways = colorwaysFor({});
    expect(ways).toHaveLength(COLORWAY_COUNT);
    expect(ways[0]!.accent).toBe(colorwaysFor({ accentShift: COLOR_DEFAULTS.accentShift })[0]!.accent);
  });
});
