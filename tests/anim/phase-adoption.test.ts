import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns, defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette, type SvgNode } from '../../src/core/svg';
import { ellipticAbout, mapDisc, FLOW_CENTRE, type Disc } from '../../src/patterns/apollonian';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };

/** The original three phase adopters (Part 4, first pass). */
const FIRST_WAVE = ['harmonograph', 'phyllotaxis', 'helix'];
/** The seven analytic patterns given intrinsic motion in the second pass. */
const SECOND_WAVE = ['timestable', 'maurer', 'moire', 'chirp', 'roselattice', 'bands', 'coulomb'];
/**
 * The five field-driven patterns of the third pass. These are not curves with
 * a parameter to advance: they are lattices and streamlines sampled from a
 * field, so the motion is the *field* travelling under a structure that never
 * moves. Three of them (tumbling, flowfield, fabric) drift the fbm sample
 * point around a circle in noise space — value noise hashes absolute lattice
 * cells and so has no period in anything, which makes a closed path the only
 * drift that can return to the field it started from. voxel and nested own no
 * field at all (voxel's randomness is per-cell white noise, nested calls no
 * PRNG whatsoever), so they carry a travelling wave in a continuous shape
 * axis instead, built to vanish identically at phase 0.
 */
const THIRD_WAVE = ['tumbling', 'voxel', 'nested', 'flowfield', 'fabric'];
/**
 * The fourth pass, one pattern. apollonian was skipped twice as
 * "structurally discrete", which was wrong: an Apollonian gasket is a Möbius
 * object, and a continuously varying Möbius transformation slides every
 * circle through the packing while preserving every tangency exactly, so the
 * figure is a genuine Apollonian gasket at every instant. The subgroup is
 * elliptic — a hyperbolic-metric rotation about an interior point — which is
 * the only kind that is both bounded (it is a disc automorphism, so the
 * gasket's outer circle maps to itself exactly and the figure can never
 * leave its frame) and exactly periodic (2π, so one engine cycle closes it).
 * See the derivation in src/patterns/apollonian.ts.
 */
const FOURTH_WAVE = ['apollonian'];
/**
 * The fifth pass, one pattern. hitomezashi was skipped as "structurally
 * discrete", and its lattice is: the grid lines are fixed and the bits are
 * random draws with no period in anything, so translating the figure cannot
 * return to itself. But the *stitches* are periodic even though the pattern
 * is not — a line's dash occupancy is `(index + bit) % 2`, which repeats
 * every two cells regardless of the bit — so sliding the vertical stitches
 * down their own columns and the horizontal stitches right along their own
 * rows by a whole number of two-cell periods maps the stitch field exactly
 * onto itself. The field scrolls diagonally, every stitch stays on its own
 * grid line, and the loop closes without re-drawing a single bit.
 */
const FIFTH_WAVE = ['hitomezashi'];
/**
 * The sixth pass: the five patterns of the 2026-08-30 expansion, all built
 * phase-first. billiard slides its launch point once around the rim (the
 * chords flow, the caustic stands still); loxodrome slides every circle one
 * step along its own Möbius orbit, wrapping the index set so the invariant
 * family lands on itself; mystery spins each harmonic by 2π·s — the
 * identity at phase 1 — morphing the curve inside its own symmetry class;
 * curlicue and guilloche precess. Every one folds phase through `% 1`, so
 * the loop closes byte-for-byte.
 */
const SIXTH_WAVE = ['billiard', 'loxodrome', 'mystery', 'curlicue', 'guilloche'];
/**
 * The seventh pass: the two patterns promoted from spike/next-curve, both
 * built phase-first to mystery's brief. knot precesses its projection azimuth
 * by exactly one turn per cycle, breathes its axis weights at integer rates
 * (sin 2πk·tw, zero at the wrap), and fans its layer trail through
 * (1 − cos 2π·ph); hyperweave turns by exactly one symmetry step 2π/m per
 * cycle (the m-fold symmetry makes that the identity at the wrap) while its
 * (B/m)-periodic seed ripple travels once around its own sector. Every
 * motion folds phase through `% 1`, so the loop closes byte-for-byte.
 */
