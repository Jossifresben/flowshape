import { describe, it, expect } from 'vitest';
import { PRESETS_BY_PATTERN, type AnimPreset } from '../../src/anim/presets';
import { getPattern, defaultParams, generateSafe, clampParams, type PatternDef } from '../../src/patterns/registry';
import { substance, type Substance } from './coverage';
import '../../src/patterns';

const SIZE = { w: 1920, h: 1080 };

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
 * Params listed here are the ones whose effect is chaotic or high-gain rather
 * than merely smooth. The budget is in the param's own units. A new preset
 * routing one of them at a conventional depth fails here rather than in front
 * of a user.
 */
const MAX_SWING: Record<string, number> = {
  'timestable.multiplier': 1.5,
  // apollonian's detail floor in screen px, range 1..30. Not chaotic the way
  // `multiplier` is — lowering it grows circles into gaps that already exist
  // — but the range is wide enough that a conventional depth would sweep the
  // figure from ~189 circles down to ~30 and back on every envelope. Two px
  // of travel is a texture that thickens; ten is a texture that flickers.
  'apollonian.minRadius': 2,
  // The two moire gratings. What is on screen is their interference, whose
  // fringe period goes as spacing / (angleB - angleA) — and the defaults
  // differ by 6 degrees. So ten degrees of travel already re-scales the
  // fringes several-fold: these are the highest-gain routes in the table.
  'moire.angleA': 8,
  'moire.angleB': 15,
  'moire.spacingB': 1,
  // Streamline integration length. Smooth (measured churn 0.011 per unit)
  // but every line's truncation cascades through the shared occupancy grid,
  // and the flicker that cascade produces grows fast with the swing: 5
  // streamlines flickering across a swell at a 35-step swing, 551 at 157.
  'coulomb.steps': 40,
  'flowfield.steps': 100,
  // coulomb's near-field softening radius, and its termination distance. The
  // strongest honest continuous axis the pattern has, but past ~26 units the
  // voids swallow the ring the charges sit on.
  'coulomb.coreRadius': 26,
  // Delaunay site count: the mesh re-forms locally around each added site,
  // so it is smooth in the small and a re-triangulation in the large
  // (churn 0.024 for +9 points, 0.18 for +92).
  'delaunay.points': 80,
  // Phyllotaxis floret radius on a 0.6 px default: at the old depth 0.55 the
  // dots grew six-fold and the centre closed into a disc.
  'phyllotaxis.dotMin': 2,
  // Stipple's sparse-region spacing; moving it relaxes the whole point set.
  'stipple.maxGap': 5,
  // bands' fan opening. Kept modest, and routed negative — see NEVER_UP.
  'bands.sweepAngle': 90,
};

/**
 * Params that must not appear in ANY route, with the measurement that says so.
 * Two reasons appear here and they are different failures:
 *
 *  - chaotic: the smallest representable step already reconfigures the figure,
 *    so there is no depth small enough to be a nudge. Per-frame modulation of
 *    these is a boil, not a response. They belong to beat-locked events, where
 *    the same jump reads as a section change instead of a glitch.
 *  - inert: the pattern does not read the param at its default settings, so a
 *    route on it moves no pixel at all. Two of these shipped.
 */
const NEVER_ROUTE: Record<string, string> = {
  // chaotic — churn is the fraction of drawn primitives that are a different
  // object after the smallest step the param can take.
  'hitomezashi.bitChance': 'churn 0.56 for a 0.01 step: one flipped bit inverts the prefix-xor fill of the whole field to its right',
  'hitomezashi.cell': 'churn 1.00 at +1 — re-tiles',
  'truchet.cell': 'churn 1.00 at +1 — re-tiles',
  'interlace.cell': 'churn 1.00 at +1 — re-tiles',
  'isoweave.cell': 'churn 1.00 at +1 — re-tiles',
  'nested.cell': 'churn 1.00 at +1 — re-tiles',
  'girih.hexSize': 'churn 1.00 at +1 — re-tiles',
  'fabric.gridSize': 'churn 1.00 at +1 — re-tiles',
  'tumbling.cell': 'churn 1.00 at +1 — re-tiles',
  'coulomb.charges': 'churn 1.00 at +1 — changes the field topology and reshuffles every streamline',
  'coulomb.spacing': 'churn 1.00 at +1 — reseeds the whole streamline grid',
  'flowfield.spacing': 'churn 1.00 at +1 — reseeds the whole streamline grid',
  'flowfield.freq': 'plateaus at the smallest step — the noise field is a different field',
  'phyllotaxis.angle': 'plateaus at 0.18 deg — the divergence angle IS the figure',
  'voronoi.sites': 'churn 0.05 per site: any useful swing re-forms a third of the diagram',
  'maurer.d': 'a single unit redraws the rose completely',
  'maurer.n': 'a single unit redraws the rose completely',
  // inert at default settings
  'girih.ribbonWidth': 'read only when render = 1 (ribbons); renders at 2, 9 and 20 are byte-identical at the default',
  'moire.offset': 'read only in mode 1 (circles)',
  'moire.spacingA': 'changing a grating spacing adds and drops lines at the frame edge: -1.6 px adds 54 lines and 144 of them flicker across one swell. Rotate instead — the angle routes keep the line count exactly fixed',
  'interlace.coreRatio': 'no measurable effect at any value',
};

