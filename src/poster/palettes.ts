import type { Palette } from '../core/svg';
import { oklchToHex } from '../core/oklch';
import { COLOR_DEFAULTS, type ColorState } from '../core/url-state';
export type { ColorState } from '../core/url-state';
export { COLOR_DEFAULTS } from '../core/url-state';

const HEX = /^[0-9a-fA-F]{6}$/;

/** The CHROMA slider's max. Capped below oklch.ts's accent ceiling (0.22) on
 *  purpose: 0.22 is the band where sRGB gamut reduction eats most of the hue
 *  signal accent depends on (see the accentL comment below), so the user-
 *  reachable ink chroma is kept out of that band while accent — via
 *  `accentC` below — is still allowed to reach into it. */
const CHROMA_MAX = 0.16;

/**
 * Derives paper/ink/accent from four controls in OKLCH space.
 *
 * - paper stays near-neutral (low chroma) so artwork reads against it.
 * - ink is the high-contrast counterpart of paper's lightness, at full
 *   requested chroma, so contrast is guaranteed by construction.
 * - accent's distinctness comes from hue when chroma allows it and from a
 *   lightness offset otherwise (see `accentL` below) — with a floor so
 *   that offset never fully surrenders to hue.
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
  // near-black one: the near-black extreme is more exposed to sRGB's gamut
  // boundary — at high chroma there is very little room left before the
  // colour has to reduce chroma to stay in gamut. Constants tuned by
  // brute-force sweep over paperL x chroma x hue so the worst-case sRGB
  // luminance gap clears 0.35 everywhere (see tests/poster/palettes.test.ts);
  // 0.3916 is the ceiling reachable now that oklch.ts does proper
  // chroma-reduction gamut mapping instead of a per-channel clamp (which
  // capped this at 0.368 by artificially lifting near-black's luminance).
  const inkL = Math.min(
    0.97,
    Math.max(
      0.05,
      paperL <= 0.5
        ? 0.91 + paperL * 0.09 // paperL 0.04 -> 0.914 ; 0.5 -> 0.955 (toward the ceiling)
        : 0.02 + (paperL - 0.5) * 0.35, // paperL 0.52 -> 0.057 (floor) ; 0.96 -> 0.181
    ),
  );
  // accentC is allowed to reach the full 0.22 ceiling even though the user-
  // reachable `chroma` tops out at CHROMA_MAX (0.16): that asymmetry is
  // deliberate headroom for accent, not a bug — see CHROMA_MAX's comment.
  const accentC = Math.min(chroma + 0.09, 0.22);
  // Accent's distinctness comes from hue when chroma allows it and from
  // lightness otherwise — but the lightness step is never allowed to reach
  // zero. At high chroma near an sRGB extreme, proper gamut reduction (see
  // oklch.ts) leaves hue too little room to separate accent from ink on its
  // own: two colours both pinned near true black cannot differ by much in
  // 8-bit RGB regardless of hue (e.g. inkL≈0.057, chroma maxed: hue 0/60/150
  // resolve to #020001/#010000/#000100 — genuinely different hues, but only
  // 1-2 sRGB levels apart). A residual lightness offset — floored at 40% of
  // its monochrome value even at max chroma — is what keeps accent visible
  // in that regime; the tests assert distance >= 6 everywhere as the "never
  // silently collapses" floor, and the full >= 28 guarantee only where the
  // model has headroom (0.12 <= inkL <= 0.90).
  const monoFactor = 1 - 0.4 * Math.min(chroma / CHROMA_MAX, 1);
  const accentL = Math.min(0.97, Math.max(0.05, inkL + (paperL <= 0.5 ? -1 : 1) * 0.16 * monoFactor));

  const paper = oklchToHex(paperL, paperC, hue);
  const ink = oklchToHex(inkL, chroma, hue);
  const accent = oklchToHex(accentL, accentC, hue + accentShift);

  return {
    paper: c.bg && HEX.test(c.bg) ? '#' + c.bg.toLowerCase() : paper,
    ink: c.ink && HEX.test(c.ink) ? '#' + c.ink.toLowerCase() : ink,
    accent: c.acc && HEX.test(c.acc) ? '#' + c.acc.toLowerCase() : accent,
  };
}
