import type { PatternDef, Params } from './registry';

/**
 * Purely cosmetic params (line weight, translucency) that don't change the
 * pattern's shape. Randomizing them just makes results noisier without
 * making them more interesting, so Randomize leaves them alone.
 */
const COSMETIC_KEYS = new Set(['strokeWidth', 'opacity', 'size']);

/**
 * Produce a new params object for `def` with every non-cosmetic param set to
 * a random legal value (uniform over the param's [min, max] on its own
 * step), using `rnd` (in [0, 1)) as the source of randomness. Cosmetic
 * params keep whatever value they hold in `current` (or the pattern's
 * default if `current` doesn't have them).
 *
 * The result always has an entry for every param in `def.params`, at a
 * value `clampParams` would leave untouched.
 */
export function randomParams(def: PatternDef, rnd: () => number, current: Params = {}): Params {
  const out: Params = {};
  for (const p of def.params) {
    if (COSMETIC_KEYS.has(p.key)) {
      out[p.key] = current[p.key] ?? p.default;
      continue;
    }
    const steps = Math.max(1, Math.round((p.max - p.min) / p.step));
    let v = p.min + Math.round(rnd() * steps) * p.step;
    v = Math.min(p.max, Math.max(p.min, v));
    // Round to the URL's encoding precision so the picked value survives a
    // round trip through the URL unchanged.
    v = Math.round(v * 10000) / 10000;
    v = Math.min(p.max, Math.max(p.min, v));
    out[p.key] = v;
  }
  return out;
}