/** Routes on these must be negative — the param's max is a degeneracy. */
const NEVER_UP: Record<string, string> = {
  // The wedge is one elliptical arc from a0 to a0 + sweep. At sweep = 360 the
  // endpoints coincide and the arc collapses: ink falls from 16.4k to 0.8k.
  // applyRoutes clamps to the max, so a positive route reaches it exactly
  // whenever the user's base angle is high enough.
  'bands.sweepAngle': 'sweepAngle = 360 collapses the arc',
};

/** Half of any one measure is a collapse, not a modulation. */
function collapsed(base: Substance, at: Substance): boolean {
  return at.coverage < base.coverage * 0.5 || at.ink < base.ink * 0.5 || at.elements < base.elements * 0.5;
}

function report(name: string, base: Substance, at: Substance): string {
  const pc = (a: number, b: number) => `${((a / b) * 100).toFixed(0)}%`;
  return `${name}: coverage ${pc(at.coverage, base.coverage)}, ink ${pc(at.ink, base.ink)}, elements ${pc(at.elements, base.elements)} of the still render`;
}

function allRoutes(): { pattern: string; def: PatternDef; preset: AnimPreset; param: string; depth: number }[] {
  const out: { pattern: string; def: PatternDef; preset: AnimPreset; param: string; depth: number }[] = [];
  for (const [pattern, presets] of Object.entries(PRESETS_BY_PATTERN as Record<string, AnimPreset[]>)) {
    const def = getPattern(pattern);
    if (!def) continue;
    for (const preset of presets) for (const r of preset.routes ?? []) {
      out.push({ pattern, def, preset, param: r.param, depth: r.depth });
    }
  }
  return out;
}

describe('preset route swing', () => {
  it('keeps chaotic params inside their budget', () => {
    const over: string[] = [];
    for (const r of allRoutes()) {
      const budget = MAX_SWING[`${r.pattern}.${r.param}`];
      if (budget === undefined) continue;
      const pd = r.def.params.find((p) => p.key === r.param);
      if (!pd) continue;
      const swing = Math.abs(r.depth) * (pd.max - pd.min);
      if (swing > budget) over.push(`${r.pattern}/${r.preset.id}/${r.param}: swing ${swing.toFixed(2)} > ${budget}`);
    }
    expect(over).toEqual([]);
  });

  it('every budgeted param is actually routed somewhere', () => {
    // Guards the table itself: a renamed param would silently stop being checked.
    const routed = new Set(allRoutes().map((r) => `${r.pattern}.${r.param}`));
    for (const key of Object.keys(MAX_SWING)) expect(routed).toContain(key);
  });

  it('never routes a param that is chaotic or inert', () => {
    const bad = allRoutes()
      .filter((r) => NEVER_ROUTE[`${r.pattern}.${r.param}`])
      .map((r) => `${r.pattern}/${r.preset.id}/${r.param}: ${NEVER_ROUTE[`${r.pattern}.${r.param}`]}`);
    expect(bad).toEqual([]);
  });

  it('every never-route entry names a real param', () => {
    for (const key of Object.keys({ ...NEVER_ROUTE, ...NEVER_UP })) {
      const [pattern, param] = key.split('.') as [string, string];
      const def = getPattern(pattern);
      expect(def, pattern).toBeDefined();
      expect(def!.params.some((p) => p.key === param), key).toBe(true);
    }
  });

  it('never drives a param toward a degenerate extreme', () => {
    const bad = allRoutes()
      .filter((r) => NEVER_UP[`${r.pattern}.${r.param}`] && r.depth > 0)
      .map((r) => `${r.pattern}/${r.preset.id}/${r.param}: ${NEVER_UP[`${r.pattern}.${r.param}`]}`);
    expect(bad).toEqual([]);
  });

  it('every routed param is declared in the pattern anim.continuous list', () => {
    // The list is the pattern's own statement about what is safe to modulate
    // per frame; a route that isn't on it is a claim nobody checked.
    const bad: string[] = [];
    for (const r of allRoutes()) {
      if (!(r.def.anim?.continuous ?? []).includes(r.param)) bad.push(`${r.pattern}/${r.preset.id}: ${r.param}`);
    }
    expect(bad).toEqual([]);
  });
});

