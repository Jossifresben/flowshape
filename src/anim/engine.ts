import { deriveSeed } from '../core/prng';
import type { PatternDef, Params } from '../patterns/registry';
import type { FeatureFrame } from '../audio/features';
import type { AnimPreset } from './presets';
import { applyRoutes } from './mapping';

/** Beat lookup over a precomputed grid (file mode). Mic mode counts beats
 *  externally via LiveOnsetDetector and passes the index straight in. */
export class BeatClock {
  constructor(private grid: number[]) {}
  /** Index of the last beat at or before t; −1 before the first beat. */
  beatIndex(t: number): number {
    let lo = 0, hi = this.grid.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.grid[mid]! <= t) lo = mid + 1;
      else hi = mid;
    }
    return lo - 1;
  }
  nextBeat(t: number): number | null {
    const i = this.beatIndex(t) + 1;
    return i < this.grid.length ? this.grid[i]! : null;
  }
}

/** Engine time axis in [0,1): one cycle per 16 beats when tempo is known,
 *  a slow 20 s free-run otherwise — motion never fully stops. */
export function phaseAt(tSec: number, bpm: number | null): number {
  const cps = bpm !== null ? bpm / 60 / 16 : 0.05;
  const p = (tSec * cps) % 1;
  return p < 0 ? p + 1 : p;
}

export interface FrameInput {
  def: PatternDef;
  baseParams: Params;
  baseSeed: number;
  preset: AnimPreset;
  intensity: number;
  features: FeatureFrame;
  phase: number;
  beatIndex: number;
}

/** Deterministic per-frame inputs for generateSafe: continuous routes applied
 *  over the base params, plus the event state for the current beat window. */
export function frameParams(inp: FrameInput): { params: Params; seed: number } {
  const { def, preset } = inp;
  let seed = inp.baseSeed;
  const overrides: Params = {};
  const ev = preset.event;
  if (ev && inp.beatIndex >= 0) {
    // Event window index, derived purely from beatIndex so scrubbing
    // re-derives identical frames. reseed keeps the base seed in window 0;
    // flip is at base on even windows; step cycles from window 0.
    const k = Math.floor(inp.beatIndex / ev.everyBeats);
    if (ev.kind === 'reseed') {
      if (k > 0) seed = deriveSeed(inp.baseSeed, `beat-${k}`);
    } else if (ev.kind === 'flip') {
      const pd = def.params.find((p) => p.key === ev.param);
      if (pd) {
        const cur = inp.baseParams[ev.param!] ?? pd.default;
        overrides[ev.param!] = k % 2 === 0 ? cur : cur >= 0.5 ? 0 : 1;
      }
    } else {
      const pd = def.params.find((p) => p.key === ev.param);
      if (pd) {
        const steps = Math.max(2, ev.steps ?? 8);
        // A step traverses `from`..`to` when given, the param's full declared
        // range otherwise. The sub-range exists because a param's extremes are
        // often where the figure degenerates — apollonian at maxDepth 2 is 16
        // circles against 209 at 6, maurer at d = 1 collapses the rose to a
        // thin ring — and a step that visits them empties the stage once per
        // cycle. See the per-preset notes in presets.ts.
        const lo = ev.from ?? pd.min;
        const hi = ev.to ?? pd.max;
        overrides[ev.param!] = lo + ((hi - lo) * (k % steps)) / (steps - 1);
      }
    }
  }
  const params = applyRoutes(def, { ...inp.baseParams, ...overrides }, preset.routes, inp.features, inp.intensity);
  if (def.anim?.usesPhase) params['phase'] = inp.phase;
  return { params, seed };
}
