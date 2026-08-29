import { clampParams, defaultParams, type PatternDef, type Params } from '../patterns/registry';
import type { FeatureFrame, FeatureKey } from '../audio/features';

/** One modulation route: `param += depth · intensity · feature · (max − min)`,
 *  clamped back into the param's declared range. */
export interface ModRoute { feature: FeatureKey; param: string; depth: number }

export function applyRoutes(
  def: PatternDef,
  base: Params,
  routes: ModRoute[],
  f: FeatureFrame,
  intensity: number,
): Params {
  const out: Params = { ...base };
  for (const r of routes) {
    const pd = def.params.find((p) => p.key === r.param);
    if (!pd) continue; // presets are validated at build time; stay defensive at runtime
    const cur = out[r.param] ?? pd.default;
    out[r.param] = cur + r.depth * intensity * f[r.feature] * (pd.max - pd.min);
  }
  return clampParams(def, { ...defaultParams(def), ...out });
}
