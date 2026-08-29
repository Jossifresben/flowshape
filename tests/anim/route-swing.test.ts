import { describe, it, expect } from 'vitest';
import { PRESETS_BY_PATTERN, type AnimPreset } from '../../src/anim/presets';
import { getPattern } from '../../src/patterns/registry';
import '../../src/patterns';

/**
 * A route's audio swing is `depth * (max - min)` — depth is a fraction of the
 * param's WHOLE range (see mapping.ts). For a param with a wide range that is
 * also *chaotic* — where a small step reconfigures the figure rather than
 * deforming it — the usual 0.2-0.5 depths produce a swing of tens of units and
 * the pattern strobes instead of moving.
 *
 * This shipped: timestable's `multiplier` spans 2..100 and the chord figure
 * changes completely every ~1.0 of M, so depth 0.45 swung it by 44 multipliers
 * per audio envelope. Hermes reported it as "goes crazy, way too fast".
 *
 * Params listed here are the ones whose effect is chaotic rather than smooth.
 * The budget is in the param's own units. A new preset routing one of them at a
 * conventional depth fails here rather than in front of a user.
 */
const MAX_SWING: Record<string, number> = {
  'timestable.multiplier': 1.5,
};

describe('preset route swing', () => {
  it('keeps chaotic params inside their budget', () => {
    const over: string[] = [];
    for (const [patternId, presets] of Object.entries(
      PRESETS_BY_PATTERN as Record<string, AnimPreset[]>,
    )) {
      const def = getPattern(patternId);
      if (!def) continue;
      for (const preset of presets) {
        for (const route of preset.routes ?? []) {
          const budget = MAX_SWING[`${patternId}.${route.param}`];
          if (budget === undefined) continue;
          const pd = def.params.find((p) => p.key === route.param);
          if (!pd) continue;
          const swing = Math.abs(route.depth) * (pd.max - pd.min);
          if (swing > budget) {
            over.push(
              `${patternId}/${preset.id}/${route.param}: swing ${swing.toFixed(2)} > ${budget}`,
            );
          }
        }
      }
    }
    expect(over).toEqual([]);
  });

  it('every budgeted param is actually routed somewhere', () => {
    // Guards the table itself: a renamed param would silently stop being checked.
    const routed = new Set<string>();
    for (const [patternId, presets] of Object.entries(
      PRESETS_BY_PATTERN as Record<string, AnimPreset[]>,
    )) {
      for (const preset of presets) {
        for (const route of preset.routes ?? []) routed.add(`${patternId}.${route.param}`);
      }
    }
    for (const key of Object.keys(MAX_SWING)) expect(routed).toContain(key);
  });
});
