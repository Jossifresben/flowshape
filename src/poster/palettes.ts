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
  // Ink lightness is not a fixed offset from paper: a fixed offset lands mid-grey
  // on dark papers, which reads washed out. Target a bright ink on dark paper and
  // a deep ink on light paper, and — critically — push ink FURTHER toward its
  // extreme as paper approaches mid-lightness, because that is exactly where the
  // available contrast range is smallest. (An earlier version of this formula
  // eased ink *toward* the middle as paper approached it, which is backwards: it
  // shrank the paper/ink gap right where the least margin exists, and broke the
  // perceptual-gap guarantee below for a wide paperL band around 0.5.)
  // Tie-break at paperL === 0.5 favours the near-white branch (`<=`) over the
  // near-black one: the near-black extreme is more exposed to the naive
  // per-channel gamut clamp in oklch.ts — at high chroma it lifts a saturated
  // near-black's sRGB luminance well above true black, eating into the contrast
  // guarantee. Constants tuned by brute-force sweep over paperL x chroma x hue
  // so the worst-case sRGB luminance gap clears 0.35 everywhere (see
  // tests/poster/palettes.test.ts); 0.368 is the ceiling reachable given that
  // same naive gamut clamp, matching the previous fixed-offset model's best case.
  const inkL = Math.min(
    0.97,
    Math.max(
      0.05,
      paperL <= 0.5
        ? 0.91 + paperL * 0.09 // paperL 0.04 -> 0.914 ; 0.5 -> 0.955 (toward the ceiling)
        : 0.02 + (paperL - 0.5) * 0.35, // paperL 0.52 -> 0.057 (floor) ; 0.96 -> 0.181
    ),
  );
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
