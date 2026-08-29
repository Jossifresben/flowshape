import { COLOR_DEFAULTS, type ColorState } from '../core/url-state';
import { oklchToHex } from '../core/oklch';
import { relativeLuminance, pickType } from '../core/contrast';
import type { Palette } from '../core/svg';

/**
 * The sheet is print-like whatever ground the user tuned for the artwork, and
 * it carries a little of the colorway's hue.
 *
 * The first version derived paper and ink from `resolvePalette` with `paperL`
 * pinned and only `accentShift` rotating. That made them byte-identical across
 * all twelve colorways - #ebebeb and #101010 every time - so stepping the
 * colour moved exactly one thing, and in most layouts that thing is a hairline
 * rule. The control worked and looked broken.
 *
 * A small chroma on the neutrals fixes it and is in spec: the handover pairs
 * its colorways with neutral variants for exactly this reason, listing
 * cool-grey and warm-cream as partners for specific accents. It stays a
 * *tint* - two hundredths of chroma - so a monochrome sheet still reads as
 * monochrome rather than becoming a coloured one.
 */
const SHEET_PAPER_L = 0.94;
const SHEET_PAPER_C = 0.022;
const SHEET_INK_L = 0.18;
const SHEET_INK_C = 0.030;

/**
 * The accent is sampled twice at the same hue, because it does two jobs, and
 * neither is the job `resolvePalette`'s accent was built for.
 *
 * `resolvePalette` derives accent relative to *ink*, which is right for artwork
 * legibility. Measured across the hue circle at sheet lightness it lands at
 * relative luminance 0.024-0.040 for every hue — around 11:1 on paper. That is
 * a fine dark mark and it is useless for both poster roles: as a full field it
 * is unreadable, and as an accent-coloured title it is indistinguishable from
 * ink, which would leave the tinted, accent-ground and accent-title modes
 * effectively dead.
 *
 * So both samples are taken directly in OKLCH with hue as the only free
 * variable — the generative scheme the handover describes:
 *
 *   MARK_L = 0.50   rules, numerals, codes, accent-coloured titles.
 *                   Worst-case 4.78:1 against paper across the hue circle,
 *                   so it clears 4.5 everywhere while staying chromatic.
 *                   L 0.55 drops to 3.83 and fails.
 *
 *   GROUND_L = 0.78 the accent as a field, and the tint bed. Clears the 0.45
 *                   tint guard for 9 of 12 hues, and the three that fail are
 *                   the reds, magentas and violets — the handover's own
 *                   hand-picked pass list (amber, vermilion and teal pass;
 *                   red, magenta, violet, ultramarine and pine fail),
 *                   reproduced from the colour model rather than transcribed.
 *                   Lower samples fail for every hue (L 0.70 -> 0 of 12).
 */
export const MARK_L = 0.50;
export const GROUND_L = 0.78;

/** Mirrors resolvePalette's own accent chroma floor. A monochrome sheet
 *  (chroma 0) still gets a distinguishable accent, which the app already does
 *  for artwork, without inventing saturation the user did not ask for. */
function accentChroma(chroma: number): number {
  return Math.min(chroma + 0.09, 0.22);
}

/** 12 steps = 30 degrees apart, clearing the handover's >= 15 degree rule. */
export const COLORWAY_COUNT = 12;

/** Below this the inverted-on-accent strokes stop reading (handover section 4). */
export const TINT_LUM_MIN = 0.45;

export interface Colorway {
  index: number;
  /** Sheet ground. */
  paper: string;
  /** Sheet type. */
  ink: string;
  /** Mark roles: rule, numeral, code, accent-coloured title. */
  accent: string;
  accentType: string;
  /** Field roles: the accent as a full ground, or as a tint bed. */
  ground: string;
  groundType: string;
  groundLum: number;
}

/**
 * Colorway 0 carries the user's own hue and accent offset. It cannot carry
 * their accent *colour*: the sheet is pinned to a light ground, and an accent
 * tuned against the dark artwork ground would not read on it. What survives is
 * the relationship they chose, not the hex.
 */
export function colorwaysFor(base: ColorState, count = COLORWAY_COUNT): Colorway[] {
  const hue = base.hue ?? COLOR_DEFAULTS.hue;
  const chroma = accentChroma(base.chroma ?? COLOR_DEFAULTS.chroma);
  const shift = base.accentShift ?? COLOR_DEFAULTS.accentShift;
  const step = 360 / count;
  const out: Colorway[] = [];
  for (let i = 0; i < count; i++) {
    // The whole palette rotates together, so every part of the sheet responds
    // to the control - not just whichever corner holds the accent mark.
    const h = hue + i * step;
    const paper = oklchToHex(SHEET_PAPER_L, SHEET_PAPER_C, h);
    const ink = oklchToHex(SHEET_INK_L, SHEET_INK_C, h);
    const accent = oklchToHex(MARK_L, chroma, h + shift);
    const ground = oklchToHex(GROUND_L, chroma, h + shift);
    out.push({
      index: i,
      paper,
      ink,
      accent,
      accentType: pickType(accent, paper, ink),
      ground,
      groundType: pickType(ground, paper, ink),
      groundLum: relativeLuminance(ground),
    });
  }
  return out;
}

export type Presentation = 'as-generated' | 'inverted' | 'tinted';

/** The artwork's palette. Inversion is a swap; nothing is ever filtered. */
export function artworkPalette(c: Colorway, mode: Presentation): Palette {
  if (mode === 'as-generated') return { paper: c.ink, ink: c.paper, accent: c.accent };
  if (mode === 'tinted') return { paper: c.ground, ink: c.groundType, accent: c.groundType };
  return { paper: c.paper, ink: c.ink, accent: c.accent };
}

/** Section 4's guard. Never render dark-on-dark; fall back and let the caller log. */
export function resolvePresentation(c: Colorway, want: Presentation): Presentation {
  return want === 'tinted' && c.groundLum < TINT_LUM_MIN ? 'inverted' : want;
}