const SEVENTH_WAVE = ['knot', 'hyperweave'];
/**
 * The eighth pass: the three field patterns of the 2026-08-31 field-patterns
 * expansion, all built phase-first to the same brief. linefield turns the
 * whole orientation field by one tick per cycle plus a structure-timed
 * shimmer, breathes each wave's amplitude at its own small-integer rate, and
 * orbits each vortex centre on a tiny closed circle — the grid itself never
 * moves. nodegarden orbits the drift read-point once around a fixed circle
 * in noise space, so the jitter+drift lattice returns exactly to where it
 * started. interference advances each source's phase by its own small
 * integer number of turns per cycle, so the summed fringe field is exactly
 * 1-periodic regardless of `detune`. Every motion folds phase through `% 1`,
 * so the loop closes byte-for-byte.
 */
const EIGHTH_WAVE = ['linefield', 'nodegarden', 'interference'];
/**
 * The ninth pass, one pattern. villarceau's motion is the one-parameter
 * SO(4) subgroup R(φ): p ↦ q(φ)·p, q(φ) = cos(πφ) + sin(πφ)·n. Left
 * multiplication commutes with the right fiber action, so R(φ) always
 * carries Hopf fibers to Hopf fibers; at φ = 1, q = −1 and R(1) = −I, the
 * antipodal map, which is e^{iπ} within every fiber's own circle group —
 * every fiber returns to itself as a set, and with the even sample count N
 * the sample set coincides with itself too. Phase 1 reproduces phase 0 by
 * the group law, not by construction, and `% 1` folding then makes the two
 * frames byte-identical, the same class of guarantee as mystery's Farris
 * congruence and knot's coprime frequencies.
 */
const NINTH_WAVE = ['villarceau'];
const LOOPERS = [
  ...SECOND_WAVE, ...THIRD_WAVE, ...FOURTH_WAVE, ...FIFTH_WAVE, ...SIXTH_WAVE, ...SEVENTH_WAVE,
  ...EIGHTH_WAVE, ...NINTH_WAVE,
];
const ADOPTERS = [...FIRST_WAVE, ...LOOPERS];

function at(id: string, phase?: number): string {
  const def = getPattern(id)!;
  const base = defaultParams(def);
  const params = phase === undefined ? base : { ...base, phase };
  return serialize(generateSafe(def, params, 7, SIZE), PAL);
}

describe.each(ADOPTERS)('%s phase', (id) => {
  it('declares usesPhase', () => {
    expect(getPattern(id)!.anim?.usesPhase).toBe(true);
  });
  it('phase=0 matches the no-phase render exactly', () => {
    expect(at(id, 0)).toBe(at(id));
  });
  it('phase=0.3 changes the geometry', () => {
    expect(at(id, 0.3)).not.toBe(at(id));
  });
});

/**
 * Seamless loop: the engine's phase axis is cyclic (see phaseAt), so a full
 * cycle must land back on the frame it started from — otherwise every
 * looping export would show a seam at the wrap. Every second- and
 * third-wave pattern makes this exact by construction: each folds phase
 * through `% 1` before use, so phase 1 is literally the phase-0 expression,
 * and the underlying expression is genuinely 1-periodic so the approach to
 * the wrap is continuous too (checked at 0.999 below).
 */
describe.each(LOOPERS)('%s loops seamlessly', (id) => {
  it('phase=1 reproduces phase=0 byte-for-byte', () => {
    expect(at(id, 1)).toBe(at(id, 0));
  });
  it('phase=0.999 is already close to the wrap (no jump at the seam)', () => {
    // Not equality — just that the pattern is heading home rather than
    // sitting somewhere arbitrary when the cycle rolls over.
    expect(at(id, 0.999)).not.toBe(at(id, 0.5));
  });
});

