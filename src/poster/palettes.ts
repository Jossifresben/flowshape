import type { Palette } from '../core/svg';
import { oklchToHex } from '../core/oklch';
import { COLOR_DEFAULTS, type ColorState } from '../core/url-state';
export type { ColorState } from '../core/url-state';
export { COLOR_DEFAULTS } from '../core/url-state';

const HEX = /^[0-9a-fA-F]{6}$/;

/**
 * Derives paper/ink/accent from four controls in OKLCH space.
 *
 * - paper stays near-neutral (low chroma) so artwork reads against it.
 * - ink is the high-contrast counterpart of paper's lightness, at full
 *   requested chroma, so contrast is guaranteed by construction.
 * - accent shares ink's lightness (so it never dominates) but pushes
 *   chroma higher and offsets hue, so it still registers distinctly.
 *
 * `bg`/`ink`/`acc` hex overrides (URL-only escape hatch) win over the
 * derived roles when present and valid.
 */
export function resolvePalette(c: ColorState): Palette {
  const hue = c.hue ?? COLOR_DEFAULTS.hue;
  const chroma = c.chroma ?? COLOR_DEFAULTS.chroma;
  const paperL = c.paperL ?? COLOR_DEFAULTS.paperL;
  const accentShift = c.accentShift ?? COLOR_DEFAULTS.accentShift;

  const paperC = Math.min(chroma * 0.35, 0.06);
  // Tie-break at paperL === 0.5 favours the "+0.72" (near-white) branch over
  // "-0.72" (near-black): with the floor/ceiling clamp below, both branches
  // land at an extreme (0.05 or 0.97) for paperL near 0.5, but the near-black
  // extreme is more exposed to the naive per-channel gamut clamp in
  // oklch.ts — at high chroma it lifts a saturated near-black's sRGB
  // luminance well above true black, eating into the contrast guarantee.
  // The near-white extreme doesn't have that failure mode, so `<=` (rather
  // than `<`) keeps the exact-midpoint case on the safe side. Verified by
  // brute-force sweep over paperL x chroma x hue: worst-case sRGB luminance
  // gap is 0.345 with `<`, 0.368 with `<=` (see tests/poster/palettes.test.ts).
  const inkL = Math.min(0.97, Math.max(0.05, paperL <= 0.5 ? paperL + 0.72 : paperL - 0.72));
  const accentC = Math.min(chroma + 0.09, 0.22);

  const paper = oklchToHex(paperL, paperC, hue);
  const ink = oklchToHex(inkL, chroma, hue);
  const accent = oklchToHex(inkL, accentC, hue + accentShift);

  return {
    paper: c.bg && HEX.test(c.bg) ? '#' + c.bg.toLowerCase() : paper,
    ink: c.ink && HEX.test(c.ink) ? '#' + c.ink.toLowerCase() : ink,
    accent: c.acc && HEX.test(c.acc) ? '#' + c.acc.toLowerCase() : accent,
  };
}
