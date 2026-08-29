import type { ModRoute } from './mapping';
import type { FeatureKey } from '../audio/features';

/** Colour is deliberately NOT a ModRoute: `hue`/`chroma` aren't ParamDefs —
 *  they're OKLCH controls resolved by `resolvePalette` (see
 *  src/poster/palettes.ts), so they can't be reached by `applyRoutes`, which
 *  only ever modulates a pattern's own declared param ranges. A `ColourRoute`
 *  is the same *kind* of thing as a `ModRoute` (data: which feature drives
 *  what, and how far) but targets the two colour controls the audio spike
 *  proved out instead of a param key.
 *
 *  hue: interpolated linearly from `from` → `to` (degrees) as the driving
 *  feature goes 0 → 1 — NOT additive like ModRoute.depth, because a hue
 *  sweep across a fixed span reads as "timbre", where an additive offset
 *  would just be an arbitrary rotation with no fixed endpoints.
 *  chroma: scaled from 0 → `max` as the driving feature goes 0 → 1, so
 *  silence (feature 0) always resolves to `max`'s zero — i.e. plain
 *  monochrome ink. That decay-to-monochrome property is what made the
 *  audio-spike mapping (centroid→hue, level→chroma) read as tasteful rather
 *  than gimmicky, and it must survive here: never let chroma have a floor
 *  above 0. */
export interface ColourRoute {
  hue: { feature: FeatureKey; from: number; to: number };
  chroma: { feature: FeatureKey; max: number };
}

/** The standard colour mapping, applied by the stage's COLOUR toggle over
 *  whichever preset is active (see src/ui/animate.ts). This mirrors the
 *  audio-spike finding verbatim: spectral centroid ("bright") sweeps hue
 *  250°(blue)→30°(orange), and level drives chroma up from 0. Individual
 *  presets may set their own `colour` block instead (the field exists for
 *  that), but none do yet — one shared mapping was simpler to reason about
 *  and verify than hand-tuning colour for 50-odd preset entries, and it
 *  already carries the property (silence → monochrome) that mattered. */
export const DEFAULT_COLOUR_ROUTE: ColourRoute = {
  hue: { feature: 'bright', from: 250, to: 30 },
  chroma: { feature: 'level', max: 0.16 },
};

export interface EventSpec {
  kind: 'reseed' | 'flip' | 'step';
  /** flip/step: the target param key. */
  param?: string;
  /** Beats between events (1 = every beat). */
  everyBeats: number;
  /** step: positions the param cycles through across its range. */
  steps?: number;
}

export interface AnimPreset {
  id: string;
  label: { en: string; es: string };
  routes: ModRoute[];
  event?: EventSpec;
  /** Optional per-preset override of the colour mapping applied when the
   *  stage's COLOUR toggle is on (see DEFAULT_COLOUR_ROUTE above). Absent
   *  by default. */
  colour?: ColourRoute;
}

/** Curated audio mappings, tuned by eye against music and voice. Convention:
 *  bass → macro structure, mid → shape character, high → fine detail,
 *  level → scale/presence, bright → timbre (the voice feature). */
