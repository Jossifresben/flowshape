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
 *  `accentC` below — is still allowed to reach into it.
 *
 *  Raising it was investigated and rejected on measurements, so that the next
 *  reader does not have to repeat the sweep:
 *
 *  1. It buys almost no colour. Sweeping candidate caps 0.16 -> 0.22 and
 *     re-running every guarantee left the worst case *bit-identical* at each
 *     one (paper/ink gap 0.381, paper/accent gap 0.283, ink/accent distance
 *     13.0) — because sRGB gamut reduction is already the binding constraint,
 *     not this cap. Counted directly: over the hue circle at ink's lightness,
 *     chroma in (0.16, 0.22] adds ZERO new ink hexes for every paperL > 0.5
 *     (ink near black), and 10-41 out of 345-600 for paperL <= 0.5. At the
 *     default hue the extra range is a literal no-op: ink is #cde5ff at both
 *     0.16 and 0.22. The other two roles cannot use it at all — `accentC`
 *     saturates at its 0.22 clamp once chroma >= 0.13, and `paperC` at its
 *     0.06 clamp once chroma >= 0.1714.
 *
 *  2. It would silently repaint live posters. This constant is not only the
 *     slider's ceiling; it is the denominator of `monoFactor` below. Changing
 *     it changes `accentL` for every chroma already in a shared URL — at
 *     0.16 -> 0.22, five of the six sampled showcase palettes moved (e.g.
 *     accent #95caff -> #8ac5ff). Decoupling the two roles would avoid that,
 *     but by (1) there is nothing on the other side worth the seam.
 *
 *  The perceived narrowness this was meant to address was never chroma. It
 *  was that paper, ink and accent all derived from one hue; `hueSpread`
 *  is the fix. */
const CHROMA_MAX = 0.16;

/**
 * Derives paper/ink/accent from five controls in OKLCH space.
 *
 * The model has two hue axes, not one. `hue` positions ink; `hueSpread`
 * offsets *paper* from it and `accentShift` offsets accent from it. Before
 * `hueSpread` existed every role derived from the single `hue`, so the whole
 * design was one hue plus a lightness slider: combinatorially large but
 * perceptually narrow — a warm ground under cool ink was simply not
 * expressible. The spread buys that range without adding a drop of chroma,
 * which is the point: it widens the set of distinct *looks*, not the
 * saturation.
 *
 * Parameterised as a signed offset in [-180, 180] rather than an absolute
 * paper hue in [0, 360) for two reasons. First, 0 is then the centre of the
 * slider AND the identity, so the control reads as "off in the middle" and
 * old URLs (which omit the key) land on it by construction. Second, +-180
 * covers every hue *relationship* exactly once — the circle is symmetric, so
 * a spread of +200 is the relationship -160 — and the sign is meaningful to
 * the eye: one direction warms the ground against the mark, the other cools
 * it. The endpoints -180 and +180 name the same complementary relationship;
 * that duplicate is the price of putting the identity at the centre, and it
 * is the right trade for a control whose default is "do nothing".
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
  const hueSpread = c.hueSpread ?? COLOR_DEFAULTS.hueSpread;
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

  // `hue + hueSpread` with hueSpread at its default of 0 is exactly `hue` for
  // every finite hue, so the pre-spread palette is reproduced bit-for-bit —
  // asserted directly in tests/poster/palettes.test.ts rather than assumed,
  // because live poster URLs depend on it.
  //
  // The spread is applied unconstrained across the full +-180. That is a
  // measured decision, not an omission: paper's chroma is already held to
  // min(chroma * 0.35, 0.06), so moving its hue moves its sRGB luminance very
  // little. Sweeping the whole space costs the paper/ink luminance gap 0.0014
  // in the worst case (0.3928 -> 0.3914 against a 0.35 floor) and costs the
  // paper/accent gap nothing at all. There is no region of this axis that
  // needs clamping, folding into paperC, or compensating in inkL.
  const paper = oklchToHex(paperL, paperC, hue + hueSpread);
  const ink = oklchToHex(inkL, chroma, hue);
  const accent = oklchToHex(accentL, accentC, hue + accentShift);

  return {
    paper: c.bg && HEX.test(c.bg) ? '#' + c.bg.toLowerCase() : paper,
    ink: c.ink && HEX.test(c.ink) ? '#' + c.ink.toLowerCase() : ink,
    accent: c.acc && HEX.test(c.acc) ? '#' + c.acc.toLowerCase() : accent,
  };
}
