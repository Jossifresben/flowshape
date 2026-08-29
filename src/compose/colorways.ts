import { resolvePalette } from '../poster/palettes';
import { COLOR_DEFAULTS, type ColorState } from '../core/url-state';
import { oklchToHex } from '../core/oklch';
import { relativeLuminance, pickType } from '../core/contrast';
import type { Palette } from '../core/svg';

/** A poster sheet is print-like whatever ground the user tuned for the artwork. */
const SHEET_PAPER_L = 0.94;

/**
 * The accent gets sampled twice, at the same hue, because it does two jobs.
 *
 * `resolvePalette` derives accent relative to *ink* — right for artwork
 * legibility, and measured across the hue circle at sheet lightness it lands at
 * relative luminance 0.033-0.040 everywhere. That is ~10:1 on paper (an
 * excellent mark) and hopeless as a field. Driving the accent-ground layout or
 * the tinted presentation from it would leave both modes dead.
 *
 * So `ground` is a second sample at fixed L and C with hue as the only free
 * variable — exactly the generative scheme the handover describes. L = 0.78
 * clears the 0.45 tint guard for 9 of 12 hues, and the three that fail are the
 * reds, magentas and violets: the handover's own hand-picked pass list
 * (amber, vermilion, teal pass; red, magenta, violet, ultramarine, pine fail),
 * reproduced from the colour model rather than transcribed. Lower samples fail
 * for every hue (L = 0.70 -> 0 of 12), which is what rules out one sample.
 */
export const GROUND_L = 0.78;
const GROUND_C = 0.16;

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

export function colorwaysFor(base: ColorState, count = COLORWAY_COUNT): Colorway[] {
  const hue = base.hue ?? COLOR_DEFAULTS.hue;
  const baseShift = base.accentShift ?? COLOR_DEFAULTS.accentShift;
  const step = 360 / count;
  const out: Colorway[] = [];
  for (let i = 0; i < count; i++) {
    const shift = baseShift + i * step;
    // resolvePalette does not clamp accentShift, so walking past the UI
    // slider's 180 cap is legal and covers the full circle.
    const pal = resolvePalette({ ...base, paperL: SHEET_PAPER_L, accentShift: shift });
    const ground = oklchToHex(GROUND_L, GROUND_C, hue + shift);
    out.push({
      index: i,
      paper: pal.paper,
      ink: pal.ink,
      accent: pal.accent,
      accentType: pickType(pal.accent, pal.paper, pal.ink),
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