export const PRESETS_BY_PATTERN: Record<string, AnimPreset[]> = {
  harmonograph: [
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'bass', param: 'opacity', depth: 0.5 },
      { feature: 'mid', param: 'detune', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'size', depth: 0.18 },
      { feature: 'bass', param: 'damping', depth: -0.3 },
      { feature: 'bright', param: 'detune', depth: 0.3 },
    ] },
  ],
  phyllotaxis: [
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'dotMin', depth: 0.55 },
      { feature: 'high', param: 'dotGrow', depth: 0.4 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'spiral', label: { en: 'Spiral', es: 'Espiral' }, routes: [
      { feature: 'level', param: 'radialExp', depth: 0.2 },
      { feature: 'bright', param: 'dotGrow', depth: 0.5 },
      { feature: 'bass', param: 'size', depth: 0.15 },
    ] },
  ],
  helix: [
    { id: 'spin', label: { en: 'Spin', es: 'Gira' }, routes: [
      { feature: 'bass', param: 'radiusFraction', depth: 0.3 },
      { feature: 'mid', param: 'turns', depth: 0.15 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'coil', label: { en: 'Coil', es: 'Serpentea' }, routes: [
      { feature: 'level', param: 'turns', depth: 0.3 },
      { feature: 'bright', param: 'depthFade', depth: 0.4 },
    ] },
  ],
  timestable: [
    { id: 'sweep', label: { en: 'Sweep', es: 'Barrido' }, routes: [
      // `multiplier` spans 2..100 and the figure reconfigures completely every
      // ~1.0 of M — it is chaotic in this param, not continuous. depth is a
      // fraction of the FULL range, so the usual 0.2-0.5 depths give a 20-44
      // multiplier swing and the chords strobe. Held to well under one
      // multiplier so audio nudges the envelope instead of shredding it.
      { feature: 'mid', param: 'multiplier', depth: 0.006 },
      { feature: 'bass', param: 'opacity', depth: 0.4 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'morph', label: { en: 'Morph', es: 'Muta' }, routes: [
      // See the note in `sweep`: ~1.2 multipliers of travel, not 44.
      { feature: 'bright', param: 'multiplier', depth: 0.012 },
      { feature: 'level', param: 'opacity', depth: 0.5 },
    ] },
  ],
  moire: [
    { id: 'drift', label: { en: 'Drift', es: 'Deriva' }, routes: [
      { feature: 'bass', param: 'angleB', depth: 0.12 },
      { feature: 'mid', param: 'spacingB', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.25 },
    ] },
    { id: 'shimmer', label: { en: 'Shimmer', es: 'Destella' }, routes: [
      { feature: 'bright', param: 'angleB', depth: 0.25 },
      { feature: 'bass', param: 'offset', depth: 0.35 },
    ] },
  ],
  maurer: [
    { id: 'star', label: { en: 'Star', es: 'Estrella' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.5 },
      { feature: 'level', param: 'size', depth: 0.12 },
    ], event: { kind: 'step', param: 'd', everyBeats: 1, steps: 12 } },
    { id: 'web', label: { en: 'Web', es: 'Telaraña' }, routes: [
      { feature: 'mid', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'step', param: 'n', everyBeats: 2, steps: 6 } },
  ],
  chirp: [
    { id: 'wave', label: { en: 'Wave', es: 'Onda' }, routes: [
      { feature: 'bass', param: 'amplitude', depth: 0.65 },
      { feature: 'mid', param: 'freqEnd', depth: 0.2 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'voice', label: { en: 'Voice', es: 'Voz' }, routes: [
      { feature: 'bright', param: 'freqEnd', depth: 0.45 },
      { feature: 'level', param: 'amplitude', depth: 0.5 },
      { feature: 'high', param: 'phaseStep', depth: 0.25 },
    ] },
  ],
  roselattice: [
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'petalDepth', depth: 0.45 },
      { feature: 'mid', param: 'innerFraction', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'level', param: 'petalDepth', depth: 0.55 },
      { feature: 'bright', param: 'innerFraction', depth: 0.4 },
    ] },
  ],
  flowfield: [
    { id: 'current', label: { en: 'Current', es: 'Corriente' }, routes: [
      { feature: 'bass', param: 'curl', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'storm', label: { en: 'Storm', es: 'Tormenta' }, routes: [
      { feature: 'level', param: 'curl', depth: 0.45 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  fabric: [
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'warpAmount', depth: 0.45 },
      { feature: 'high', param: 'dotSize', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'level', param: 'warpAmount', depth: 0.55 },
      { feature: 'bright', param: 'dotSize', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  bands: [
    { id: 'fan', label: { en: 'Fan', es: 'Abanico' }, routes: [
      { feature: 'bass', param: 'sweepAngle', depth: 0.35 },
      { feature: 'mid', param: 'growthExponent', depth: 0.25 },
    ], event: { kind: 'step', param: 'startAngle', everyBeats: 2, steps: 8 } },
    { id: 'swing', label: { en: 'Swing', es: 'Vaivén' }, routes: [
      { feature: 'level', param: 'sweepAngle', depth: 0.45 },
      { feature: 'bright', param: 'gap', depth: 0.35 },
    ] },
  ],
  coulomb: [
    { id: 'field', label: { en: 'Field', es: 'Campo' }, routes: [
      { feature: 'bass', param: 'coreRadius', depth: 0.45 },
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'arc', label: { en: 'Arc', es: 'Arco' }, routes: [
      { feature: 'level', param: 'coreRadius', depth: 0.55 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  hitomezashi: [
    { id: 'stitch', label: { en: 'Stitch', es: 'Puntada' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'parity', label: { en: 'Parity', es: 'Paridad' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.45 },
    ], event: { kind: 'flip', param: 'fillParity', everyBeats: 1 } },
  ],
  truchet: [
    { id: 'tiles', label: { en: 'Tiles', es: 'Teselas' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'maze', label: { en: 'Maze', es: 'Laberinto' }, routes: [
      { feature: 'level', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 1 } },
  ],
  delaunay: [
    { id: 'mesh', label: { en: 'Mesh', es: 'Malla' }, routes: [
      { feature: 'bass', param: 'vertexSize', depth: 0.5 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'scatter', label: { en: 'Scatter', es: 'Dispersa' }, routes: [
      { feature: 'level', param: 'vertexSize', depth: 0.55 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
  ],
  voronoi: [
    { id: 'cells', label: { en: 'Cells', es: 'Células' }, routes: [
      { feature: 'bass', param: 'inset', depth: -0.25 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'inset', depth: -0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  stipple: [
    { id: 'grain', label: { en: 'Grain', es: 'Grano' }, routes: [
      { feature: 'bass', param: 'dotSize', depth: 0.5 },
      { feature: 'mid', param: 'contrast', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'dust', label: { en: 'Dust', es: 'Polvo' }, routes: [
      { feature: 'level', param: 'dotSize', depth: 0.55 },
      { feature: 'bright', param: 'contrast', depth: 0.45 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  girih: [
    { id: 'lattice', label: { en: 'Lattice', es: 'Celosía' }, routes: [
      { feature: 'bass', param: 'ribbonWidth', depth: 0.4 },
      { feature: 'mid', param: 'contactAngle', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'knot', label: { en: 'Knot', es: 'Nudo' }, routes: [
      { feature: 'level', param: 'contactAngle', depth: 0.3 },
      { feature: 'bright', param: 'ribbonWidth', depth: 0.4 },
    ] },
  ],
  apollonian: [
    { id: 'gasket', label: { en: 'Gasket', es: 'Empaque' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.5 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'maxDepth', everyBeats: 2, steps: 7 } },
    { id: 'depth', label: { en: 'Depth', es: 'Fondo' }, routes: [
      { feature: 'level', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'step', param: 'minRadius', everyBeats: 1, steps: 6 } },
  ],
  voxel: [
    { id: 'blocks', label: { en: 'Blocks', es: 'Bloques' }, routes: [
      { feature: 'bass', param: 'gap', depth: 0.4 },
      { feature: 'mid', param: 'depthShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'shatter', label: { en: 'Shatter', es: 'Estalla' }, routes: [
      { feature: 'level', param: 'gap', depth: 0.55 },
      { feature: 'flux', param: 'faceShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 1 } },
  ],
  tumbling: [
    // usesSeed: true — the flip decision mixes a white-noise draw with a
    // seed-derived fbm field, so `reseed` visibly reshuffles which faces
    // read as raised vs sunken even at coherence 1. `bass` drives `coherence`
    // itself (loud passages pull the flips into continent-sized regions;
    // quiet ones fizz salt-and-pepper). `voidChance` defaults to 0 — a
    // positive route opens cracks in the tumbling-blocks illusion on the
    // beat, which is exactly the "Shatter" effect this preset name promises.
    { id: 'tumble', label: { en: 'Tumble', es: 'Voltea' }, routes: [
      { feature: 'bass', param: 'coherence', depth: 0.3 },
      { feature: 'high', param: 'flipChance', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'shatter', label: { en: 'Shatter', es: 'Estalla' }, routes: [
      { feature: 'bass', param: 'voidChance', depth: 0.4 },
      { feature: 'flux', param: 'faceShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 1 } },
  ],
  nested: [
    // usesSeed: false — the rhombille nest is strictly periodic, so the only
    // legal event is a discrete step/flip on a structural param.
    // `depth` (the nesting count) steps on the beat for a shaft that visibly
    // deepens; `twist` is a bool that alternates each ring's tone direction,
    // so flipping it is the cube-pops-in/pops-out reversal itself.
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'bass', param: 'faceShading', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'depth', everyBeats: 2, steps: 5 } },
    { id: 'twist', label: { en: 'Twist', es: 'Retuerce' }, routes: [
      { feature: 'level', param: 'faceShading', depth: 0.4 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.25 },
    ], event: { kind: 'flip', param: 'twist', everyBeats: 1 } },
  ],
  interlace: [
    // usesSeed: false — the Celtic weave is a pure function of its params.
    // `junctions` is the bool that turns the tri-radiate crossings on/off, so
    // flipping it on the beat makes the weave visibly knot and release.
    // `cell` (the only int param) steps for a coarser re-tiling pulse.
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.35 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'flip', param: 'junctions', everyBeats: 2 } },
    { id: 'lattice', label: { en: 'Lattice', es: 'Celosía' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'cell', everyBeats: 4, steps: 5 } },
  ],
  isoweave: [
    // usesSeed: false — strictly periodic. `stagger` is the structural int
    // that switches the interlock from flat (1-2) to a genuine over/under
    // weave (3-4), so stepping it on the beat is the pattern's own subject.
    // `unit` (enum: tripod/elbow/chevron) steps for a motif change instead.
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'stagger', everyBeats: 2, steps: 4 } },
    { id: 'shift', label: { en: 'Shift', es: 'Cambia' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'unit', everyBeats: 4, steps: 3 } },
  ],
  diffgrowth: [
    { id: 'coral', label: { en: 'Coral', es: 'Coral' }, routes: [], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'grow', label: { en: 'Grow', es: 'Crece' }, routes: [], event: { kind: 'reseed', everyBeats: 4 } },
  ],
};

export function presetsFor(patternId: string): AnimPreset[] {
  return PRESETS_BY_PATTERN[patternId] ?? [];
}