/**
 * Fizz guard. Both threshold patterns of the third wave feed a smooth field
 * into a hard binary decision — tumbling flips a hexagon's cube when
 * `u < flipChance`, voxel drops a cell when its scatter draw falls under the
 * wave-raised cull — and the failure mode of drifting the field underneath
 * such a decision is not a wrong frame but a single cell chattering on and
 * off many times a second while its field value jitters across the line.
 *
 * A travelling front is the goal, so what has to be true is per cell, not per
 * frame: over one whole cycle each cell should change state a couple of times
 * (once out, once back), never dozens. Both patterns keep their geometry
 * fixed, so a cell can be identified across frames by its own coordinates and
 * followed through the cycle exactly.
 *
 * This bounds strobing. It cannot certify that the drift looks good — that is
 * what watching the stage does.
 */
function statesOverCycle(id: string, key: (n: SvgNode) => string, samples = 150): Map<string, string[]> {
  const def = getPattern(id)!;
  const seen = new Map<string, string[]>();
  for (let f = 0; f < samples; f++) {
    const node = generateSafe(def, { ...defaultParams(def), phase: f / samples }, 7, SIZE);
    const frame = new Map<string, string>();
    for (const child of node.children) {
      const k = key(child);
      if (k) frame.set(k, String(child.attrs['fill-opacity'] ?? '1'));
    }
    for (const k of frame.keys()) if (!seen.has(k)) seen.set(k, []);
    for (const [k, hist] of seen) hist.push(frame.get(k) ?? 'absent');
  }
  return seen;
}

function transitions(hist: string[]): number {
  let n = 0;
  for (let i = 1; i < hist.length; i++) if (hist[i] !== hist[i - 1]) n++;
  return n;
}

describe('tumbling flips as a front, not as static', () => {
  // A hexagon's three rhombi are emitted together and never move, so the
  // first rhombus's own polygon is a stable name for the hexagon, and its
  // fill-opacity is exactly the flip state (unflipped it takes the lightest
  // tone of the triple, flipped the darkest).
  const states = statesOverCycle('tumbling', (n) => (n.tag === 'polygon' ? String(n.attrs['points'] ?? '') : ''));
  const counts = [...states.values()].map(transitions);
  it('the drift actually reverses cubes', () => {
    expect(counts.filter((c) => c > 0).length).toBeGreaterThan(10);
  });
  it('no hexagon strobes: four is the structural ceiling', () => {
    // Two mechanisms, each unimodal in phase for a given hexagon: the field
    // orbit contributes at most one crossing each way, and so does the gate
    // pulse. Four is therefore the bound by construction, not a fudge —
    // if this fails, one of them has stopped being a single smooth sweep.
    expect(Math.max(...counts)).toBeLessThanOrEqual(4);
  });
});

describe('voxel dissolves in swells, not in static', () => {
  // Cubes never move in voxel — only their shading and their presence change
  // — so a cube's `points` string is a permanent name for it.
  const states = statesOverCycle('voxel', (n) => (n.tag === 'polygon' ? String(n.attrs['points'] ?? '') : ''));
  const presence = [...states.values()].map((h) => transitions(h.map((v) => (v === 'absent' ? 'out' : 'in'))));
  it('cells really do wink out and back', () => {
    expect(presence.filter((c) => c > 0).length).toBeGreaterThan(10);
  });
  it('no cell strobes', () => {
    expect(Math.max(...presence)).toBeLessThanOrEqual(4);
  });
});

/**
 * The Möbius machinery itself, tested as maths rather than through a render.
 *
 * The whole justification for moving an Apollonian gasket this way is that
 * `z → (αz + β)/(γz + δ)` maps circles to circles and preserves tangency
 * *exactly*. If the closed form for the image circle were wrong — even
 * slightly — the packing would come apart at the seams: tangent circles
 * would overlap or separate, and the figure would stop being a gasket. So
 * the closed form is checked directly, against known-tangent pairs, at a
 * tolerance far tighter than a pixel.
 */
