import { describe, expect, it } from 'vitest';
import { PRESETS_BY_PATTERN } from '../../src/anim/presets';
import { applyRoutes } from '../../src/anim/mapping';
import { getPattern, defaultParams, generateSafe } from '../../src/patterns/registry';
import { substance } from './coverage';
import { ZERO_FRAME, type FeatureFrame } from '../../src/audio/features';
import '../../src/patterns';

const SIZE = { w: 1080, h: 1080 };

/**
 * Mystery's presets originally rode only band envelopes (bass/mid/high/level).
 * Those describe how loud the music is, not when it hits, so the curve swelled
 * with the music but never landed on a beat — reported as "does not respond
 * well to the beat".
 *
 * `flux` is the transient feature. These tests pin the fix: every mystery
 * preset must be driven by it, and a transient must visibly move the figure.
 */
const MYSTERY = getPattern('mystery')!;

/** A steady passage: bands up, no attack. */
const SUSTAIN: FeatureFrame = { ...ZERO_FRAME, bass: 0.6, mid: 0.5, high: 0.4, level: 0.6, bright: 0.5, flux: 0 };
/** The same passage on a hit. */
const HIT: FeatureFrame = { ...SUSTAIN, flux: 1 };

describe('mystery responds to the beat, not only to loudness', () => {
  it.each(PRESETS_BY_PATTERN['mystery']!.map((p) => [p.id, p] as const))(
    '%s is driven by the transient feature',
    (_id, preset) => {
      expect(preset.routes.some((r) => r.feature === 'flux')).toBe(true);
    },
  );

  it.each(PRESETS_BY_PATTERN['mystery']!.map((p) => [p.id, p] as const))(
    '%s visibly changes the figure between a sustain and a hit',
    (_id, preset) => {
      const base = defaultParams(MYSTERY);
      const sustain = applyRoutes(MYSTERY, base, preset.routes, SUSTAIN, 1);
      const hit = applyRoutes(MYSTERY, base, preset.routes, HIT, 1);

      // The params must actually differ — a route that clamps at both ends
      // would leave the figure identical and the beat invisible.
      const moved = Object.keys(hit).filter((k) => hit[k] !== sustain[k]);
      expect(moved.length, 'no param moved on a transient').toBeGreaterThan(0);

      // And the difference must survive into the drawing. Compared as the
      // serialized tree rather than by `ink`: `size` is applied as a group
      // `transform` (registry.ts), so the ink measure walks the untransformed
      // geometry and cannot see a scale — plainly visible though it is on
      // screen. Breathe's only transient route is `size`, so measuring ink
      // here would report "no beat" for a figure that is visibly pulsing.
      const a = JSON.stringify(generateSafe(MYSTERY, sustain, 1, SIZE));
      const b = JSON.stringify(generateSafe(MYSTERY, hit, 1, SIZE));
      expect(a, 'the drawing is identical on a transient').not.toBe(b);
    },
  );

  it('never empties the frame on a hit', () => {
    const base = defaultParams(MYSTERY);
    const still = substance(generateSafe(MYSTERY, base, 1, SIZE), SIZE.w, SIZE.h);
    for (const preset of PRESETS_BY_PATTERN['mystery']!) {
      const hit = applyRoutes(MYSTERY, base, preset.routes, HIT, 1);
      const s = substance(generateSafe(MYSTERY, hit, 1, SIZE), SIZE.w, SIZE.h);
      expect(s.ink, `${preset.id} emptied the frame`).toBeGreaterThan(still.ink * 0.5);
    }
  });
});
