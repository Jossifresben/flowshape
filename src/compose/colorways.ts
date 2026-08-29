import { resolvePalette } from '../poster/palettes';
import { COLOR_DEFAULTS, type ColorState } from '../core/url-state';
import { oklchToHex } from '../core/oklch';
import { relativeLuminance, pickType } from '../core/contrast';
import type { Palette } from '../core/svg';

/** A poster sheet is print-like whatever ground the user tuned for the artwork. */
const SHEET_PAPER_L = 0.94;

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
  const baseShift = base.accentShift ?? COLOR_DEFAULTS.accentShift;
  const step = 360 / count;
  const out: Colorway[] = [];
  for (let i = 0; i < count; i++) {
    const shift = baseShift + i * step;
    // resolvePalette does not clamp accentShift, so walking past the UI
    // slider's 180 cap is legal and covers the full circle.
    const pal = resolvePalette({ ...base, paperL: SHEET_PAPER_L, accentShift: shift });
    const accent = oklchToHex(MARK_L, chroma, hue + shift);
    const ground = oklchToHex(GROUND_L, chroma, hue + shift);
    out.push({
      index: i,
      paper: pal.paper,
      ink: pal.ink,
      accent,
      accentType: pickType(accent, pal.paper, pal.ink),
      ground,
      groundType: pickType(ground, pal.paper, pal.ink),
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
