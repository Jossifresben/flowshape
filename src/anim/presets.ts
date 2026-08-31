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
  /** step: traverse this sub-range instead of the param's full declared
   *  range. Both default to the param's own min/max. */
  from?: number;
  to?: number;
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
    // `duration` is how much of the decaying trace is drawn (100..600 samples,
    // swing 75): the curve visibly winds further into its own centre on the
    // loud passages instead of only changing weight.
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'size', depth: 0.18 },
      { feature: 'bass', param: 'damping', depth: -0.3 },
      { feature: 'bright', param: 'detune', depth: 0.3 },
      { feature: 'high', param: 'duration', depth: 0.15 },
    ] },
  ],
  phyllotaxis: [
    // `dotMin` was depth 0.55 — a 3.2 px swing on a 0.6 px default, so the
    // florets grew six-fold and merged into a disc at the centre. 0.30 is
    // 1.76 px, a bloom rather than a blot. `radialExp` is the spiral's own
    // structural axis (how fast r grows with n) and was reachable only from
    // `spiral`; it is the strongest smooth axis this pattern has.
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'dotMin', depth: 0.3 },
      { feature: 'mid', param: 'radialExp', depth: 0.15 },
      { feature: 'high', param: 'dotGrow', depth: 0.4 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'spiral', label: { en: 'Spiral', es: 'Espiral' }, routes: [
      { feature: 'level', param: 'radialExp', depth: 0.25 },
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
    // A moire figure is an interference pattern: what is on screen is the
    // beat between the two gratings, and its period goes as
    // spacing / (angleB - angleA). Both routes therefore work the angles,
    // which is also the only high-gain axis here that adds and removes no
    // lines at all — the grating keeps exactly its 475 strokes at every
    // angle, so there is nothing to flicker at the frame edge. Driving the
    // spacings instead does flicker: dropping spacingA by 1.6 px adds 54
    // lines at the edges and 144 of them wink on and off across one swell.
    //
    // The gains are steep and deliberately small. The default angles differ
    // by 6 deg, so `drift`'s 9 deg of travel already takes the fringe period
    // from about 86 px to 31 px. The old depth of 0.12 swung 21.6 deg, far
    // past the small-angle regime where a moire exists at all: the two
    // gratings simply crossed.
    { id: 'drift', label: { en: 'Drift', es: 'Deriva' }, routes: [
      { feature: 'bass', param: 'angleB', depth: 0.05 },
      { feature: 'mid', param: 'spacingB', depth: 0.02 },
      { feature: 'high', param: 'strokeWidth', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    // `offset` only exists in mode 1 (circles); at the default mode it is
    // read by nothing, so the route this preset used to spend on it moved no
    // pixel at all. Counter-rotating the two gratings is the honest version
    // of the same idea: it drives the beat frequency directly, from both
    // ends, and the fringes sweep across the frame as they tighten.
    { id: 'shimmer', label: { en: 'Shimmer', es: 'Destella' }, routes: [
      { feature: 'bright', param: 'angleB', depth: 0.07 },
      { feature: 'bass', param: 'angleA', depth: 0.03 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
  ],
  maurer: [
    // maurer has no smooth structural axis at all: `n` and `d` both
    // reconfigure the rose completely from one integer to the next — the
    // figure IS (n, d). Earlier presets stepped one of them on the beat,
    // which replaced the visitor's rose with a catalogue of other roses for
    // most of every cycle; a viewer who had designed a specific figure saw
    // it vanish on the first beat. Structure is therefore never touched.
    // Motion comes from the phase precession every maurer render already
    // carries (the whole figure turns once per phase cycle), the routes
    // breathe stroke and size with the music, and Star's beat event flips
    // the envelope — decoration around the walk, never the walk itself.
    { id: 'star', label: { en: 'Star', es: 'Estrella' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.12 },
    ], event: { kind: 'flip', param: 'envelope', everyBeats: 4 } },
    { id: 'web', label: { en: 'Web', es: 'Telaraña' }, routes: [
      { feature: 'mid', param: 'strokeWidth', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.1 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
  ],
  chirp: [
    // `amplitude` at depth 0.65 swung 37.7 px on a 16 px default, so at 46
    // lines over the frame the waves overlapped into a single band. 0.35 is
    // 20 px — the sweep still doubles, and the lines stay legible.
    { id: 'wave', label: { en: 'Wave', es: 'Onda' }, routes: [
      { feature: 'bass', param: 'amplitude', depth: 0.35 },
      { feature: 'mid', param: 'freqEnd', depth: 0.2 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    { id: 'voice', label: { en: 'Voice', es: 'Voz' }, routes: [
      { feature: 'bright', param: 'freqEnd', depth: 0.3 },
      { feature: 'level', param: 'amplitude', depth: 0.3 },
      { feature: 'high', param: 'phaseStep', depth: 0.25 },
    ] },
  ],
  roselattice: [
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'petalDepth', depth: 0.45 },
      { feature: 'mid', param: 'innerFraction', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    // petalDepth was depth 0.55, a 49.5 swing on a 0..90 range from a default
    // of 46 — the top half of the envelope was spent against the clamp.
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'level', param: 'petalDepth', depth: 0.4 },
      { feature: 'bright', param: 'innerFraction', depth: 0.3 },
      { feature: 'bass', param: 'size', depth: 0.1 },
    ] },
  ],
  flowfield: [
    { id: 'current', label: { en: 'Current', es: 'Corriente' }, routes: [
      { feature: 'bass', param: 'curl', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    // A reseed replaces every one of ~7700 streamlines at once; at everyBeats
    // 4 that landed twice a bar. `steps` shortens the integration instead —
    // the lines retract and re-extend continuously, which is the same
    // agitation without the cut.
    { id: 'storm', label: { en: 'Storm', es: 'Tormenta' }, routes: [
      { feature: 'level', param: 'curl', depth: 0.45 },
      { feature: 'bass', param: 'steps', depth: -0.2 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  fabric: [
    // `noiseScale` is the spatial frequency of the warp field — the axis that
    // decides whether the weave reads as long swells or tight ripples.
    //
    // These two were the same animation: both pushed warpAmount, noiseScale
    // and dotSize up together on one 8-beat reseed, differing only in which
    // feature drove which (0.065 of a range apart under a shared envelope).
    // They are split along what the cloth is actually doing, which for a
    // warped lattice is two separable things: where the threads are, and how
    // heavy they are. Neither preset now touches the other's axis.
    //
    // `strokeWidth` is not available to either. It is read only in mode 1
    // (mesh); the default is mode 0 (dots), where it moves nothing.
    //
    // Weave: the grain leads. Threads thicken, and the field smooths as the
    // bass lands — a lower noiseScale is a longer swell, i.e. the weave pulls
    // itself regular. The lattice positions hold still, so this reads as a
    // texture change on fixed cloth. dotSize is the pattern's whole ink
    // budget (2116 dots, area going as r^2: total ink runs 1.7k to 40k across
    // its range) which is why it is kept positive — routed DOWN by a
    // conventional depth it takes the frame to 30% of the still render, and
    // that is a fade-out, not a modulation.
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'high', param: 'dotSize', depth: 0.4 },
      { feature: 'bass', param: 'noiseScale', depth: -0.15 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    // Ripple: the displacement leads, and nothing else moves. warpAmount is
    // the largest visible axis fabric has — 34 px of warp at rest, 78 at the
    // top of this route, which slides every one of the 2116 dots off the
    // lattice and back. `size` breathes the frame under it. Ink is constant
    // through the whole preset: what moves is where the cloth is, not how
    // much of it there is.
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'level', param: 'warpAmount', depth: 0.55 },
      { feature: 'bright', param: 'size', depth: 0.08 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  bands: [
    // sweepAngle is routed NEGATIVE on purpose. The wedge is drawn as a
    // single elliptical arc from a0 to a0 + sweep, so at sweep = 360 exactly
    // the two endpoints coincide and SVG collapses the arc: measured ink
    // falls from 16.4k to 0.8k, i.e. the figure vanishes. `applyRoutes`
    // clamps to the param's max, so any positive route on sweepAngle can be
    // driven onto that value by a loud passage whenever the user's base angle
    // is high enough. Closing the fan on the beat is both safe and the better
    // gesture. The old event stepped `startAngle`, which merely snapped the
    // fan to a new bearing — redundant, because bands already turns
    // continuously with phase. Stepping `bandCount` re-divides it instead.
    { id: 'fan', label: { en: 'Fan', es: 'Abanico' }, routes: [
      { feature: 'bass', param: 'sweepAngle', depth: -0.2 },
      { feature: 'mid', param: 'growthExponent', depth: 0.25 },
      { feature: 'level', param: 'minThickness', depth: 0.2 },
    ], event: { kind: 'step', param: 'bandCount', everyBeats: 8, steps: 4, from: 5, to: 12 } },
    { id: 'swing', label: { en: 'Swing', es: 'Vaivén' }, routes: [
      { feature: 'level', param: 'sweepAngle', depth: -0.25 },
      { feature: 'bright', param: 'maxThickness', depth: 0.2 },
      { feature: 'bass', param: 'gap', depth: 0.2 },
    ] },
  ],
  coulomb: [
    // Rebuilt. Both presets used to spend their whole audio budget on
    // `coreRadius` and `strokeWidth`: sweeping coreRadius across its ENTIRE
    // 4..40 range changes only 10% of the streamlines and moves 5% of the
    // ink, so the field looked disconnected from the music no matter how
    // large the depth. The two params that genuinely reshape the field,
    // `charges` and `spacing`, cannot be routed: a single unit of either
    // reshuffles the seeding grid so that EVERY streamline is a different
    // object (measured churn 1.00 at +1), which per frame is a boil, not a
    // response. They belong to beat-locked events, where the same jump reads
    // as a section change.
    //
    // What is left has to be earned from the two smooth axes, and both were
    // measured against a swell rather than guessed. `coreRadius` softens the
    // near field and sets where a streamline gives up, so it opens real voids
    // around the charges; it carries most of the new response. `steps` bounds
    // the integration, so lines retract and re-extend — it was declared
    // continuous here from the start and never routed — but its truncation
    // cascades through the shared occupancy grid, and past about a 40-step
    // swing that cascade turns into a fizz: at depth -0.45, 551 streamlines
    // flicker on and off more than four times across one swell, against 36
    // for the shipped preset. Depths were chosen from that surface: `field`
    // (0.5 / -0.1) gets 1.75x the response of the shipped preset at the same
    // worst-case flicker, `arc` (0.7 / -0.05) 2.4x for slightly more.
    { id: 'field', label: { en: 'Field', es: 'Campo' }, routes: [
      { feature: 'level', param: 'coreRadius', depth: 0.5 },
      { feature: 'bass', param: 'steps', depth: -0.1 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'step', param: 'charges', everyBeats: 8, steps: 5, from: 3, to: 7 } },
    { id: 'arc', label: { en: 'Arc', es: 'Arco' }, routes: [
      { feature: 'bass', param: 'coreRadius', depth: 0.6 },
      { feature: 'level', param: 'steps', depth: -0.1 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  hitomezashi: [
    // hitomezashi now carries intrinsic motion (see src/patterns/hitomezashi.ts):
    // the stitch field scrolls diagonally with phase, so neither preset has to
    // manufacture life out of an event any more.
    //
    // Nothing structural here can be routed. `bitChance` looks like the
    // obvious candidate and is the worst possible one: the bits are drawn
    // against a fixed PRNG stream, so a swing of a few hundredths crosses a
    // threshold and flips a column bit — and because the parity fill is a
    // prefix-xor along each axis, one flipped bit inverts the shading of the
    // whole field to its right. Measured churn for a 0.01 step: 0.56. `cell`
    // re-tiles outright (churn 1.00 at +1).
    //
    // The events were the "beat is strange": `parity` flipped `fillParity`
    // EVERY BEAT, and fillParity 0 does not invert the checkerboard, it
    // deletes the entire accent layer (7219 rects down to none), so the
    // stage flashed on and off at beat rate. `stitch` redrew every bit every
    // two beats. Both now land on 8, where they read as section changes
    // against the continuous scroll.
    // With no structural param to reach, the two routes it can honestly carry
    // are pushed to where they read: the thread weight roughly doubles and
    // the lattice scales by a fifth, which on an edge-to-edge tiling is a
    // visible zoom (positive only — shrinking would expose paper).
    { id: 'stitch', label: { en: 'Stitch', es: 'Puntada' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.15 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'parity', label: { en: 'Parity', es: 'Paridad' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.35 },
      { feature: 'level', param: 'size', depth: 0.18 },
    ], event: { kind: 'flip', param: 'fillParity', everyBeats: 8 } },
  ],
  truchet: [
    // A Truchet tiling has no smooth geometric axis — every tile is one of
    // two discrete orientations — so what audio can honestly reach is which
    // tiles are emphasised: `boldChance` doubles a tile's weight and
    // `accentChance` recolours it. Both are continuous in the fraction of the
    // field they claim, so they thicken and speckle with the music while the
    // geometry holds still. The reseeds were at 2 and 1 beats, i.e. the whole
    // 2304-tile field re-rolled on the beat.
    { id: 'tiles', label: { en: 'Tiles', es: 'Teselas' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.25 },
      { feature: 'mid', param: 'boldChance', depth: 0.35 },
      { feature: 'high', param: 'accentChance', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.06 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'maze', label: { en: 'Maze', es: 'Laberinto' }, routes: [
      { feature: 'level', param: 'strokeWidth', depth: 0.2 },
      { feature: 'bass', param: 'boldChance', depth: 0.5 },
      { feature: 'flux', param: 'accentChance', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  delaunay: [
    // `points` is the mesh's own density and is smooth here: the
    // triangulation re-forms locally around each added site rather than
    // jumping (churn 0.024 for +9 points, 0.18 for +92).
    //
    // These two used to be the same animation. Both routed points, vertexSize
    // and strokeWidth upward, at depths within 0.05 of each other, on the same
    // 8-beat reseed; only the feature assignment was permuted, and it swapped
    // `level` for `bass` — two features that ride the same envelope on most
    // music. Under a shared-envelope trajectory their param vectors never
    // parted by more than 3.7% of a range, and Hermes reported them as
    // indistinguishable. The permutation was the whole difference.
    //
    // What separates them now is the balance between the two things drawn: the
    // edges and the sites. Measured at the defaults, the edges carry 119.3k of
    // the 121.1k total ink and the 220 dots carry 1.8k — so strokeWidth is the
    // param that moves this figure (ink x3.2 across its range) and vertexSize
    // is a texture on top of it (+8% at its maximum). One preset leads with
    // each, in opposite directions, so the pair reads as two animations.
    //
    // Mesh: the lattice leads. Lines thicken with the highs, the sites recede
    // to specks so the edges read clean.
    { id: 'mesh', label: { en: 'Mesh', es: 'Malla' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
      { feature: 'level', param: 'points', depth: 0.12 },
      { feature: 'bass', param: 'vertexSize', depth: -0.3 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    // Scatter: the sites lead. Dots swell, the field breathes through `size`,
    // and strokeWidth is deliberately left OUT — a fixed hairline substrate
    // under a moving point cloud. It cannot be routed down to compensate:
    // strokeWidth 0.4 -> its 0.1 floor takes total ink to 26% of the still
    // render, which is a collapse, not a modulation. Reseeds twice as often
    // as mesh, which is the scatter being re-thrown.
    { id: 'scatter', label: { en: 'Scatter', es: 'Dispersa' }, routes: [
      { feature: 'bass', param: 'vertexSize', depth: 0.55 },
      { feature: 'flux', param: 'points', depth: 0.15 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  voronoi: [
    // `inset` is genuinely structural — every cell shrinks toward its own
    // site, so the tessellation breathes. `sites` is not routable: adding one
    // site re-forms all of its neighbours (churn 0.05 per site), so any
    // useful swing rebuilds a third of the diagram per frame.
    //
    // That leaves inset, strokeWidth and size as the entire routable
    // vocabulary, and both presets used to spend it the same way: inset down,
    // strokeWidth up, one 8-beat reseed, 0.077 of a range between them. Each
    // now leads with a different one and leaves the other alone.
    //
    // inset also has a floor. The cells' outlines ARE the figure, so shrinking
    // them shortens every perimeter: 0.86 (rest) carries 123k of ink, 0.69
    // carries 83k, and 0.60 carries 65k — half the still render, i.e. the
    // tessellation eaten by its own gaps. -0.35 from the default is the most
    // either preset can honestly ask for.
    //
    // Cells: the line weight leads. Ink roughly x1.4 across the route on a
    // tessellation that stays put, with a small inset drift under it.
    { id: 'cells', label: { en: 'Cells', es: 'Células' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.4 },
      { feature: 'bass', param: 'inset', depth: -0.2 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    // Breathe: the gaps lead, at a constant line weight. Every cell contracts
    // toward its own site and the whole field scales with it, which is the
    // one thing in this pattern that reads as respiration rather than as a
    // pulse.
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'inset', depth: -0.35 },
      { feature: 'bright', param: 'size', depth: 0.1 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  stipple: [
    { id: 'grain', label: { en: 'Grain', es: 'Grano' }, routes: [
      { feature: 'bass', param: 'dotSize', depth: 0.5 },
      { feature: 'mid', param: 'contrast', depth: 0.4 },
      { feature: 'high', param: 'noiseScale', depth: 0.12 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    // `maxGap` is the sparse-region spacing, i.e. how open the field gets
    // where the density function is low; negative, so loud passages close it.
    { id: 'dust', label: { en: 'Dust', es: 'Polvo' }, routes: [
      { feature: 'level', param: 'dotSize', depth: 0.55 },
      { feature: 'bright', param: 'contrast', depth: 0.45 },
      { feature: 'bass', param: 'maxGap', depth: -0.15 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  girih: [
    // Both presets spent their largest depth on `ribbonWidth`, which the
    // pattern reads ONLY when `render` is 1 (ribbons). At the default render
    // it is dead: renders at ribbonWidth 2, 9 and 20 are byte-identical.
    // `contactAngle` is Hankin's angle and the pattern's whole subject — it
    // re-derives every strap continuously — so both routes now go there.
    { id: 'lattice', label: { en: 'Lattice', es: 'Celosía' }, routes: [
      { feature: 'bass', param: 'contactAngle', depth: 0.25 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    // `hexSize` re-tiles outright, so it can only be an event. The sub-range
    // starts at the default so a beat never makes the lattice denser (and
    // more expensive) than the still render.
    { id: 'knot', label: { en: 'Knot', es: 'Nudo' }, routes: [
      { feature: 'level', param: 'contactAngle', depth: 0.3 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.35 },
      { feature: 'bass', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'hexSize', everyBeats: 8, steps: 3, from: 30, to: 46 } },
  ],
  apollonian: [
    // `minRadius` is the gasket's detail floor in screen pixels and the one
    // structural axis audio can honestly reach: the Möbius flow that moves
    // the packing is phase-driven and engine-owned, and `maxDepth` is an int
    // whose every step multiplies the figure. Lowering the floor grows new
    // circles inside the curvilinear gaps that are already there, so it
    // blooms rather than reconfigures — smooth, not chaotic.
    //
    // Its range is 1..30, though, and depth is a fraction of the WHOLE range
    // (see mapping.ts), so the conventional 0.2-0.5 depths would swing it by
    // 6-15 px and strip the figure from 189 circles to about 30 at
    // 1920x1080. Both routes below are held to a swing under 2 px:
    // -0.055 x 29 = 1.60 px (3.0 -> 1.40, ~189 -> ~410 circles) and
    // -0.065 x 29 = 1.89 px (3.0 -> 1.12). Negative, so the texture thickens
    // into the loud passages. Budgeted in tests/anim/route-swing.test.ts.
    //
    // The `maxDepth` step had the same fault the continuous route was fixed
    // for: stepping the full 2..8 put maxDepth 2 on the stage every seventh
    // window, and at depth 2 the gasket is 16 circles against 209 at the
    // default. It now steps 5..8, where the population only ever thickens,
    // on a four-beat cadence.
    { id: 'gasket', label: { en: 'Gasket', es: 'Empaque' }, routes: [
      { feature: 'bass', param: 'minRadius', depth: -0.055 },
      { feature: 'high', param: 'strokeWidth', depth: 0.5 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'maxDepth', everyBeats: 4, steps: 4, from: 5, to: 8 } },
    // This preset used to *step* minRadius across its full range every beat:
    // six positions from 1 to 30, which is 512 circles down to 22 and back
    // once a beat — the same class of strobe as timestable's multiplier, and
    // the figure all but vanished at the top of the cycle. Replaced by the
    // continuous route above plus a tonal flip, which is what "Depth" was
    // reaching for anyway: the detail floor breathes with the music while
    // the even-depth rings shade in and out on a four-beat cadence.
    { id: 'depth', label: { en: 'Depth', es: 'Fondo' }, routes: [
      { feature: 'level', param: 'minRadius', depth: -0.065 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'flip', param: 'fillAlternate', everyBeats: 4 } },
  ],
  voxel: [
    // `scatter` is the cull probability per cell: it dissolves and re-forms
    // the solid continuously (churn 0.008 for +0.012, 0.098 across the
    // range), which is the strongest smooth axis voxel has and was declared
    // continuous but never routed. A reseed replaces every cube's draw at
    // once, so `blocks` moves off the two-beat cadence and `shatter` off the
    // one-beat one.
    { id: 'blocks', label: { en: 'Blocks', es: 'Bloques' }, routes: [
      { feature: 'bass', param: 'gap', depth: 0.4 },
      { feature: 'mid', param: 'depthShading', depth: 0.3 },
      { feature: 'level', param: 'scatter', depth: 0.2 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'shatter', label: { en: 'Shatter', es: 'Estalla' }, routes: [
      { feature: 'level', param: 'gap', depth: 0.55 },
      { feature: 'bass', param: 'scatter', depth: 0.3 },
      { feature: 'flux', param: 'faceShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
  ],
  tumbling: [
    // usesSeed: true — the flip decision mixes a white-noise draw with a
    // seed-derived fbm field, so `reseed` visibly reshuffles which faces
    // read as raised vs sunken even at coherence 1. It is a smaller event
    // than most reseeds (measured 27% of rhombi change tone, and no rhombus
    // moves), which is why `shatter` can still sit at two beats. `bass`
    // drives `coherence` itself (loud passages pull the flips into
    // continent-sized regions; quiet ones fizz salt-and-pepper).
    // `voidChance` defaults to 0 — a positive route opens cracks in the
    // tumbling-blocks illusion on the beat, which is exactly the "Shatter"
    // effect this preset name promises.
    { id: 'tumble', label: { en: 'Tumble', es: 'Voltea' }, routes: [
      { feature: 'bass', param: 'coherence', depth: 0.3 },
      { feature: 'high', param: 'flipChance', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'shatter', label: { en: 'Shatter', es: 'Estalla' }, routes: [
      { feature: 'bass', param: 'voidChance', depth: 0.4 },
      { feature: 'flux', param: 'faceShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
  ],
  nested: [
    // usesSeed: false — the rhombille nest is strictly periodic, so the only
    // legal event is a discrete step/flip on a structural param.
    // `depth` (the nesting count) steps for a shaft that visibly deepens,
    // from 2 rather than 1 so a window never reduces the nest to a single
    // ring; `twist` is a bool that alternates each ring's tone direction, so
    // flipping it is the cube-pops-in/pops-out reversal itself — a tone
    // change only, which is why it can stay near beat rate.
    // `stepRatio` is the ring-to-ring inset, the one continuous shape axis
    // here; it was declared continuous and left unrouted, so both presets
    // were modulating tone and weight alone.
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'bass', param: 'faceShading', depth: 0.35 },
      { feature: 'mid', param: 'stepRatio', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'depth', everyBeats: 2, steps: 4, from: 2, to: 5 } },
    { id: 'twist', label: { en: 'Twist', es: 'Retuerce' }, routes: [
      { feature: 'level', param: 'faceShading', depth: 0.4 },
      { feature: 'bass', param: 'stepRatio', depth: 0.2 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.25 },
    ], event: { kind: 'flip', param: 'twist', everyBeats: 2 } },
  ],
  interlace: [
    // usesSeed: false — the Celtic weave is a pure function of its params.
    // `junctions` is the bool that turns the tri-radiate crossings on/off, so
    // flipping it on the beat makes the weave visibly knot and release; it
    // moves little ink, so two beats is right for it. `ribbonWidth` and
    // `ringScale` are the strap thickness and the ring radius — the two
    // continuous shape axes, neither of which was routed or even declared.
    // The `cell` step traversed the whole 16..70: at 16 the weave is nearly
    // twice the element count of the still render, at 70 it is four tiles
    // across. It now steps 30..54.
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.25 },
      { feature: 'mid', param: 'ribbonWidth', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'flip', param: 'junctions', everyBeats: 2 } },
    { id: 'lattice', label: { en: 'Lattice', es: 'Celosía' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'bass', param: 'ringScale', depth: 0.2 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'cell', everyBeats: 4, steps: 4, from: 30, to: 54 } },
  ],
  isoweave: [
    // usesSeed: false — strictly periodic. `stagger` is the structural int
    // that switches the interlock from flat (1-2) to a genuine over/under
    // weave (3-4), so stepping it on the beat is the pattern's own subject.
    // `unit` (enum: tripod/elbow/chevron) steps for a motif change instead.
    // `armLength` is the one continuous axis: it lengthens every arm of the
    // motif, so the weave opens and closes rather than only changing weight.
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.3 },
      { feature: 'mid', param: 'armLength', depth: 0.2 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'stagger', everyBeats: 2, steps: 4 } },
    { id: 'shift', label: { en: 'Shift', es: 'Cambia' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'bass', param: 'armLength', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'unit', everyBeats: 4, steps: 3 } },
  ],
  diffgrowth: [
    // heavy: the whole simulation reruns per frame, so it carries no routes
    // and the event is its only channel. Rebuilding a 500-iteration growth
    // every two beats is both a total redraw and the most expensive thing on
    // the stage; 4 and 8 give it time to be looked at.
    { id: 'coral', label: { en: 'Coral', es: 'Coral' }, routes: [], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'grow', label: { en: 'Grow', es: 'Crece' }, routes: [], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  billiard: [
    // `launch` reconfigures the chord web smoothly but fast — a few degrees
    // of travel already reads as the web flowing along the caustic, so the
    // depth is held to ~3° of the 172° range.
    { id: 'orbit', label: { en: 'Orbit', es: 'Orbita' }, routes: [
      { feature: 'mid', param: 'launch', depth: 0.02 },
      { feature: 'bass', param: 'opacity', depth: 0.4 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'caustic', label: { en: 'Caustic', es: 'Cáustica' }, routes: [
      { feature: 'bright', param: 'ecc', depth: 0.04 },
      { feature: 'level', param: 'opacity', depth: 0.5 },
    ] },
  ],
  loxodrome: [
    { id: 'vortex', label: { en: 'Vortex', es: 'Vórtice' }, routes: [
      { feature: 'bass', param: 'twist', depth: 0.05 },
      { feature: 'mid', param: 'shrink', depth: 0.03 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'level', param: 'spread', depth: 0.15 },
      { feature: 'bright', param: 'seedRadius', depth: 0.2 },
    ] },
  ],
  mystery: [
    // `bloom` is the amplitude-swell axis the intrinsic motion already
    // rides, so driving it with bass makes the music push the same
    // blossoming the phase flow produces — the two motions compose
    // instead of fighting.
    { id: 'flourish', label: { en: 'Flourish', es: 'Floritura' }, routes: [
      { feature: 'bass', param: 'bloom', depth: 0.35 },
      { feature: 'bright', param: 'falloff', depth: 0.12 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'bloom', depth: 0.4 },
      { feature: 'mid', param: 'opacity', depth: 0.4 },
    ] },
  ],
  curlicue: [
    // `alpha` is the whole figure — even a 0.0005 nudge reconfigures every
    // curl, the same class of chaos as timestable's multiplier — so audio
    // never touches it. `swell` is the amplitude of the travelling wave the
    // intrinsic motion already rides, so bass deepens the same surge the
    // phase flow produces; `curls` grows and shrinks the walk's tail.
    // First entry = the stage's default. `curls` at 0.07 swings the walk's
    // tail by ~8 curls on a swell — the figure visibly grows new spirals as
    // the music lifts — and bass deepens the ripple/rock/pulse compound at
    // the same time.
    { id: 'unfurl', label: { en: 'Unfurl', es: 'Despliega' }, routes: [
      { feature: 'level', param: 'curls', depth: 0.07 },
      { feature: 'bass', param: 'swell', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'surge', label: { en: 'Surge', es: 'Oleada' }, routes: [
      { feature: 'bass', param: 'swell', depth: 0.35 },
      { feature: 'level', param: 'opacity', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
  ],
  guilloche: [
    // `inner` is the rosette's central well: bass drives it, so the well
    // opens on every low swell and closes back to the resting figure as it
    // fades — the whole ring band breathing with the music's low end.
    // `rings` rides the overall level, not a fast band: changing it
    // re-spaces the whole band slightly, so it wants the slow envelope —
    // four or five extra grooves weave in as the track builds and retire
    // as it quiets. `depth` (lobe amplitude) rides the mids.
    // `twist` rides brightness at a deliberately small depth: it compounds
    // ring over ring, so 0.06 of travel already sweeps the outermost arm
    // by a radian — timbre re-curves the pinwheel.
    { id: 'engrave', label: { en: 'Engrave', es: 'Graba' }, routes: [
      { feature: 'bass', param: 'inner', depth: 0.35 },
      { feature: 'mid', param: 'depth', depth: 0.18 },
      { feature: 'level', param: 'rings', depth: 0.11 },
      { feature: 'bright', param: 'twist', depth: 0.06 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'shimmer', label: { en: 'Shimmer', es: 'Reluce' }, routes: [
      { feature: 'bright', param: 'inner', depth: 0.15 },
      { feature: 'level', param: 'depth', depth: 0.1 },
    ] },
  ],
  knot: [
    // `breathe` is the amplitude axis the intrinsic motion already rides,
    // so bass pushes the same swell the phase flow produces; `depth` on
    // brightness makes the over/under contrast sharpen on bright passages.
    { id: 'tumble', label: { en: 'Tumble', es: 'Voltereta' }, routes: [
      { feature: 'bass', param: 'breathe', depth: 0.4 },
      { feature: 'bright', param: 'depth', depth: 0.25 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'deep', label: { en: 'Deep', es: 'Fondo' }, routes: [
      { feature: 'level', param: 'depth', depth: 0.45 },
      { feature: 'mid', param: 'opacity', depth: 0.4 },
    ] },
  ],
  hyperweave: [
    // `wind` and `grain` are the params Hermes asked to hear ("wind and grain
    // pulsating with the beat"), and both are chaotic: any change of the
    // remapped walk step re-laces the whole closed walk (edge churn 1.00 —
    // see NEVER_ROUTE), and a grain step changes B = m·grain so every
    // boundary point moves. Continuous routes on them would strobe exactly
    // like timestable's multiplier did, so both pulse as beat-locked step
    // events instead — a re-lacing that lands ON the beat reads as rhythm —
    // while the smooth axes (`wobble`, weight, scale) breathe between beats.
    //
    // Pulse: the walk step. B = m·grain = 11·8 = 88 at the defaults, so the
    // 0.25 cap puts δ ≤ 22 and the slider reaches NINE distinct lacings — a
    // far richer instrument than the two it reached at the old B = 28, which
    // is why this range is the full sweep. 16..38 at steps 4 lands the windows
    // on wind 16/23/31/38 → δ = 9, 13, 17, 21; with the home window (wind 36
    // → δ 19) that is five genuinely different figures per cycle and no
    // window repeats. The floor is 16, not 2: the defaults draw a bold figure
    // (4 layers at stroke 0.9), and the tight low-δ lacings that read fine
    // against a thin default measure only 39% coverage / 22% ink against this
    // one — the frame-emptying guard in tests/anim/route-swing.test.ts fails
    // them, correctly. Sparse windows are a property of the pair, not of δ.

    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'bass', param: 'wobble', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'wind', everyBeats: 2, steps: 4, from: 16, to: 38 } },
    // Grain: the point count. 5..7 at steps 3 gives B = 55, 66, 77, and the
    // home grain 8 gives B = 88 — four distinct point sets, and the range
    // deliberately stops below the home value so no window duplicates the
    // resting figure. Grain 4 (B = 44) was in this range and measured 48% ink
    // — just under the guard, for the same reason as the pulse floor. Every 8 beats: a re-grain is the biggest change this
    // pattern can make, so it reads as a section rather than a pulse.

    { id: 'grain', label: { en: 'Grain', es: 'Grano' }, routes: [
      { feature: 'level', param: 'wobble', depth: 0.35 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.25 },
      { feature: 'mid', param: 'opacity', depth: 0.3 },
    ], event: { kind: 'step', param: 'grain', everyBeats: 8, steps: 3, from: 5, to: 7 } },
    // Ripple: no event — the figure the visitor designed, breathing only.
    // `wobble` is the seed ripple the intrinsic motion already rides, so
    // bass deepens the same shimmer; the arcs never lose the theorem.
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'bass', param: 'wobble', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
  ],
};

export function presetsFor(patternId: string): AnimPreset[] {
  return PRESETS_BY_PATTERN[patternId] ?? [];
}