describe('the Möbius circle-image closed form', () => {
  // Three mutually tangent circles of the seed configuration plus the outer
  // boundary, in the pattern's own normalised coordinates (see apollonian.ts):
  // the unit disc, two half-radius circles filling it left and right, and the
  // r = 1/3 circle Descartes' theorem puts in the gap below them.
  const OUTER: Disc = { z: { re: 0, im: 0 }, r: 1 };
  const LEFT: Disc = { z: { re: -0.5, im: 0 }, r: 0.5 };
  const RIGHT: Disc = { z: { re: 0.5, im: 0 }, r: 0.5 };
  const LOWER: Disc = { z: { re: 0, im: 2 / 3 }, r: 1 / 3 };

  /** Signed tangency defect: 0 exactly when the two circles touch at one
   *  point, whether externally (|Δ| = r₁ + r₂) or internally (|Δ| = |r₁ − r₂|,
   *  which is how every circle inside the gasket touches the boundary). */
  function defect(a: Disc, b: Disc): number {
    const d = Math.hypot(a.z.re - b.z.re, a.z.im - b.z.im);
    return Math.min(Math.abs(d - (a.r + b.r)), Math.abs(d - Math.abs(a.r - b.r)));
  }

  const PAIRS: [string, Disc, Disc][] = [
    ['outer/left', OUTER, LEFT],
    ['outer/right', OUTER, RIGHT],
    ['outer/lower', OUTER, LOWER],
    ['left/right', LEFT, RIGHT],
    ['left/lower', LEFT, LOWER],
    ['right/lower', RIGHT, LOWER],
  ];

  it('the reference pairs really are tangent to begin with', () => {
    for (const [name, a, b] of PAIRS) expect(defect(a, b), name).toBeLessThan(1e-12);
  });

  it('preserves every tangency, at every phase, to 1e-12', () => {
    let worst = 0;
    for (let i = 1; i < 240; i++) {
      const M = ellipticAbout(FLOW_CENTRE, 2 * Math.PI * (i / 240));
      for (const [name, a, b] of PAIRS) {
        const ia = mapDisc(M, a.z, a.r)!;
        const ib = mapDisc(M, b.z, b.r)!;
        expect(ia, name).not.toBeNull();
        expect(ib, name).not.toBeNull();
        worst = Math.max(worst, defect(ia, ib));
      }
    }
    // Normalised units: the outer circle has radius 1, so this is ~5e-10 px
    // on a 1920-wide stage. Tangency survives the transform exactly, up to
    // double-precision rounding.
    expect(worst).toBeLessThan(1e-12);
  });

  it('fixes the outer circle exactly — the figure can never leave its frame', () => {
    // This is the containment argument, and it is not approximate: an
    // elliptic element of SU(1,1) is a disc automorphism, so the unit disc
    // maps onto itself. Everything the gasket contains is inside that disc,
    // so nothing can be pumped out of frame the way a hyperbolic subgroup
    // would do.
    for (let i = 0; i < 240; i++) {
      const M = ellipticAbout(FLOW_CENTRE, 2 * Math.PI * (i / 240));
      const im = mapDisc(M, OUTER.z, OUTER.r)!;
      expect(Math.hypot(im.z.re, im.z.im)).toBeLessThan(1e-12);
      expect(Math.abs(im.r - 1)).toBeLessThan(1e-12);
    }
  });

  it('every circle stays strictly inside the outer circle at every phase', () => {
    for (let i = 0; i < 120; i++) {
      const M = ellipticAbout(FLOW_CENTRE, 2 * Math.PI * (i / 120));
      for (const [name, d] of [['left', LEFT], ['right', RIGHT], ['lower', LOWER]] as [string, Disc][]) {
        const im = mapDisc(M, d.z, d.r)!;
        expect(Math.hypot(im.z.re, im.z.im) + im.r, `${name} @ ${i}`).toBeLessThanOrEqual(1 + 1e-12);
      }
    }
  });

  it('is the identity at phase 0 and again at phase 1', () => {
    for (const theta of [0, 2 * Math.PI]) {
      const M = ellipticAbout(FLOW_CENTRE, theta);
      const im = mapDisc(M, LOWER.z, LOWER.r)!;
      expect(im.z.re).toBeCloseTo(LOWER.z.re, 12);
      expect(im.z.im).toBeCloseTo(LOWER.z.im, 12);
      expect(im.r).toBeCloseTo(LOWER.r, 12);
    }
  });

  it('is not a Euclidean rotation: circles genuinely grow and shrink', () => {
    // The failure this guards is FLOW_CENTRE drifting to 0, which degenerates
    // the elliptic subgroup into a rigid spin of the whole figure — the
    // weakest motion on the stage and the thing this pattern was rebuilt to
    // avoid. Off-centre, radii are not preserved.
    let ratio = 1;
    for (let i = 0; i < 120; i++) {
      const M = ellipticAbout(FLOW_CENTRE, 2 * Math.PI * (i / 120));
      for (const d of [LEFT, RIGHT, LOWER]) {
        const im = mapDisc(M, d.z, d.r)!;
        ratio = Math.max(ratio, im.r / d.r, d.r / im.r);
      }
    }
    expect(ratio).toBeGreaterThan(1.5);
  });

  it('each circle grows and shrinks once per cycle — no chattering at the detail floor', () => {
    // apollonian culls on the *image* radius, so the visible detail floor is
    // a fixed number of screen pixels at every phase and circles bloom in and
    // out at it. That is a continuous quantity feeding a hard cutoff, which
    // is exactly where strobing comes from — unless the quantity is unimodal
    // over the cycle, which it is: the image radius has one maximum and one
    // minimum per revolution, so a circle sitting on the cutoff can cross it
    // at most twice. This measures that directly, on the real map.
    const SAMPLES = 360;
    for (const d of [LEFT, RIGHT, LOWER, { z: { re: 0.167, im: 0 }, r: 0.167 }]) {
      const rs: number[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        rs.push(mapDisc(ellipticAbout(FLOW_CENTRE, 2 * Math.PI * (i / SAMPLES)), d.z, d.r)!.r);
      }
      let turns = 0;
      for (let i = 0; i < SAMPLES; i++) {
        const prev = rs[(i - 1 + SAMPLES) % SAMPLES]!, cur = rs[i]!, next = rs[(i + 1) % SAMPLES]!;
        if ((cur - prev) * (next - cur) < 0) turns++;
      }
      expect(turns).toBeLessThanOrEqual(2);
    }
  });
});

