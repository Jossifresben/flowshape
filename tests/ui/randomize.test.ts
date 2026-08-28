import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns, clampParams, defaultParams } from '../../src/patterns/registry';
import { randomParams } from '../../src/patterns/randomize';

const patterns = listPatterns();

describe('randomParams', () => {
  it('every value is within its ParamDef range, for every registered pattern', () => {
    for (const def of patterns) {
      // Exercise a spread of rnd() outputs, including the extremes.
      for (const rnd of [() => 0, () => 0.5, () => 0.999999, Math.random]) {
        const params = randomParams(def, rnd);
        for (const p of def.params) {
          const v = params[p.key]!;
          expect(v, `${def.id}.${p.key} below min`).toBeGreaterThanOrEqual(p.min);
          expect(v, `${def.id}.${p.key} above max`).toBeLessThanOrEqual(p.max);
        }
      }
    }
  });

  it('clampParams never has to correct a randomized params object', () => {
    for (const def of patterns) {
      for (const rnd of [() => 0, () => 0.5, () => 0.999999, Math.random]) {
        const params = randomParams(def, rnd);
        expect(clampParams(def, params)).toEqual(params);
      }
    }
  });

  it('leaves strokeWidth and opacity untouched, falling back to defaults with no current params', () => {
    for (const def of patterns) {
      const defaults = defaultParams(def);
      const params = randomParams(def, () => 0.5);
      for (const p of def.params) {
        if (p.key === 'strokeWidth' || p.key === 'opacity') {
          expect(params[p.key]).toBe(defaults[p.key]);
        }
      }
    }
  });

  it('keeps strokeWidth/opacity from the supplied current params instead of the default', () => {
    for (const def of patterns) {
      const current = defaultParams(def);
      for (const p of def.params) {
        if (p.key === 'strokeWidth' || p.key === 'opacity') current[p.key] = p.max;
      }
      const params = randomParams(def, () => 0.5, current);
      for (const p of def.params) {
        if (p.key === 'strokeWidth' || p.key === 'opacity') {
          expect(params[p.key]).toBe(p.max);
        }
      }
    }
  });
});
