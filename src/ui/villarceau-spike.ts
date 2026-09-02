/**
 * DEV-only: `#/dev/villarceau` — the unregistered `villarceau` spike on the REAL animate
 * stage, with the DEMO tracks, so it can be judged against music before any
 * decision to promote it.
 *
 * The module is imported HERE and nowhere else. `definePattern` registers on
 * import, so this file is the only thing that puts `villarceau` in the registry —
 * `src/patterns/index.ts` does not know it, which keeps it out of the gallery,
 * the worker manifest and the production bundle. The route is gated on
 * `import.meta.env.DEV`, so this module is never reachable in a build.
 *
 * Presets live here too, for the same reason: `PRESETS_BY_PATTERN` is
 * untouched, and `presetsFor('villarceau')` returns [] in production. They are
 * provisional — routes are on measured-smooth structural axes only, with the
 * chaotic ints (`latitudes`, `fibers`) left for beat events, per the house
 * taxonomy. Swings are stated so promotion can reuse or revise them.
 */
import { villarceau } from '../patterns/villarceau';
import type { AnimPreset } from '../anim/presets';
import { PRESETS_BY_PATTERN } from '../anim/presets';


/** swing = depth × (max − min), in the param's own units. */
const SPIKE_PRESETS: AnimPreset[] = [
  // Roll: the rotation plane itself. `tilt` 0→1 takes the figure from a rigid
  // spin about the torus axis to ribbons rolling through one another; depth
  // 0.30 → swing 0.30, which stays below the ~0.5 flare threshold the spike
  // report flagged, so loud passages open the figure without filling the frame.
  { id: 'roll', label: { en: 'Roll', es: 'Giro' }, routes: [
    { feature: 'bass', param: 'tilt', depth: 0.30 },
    { feature: 'mid', param: 'spread', depth: 0.25 },
    { feature: 'high', param: 'strokeWidth', depth: 0.25 },
  ] },
  // Nest: breathes the colatitude span, so the tori themselves fatten and
  // thin. swing 0.32 on a 1.6 range — visible without collapsing the nesting.
  { id: 'nest', label: { en: 'Nest', es: 'Anida' }, routes: [
    { feature: 'level', param: 'nest', depth: 0.20 },
    { feature: 'bright', param: 'view', depth: 0.18 },
    { feature: 'mid', param: 'pole', depth: 0.15 },
  ] },
];

/** Puts the spike pattern and its provisional presets in the registry.
 *  Called once at startup from `main.ts`, DEV only. Importing this module is
 *  what registers `villarceau` — `definePattern` runs on import — so nothing else
 *  may import it. */
export function registerSpikes(): void {
  PRESETS_BY_PATTERN[villarceau.id] = SPIKE_PRESETS;
}