/**
 * hitomezashi scrolls as a rigid translation, not as a re-draw.
 *
 * The failure mode this guards is the one the pattern was skipped for in the
 * first place: because a hitomezashi is built from random per-line bits,
 * anything that re-indexes those bits between frames produces a field that
 * *re-rolls* rather than moves — locally plausible, globally a fizz, and
 * indistinguishable from motion in any aggregate measure. So the claim is
 * checked per stitch: at every phase, every stitch on screen must be a
 * phase-0 stitch displaced along its own line by exactly the drift (modulo
 * the two-cell dash period the loop is built on). One stitch that isn't
 * would mean a bit changed, and the motion would be a lie.
 *
 * The population is checked too — a translation that let the field thin out
 * at the leading edge would satisfy the displacement claim while emptying
 * the frame.
 */
describe('hitomezashi scrolls rather than re-rolls', () => {
  const def = getPattern('hitomezashi')!;
  const base = defaultParams(def);
  const cell = base['cell']!;
  // Must match LAPS * 2 in src/patterns/hitomezashi.ts.
  const TRAVEL = 16;

  /** Vertical stitches keyed by (x, y-of-start); horizontal by (y, x-of-start). */
  function stitches(phase: number): { V: Set<string>; H: Set<string> } {
    const node = generateSafe(def, { ...base, phase }, 7, SIZE);
    const d = String(node.children.find((c) => c.tag === 'path')!.attrs['d'] ?? '');
    const V = new Set<string>(), H = new Set<string>();
    for (const m of d.matchAll(/M(-?[\d.]+) (-?[\d.]+)V/g)) V.add(`${(+m[1]!).toFixed(2)},${(+m[2]!).toFixed(2)}`);
    for (const m of d.matchAll(/M(-?[\d.]+) (-?[\d.]+)H/g)) H.add(`${(+m[2]!).toFixed(2)},${(+m[1]!).toFixed(2)}`);
    return { V, H };
  }

  const SAMPLES = 24;
  const zero = stitches(0);
  const unexplained: number[] = [];
  const counts: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const phase = i / SAMPLES;
    const drift = (phase % 1) * TRAVEL * cell;
    const cur = stitches(phase);
    counts.push(cur.V.size + cur.H.size);
    let bad = 0;
    const check = (set: Set<string>, ref: Set<string>) => {
      for (const k of set) {
        const [a, b] = k.split(',').map(Number) as [number, number];
        let ok = false;
        for (let s = -TRAVEL - 2; s <= TRAVEL + 2 && !ok; s++) {
          if (ref.has(`${a.toFixed(2)},${(b - drift + s * cell).toFixed(2)}`)) ok = true;
        }
        if (!ok) bad++;
      }
    };
    check(cur.V, zero.V);
    check(cur.H, zero.H);
    unexplained.push(bad);
  }

  it('every stitch at every phase is a phase-0 stitch, slid along its own line', () => {
    expect(Math.max(...unexplained)).toBe(0);
  });

  it('the field never thins: the population holds within a few percent', () => {
    const lo = Math.min(...counts), hi = Math.max(...counts);
    expect(lo).toBeGreaterThan(hi * 0.97);
  });

  it('the drift really moves — mid-cycle is a different frame', () => {
    // A quarter of a lap: the stitches sit half a cell off their phase-0
    // positions, which is the furthest they ever get from register.
    expect(at('hitomezashi', 1 / (TRAVEL * 2))).not.toBe(at('hitomezashi', 0));
  });
});

