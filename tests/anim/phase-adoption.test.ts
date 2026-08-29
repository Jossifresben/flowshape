import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns, defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };

/** The original three phase adopters (Part 4, first pass). */
const FIRST_WAVE = ['harmonograph', 'phyllotaxis', 'helix'];
/** The seven analytic patterns given intrinsic motion in the second pass. */
const SECOND_WAVE = ['timestable', 'maurer', 'moire', 'chirp', 'roselattice', 'bands', 'coulomb'];
const ADOPTERS = [...FIRST_WAVE, ...SECOND_WAVE];

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
 * looping export would show a seam at the wrap. The seven second-wave
 * patterns make this exact by construction: each folds phase through `% 1`
 * before use, so phase 1 is literally the phase-0 expression, and the
 * underlying expression is genuinely 1-periodic so the approach to the wrap
 * is continuous too (checked at 0.999 below).
 */
describe.each(SECOND_WAVE)('%s loops seamlessly', (id) => {
  it('phase=1 reproduces phase=0 byte-for-byte', () => {
    expect(at(id, 1)).toBe(at(id, 0));
  });
  it('phase=0.999 is already close to the wrap (no jump at the seam)', () => {
    // Not equality — just that the pattern is heading home rather than
    // sitting somewhere arbitrary when the cycle rolls over.
    expect(at(id, 0.999)).not.toBe(at(id, 0.5));
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
