import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams } from '../../src/patterns/registry';
import { applyRoutes } from '../../src/anim/mapping';
import { ZERO_FRAME } from '../../src/audio/features';

const def = getPattern('flowfield')!; // curl: float 0.5..3 default 1.9
const base = defaultParams(def);

describe('applyRoutes', () => {
  it('zero features / zero depth leave the base params intact', () => {
    const out = applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 1 }], ZERO_FRAME, 1);
    expect(out['curl']).toBe(base['curl']);
  });
  it('full feature at depth 1 clamps to max; negative depth clamps to min', () => {
    const loud = { ...ZERO_FRAME, bass: 1 };
    expect(applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 1 }], loud, 1)['curl']).toBe(3);
    expect(applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: -1 }], loud, 1)['curl']).toBe(0.5);
  });
  it('intensity scales depth; int params round', () => {
    const half = { ...ZERO_FRAME, bass: 0.5 };
    const out = applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 0.4 }], half, 0.5);
    // 1.9 + 0.4*0.5*0.5*(3-0.5) = 2.15
    expect(out['curl']).toBeCloseTo(2.15, 5);
    const spaced = applyRoutes(def, base, [{ feature: 'bass', param: 'spacing', depth: 0.33 }], half, 1);
    expect(Number.isInteger(spaced['spacing'])).toBe(true);
  });
  it('is deterministic and ignores unknown params', () => {
    const f = { ...ZERO_FRAME, mid: 0.7 };
    const r = [{ feature: 'mid' as const, param: 'curl', depth: 0.5 }, { feature: 'mid' as const, param: 'ghost', depth: 1 }];
    expect(applyRoutes(def, base, r, f, 1)).toEqual(applyRoutes(def, base, r, f, 1));
    expect('ghost' in applyRoutes(def, base, r, f, 1)).toBe(false);
  });
});