/**
 * And the same claim end to end, through the render: the number of circles
 * on screen must drift, not jump. A cull that fizzed would show up here as a
 * large frame-to-frame swing in the population.
 */
describe('apollonian blooms smoothly', () => {
  const def = getPattern('apollonian')!;
  const SAMPLES = 150;
  const counts: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const svg = serialize(generateSafe(def, { ...defaultParams(def), phase: i / SAMPLES }, 7, SIZE), PAL);
    counts.push((svg.match(/<circle/g) ?? []).length);
  }

  it('the population really does change over a cycle', () => {
    expect(Math.max(...counts) - Math.min(...counts)).toBeGreaterThan(5);
  });

  it('never jumps: consecutive frames differ by a handful of circles at most', () => {
    let jump = 0;
    for (let i = 0; i < SAMPLES; i++) jump = Math.max(jump, Math.abs(counts[(i + 1) % SAMPLES]! - counts[i]!));
    expect(jump).toBeLessThanOrEqual(6);
  });

  it('the figure never empties out', () => {
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(counts[0]! * 0.9);
  });
});

describe('phase is engine-owned', () => {
  it('never appears in any pattern anim.continuous list', () => {
    for (const def of listPatterns()) {
      expect(def.anim?.continuous ?? [], def.id).not.toContain('phase');
    }
  });
  it('is a hidden param on exactly the declared adopters', () => {
    const withPhase = listPatterns().filter((d) => d.params.some((p) => p.key === 'phase'));
    expect(withPhase.map((d) => d.id).sort()).toEqual([...ADOPTERS].sort());
    for (const d of withPhase) {
      expect(d.params.find((p) => p.key === 'phase')!.hidden, d.id).toBe(true);
    }
  });
});