/**
 * The figure must survive the loudest frame.
 *
 * `applyRoutes` clamps into the param's declared range, so the extreme a route
 * can reach is exactly `clamp(base + depth * (max - min))` — a value a user
 * hits whenever the driving band saturates, which for `level` or `bass` is
 * most of a chorus. That endpoint is where degeneracies live: bands' wedge
 * collapses at sweepAngle 360, maurer's walk collapses at d = 1, apollonian
 * empties at maxDepth 2. This renders every route's own extreme and asks
 * whether there is still a picture there.
 */
describe('no route can empty the frame', () => {
  const cases = allRoutes();
  const measured = cases.map((r) => {
    const base = defaultParams(r.def);
    const pd = r.def.params.find((p) => p.key === r.param)!;
    const extreme = clampParams(r.def, { ...base, [r.param]: base[r.param]! + r.depth * (pd.max - pd.min) });
    return {
      name: `${r.pattern}/${r.preset.id}/${r.param}`,
      base: substance(generateSafe(r.def, base, 7, SIZE), SIZE.w, SIZE.h),
      at: substance(generateSafe(r.def, extreme, 7, SIZE), SIZE.w, SIZE.h),
    };
  });

  it('keeps at least half its coverage, ink and population at every route extreme', () => {
    const thin = measured.filter((m) => collapsed(m.base, m.at)).map((m) => report(m.name, m.base, m.at));
    expect(thin).toEqual([]);
  });
});

/**
 * The same question for events, which is where it actually bit: a `step`
 * traverses its range on a beat cadence, so a degenerate endpoint is not a
 * rare peak but a guaranteed visitor once per cycle. apollonian stepped
 * maxDepth across 2..8 every two beats, and maxDepth 2 is 16 circles against
 * 209 at the default; maurer stepped d across 1..359 every beat, and d = 1
 * collapses the rose to a ring.
 */
describe('no event window empties the frame', () => {
  const rows: { name: string; base: Substance; worst: Substance }[] = [];
  for (const [pattern, presets] of Object.entries(PRESETS_BY_PATTERN as Record<string, AnimPreset[]>)) {
    const def = getPattern(pattern);
    if (!def) continue;
    for (const preset of presets) {
      const ev = preset.event;
      if (!ev || ev.kind !== 'step') continue;
      const pd = def.params.find((p) => p.key === ev.param)!;
      const base = defaultParams(def);
      const steps = Math.max(2, ev.steps ?? 8);
      const lo = ev.from ?? pd.min, hi = ev.to ?? pd.max;
      const worst: Substance = { coverage: Infinity, ink: Infinity, elements: Infinity };
      for (let k = 0; k < steps; k++) {
        const v = lo + ((hi - lo) * k) / (steps - 1);
        const s = substance(generateSafe(def, { ...base, [ev.param!]: v }, 7, SIZE), SIZE.w, SIZE.h);
        worst.coverage = Math.min(worst.coverage, s.coverage);
        worst.ink = Math.min(worst.ink, s.ink);
        worst.elements = Math.min(worst.elements, s.elements);
      }
      rows.push({ name: `${pattern}/${preset.id}/${ev.param}`, base: substance(generateSafe(def, base, 7, SIZE), SIZE.w, SIZE.h), worst });
    }
  }

  it('every step window still draws a figure', () => {
    const thin = rows.filter((r) => collapsed(r.base, r.worst)).map((r) => report(r.name, r.base, r.worst));
    expect(thin).toEqual([]);
  });

  it('a step sub-range stays inside the param range and runs upward', () => {
    for (const [pattern, presets] of Object.entries(PRESETS_BY_PATTERN as Record<string, AnimPreset[]>)) {
      const def = getPattern(pattern);
      if (!def) continue;
      for (const preset of presets) {
        const ev = preset.event;
        if (!ev || ev.kind !== 'step') continue;
        const pd = def.params.find((p) => p.key === ev.param)!;
        const lo = ev.from ?? pd.min, hi = ev.to ?? pd.max;
        expect(lo, `${pattern}/${preset.id}`).toBeGreaterThanOrEqual(pd.min);
        expect(hi, `${pattern}/${preset.id}`).toBeLessThanOrEqual(pd.max);
        expect(hi, `${pattern}/${preset.id}`).toBeGreaterThan(lo);
      }
    }
  });
});
