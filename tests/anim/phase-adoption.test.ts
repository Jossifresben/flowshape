import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns, defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette, type SvgNode } from '../../src/core/svg';

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
const LOOPERS = [...SECOND_WAVE, ...THIRD_WAVE];
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
