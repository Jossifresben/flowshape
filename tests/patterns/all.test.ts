import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { RESERVED } from '../../src/core/reserved';

const patterns = listPatterns();

describe('pattern registry as a whole', () => {
  it('registers all 13 launch patterns at phase 1', () => {
    expect(patterns).toHaveLength(13);
    for (const p of patterns) expect(p.phase).toBe(1);
  });

  it('every enum param has exactly one option per legal index', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        if (pd.kind !== 'enum') continue;
        expect(pd.options, `${p.id}.${pd.key} needs options`).toBeDefined();
        expect(pd.options!.length, `${p.id}.${pd.key} options vs range`).toBe(pd.max - pd.min + 1);
      }
    }
  });

  it('no param step is finer than the URL encoding precision', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        expect(pd.step, `${p.id}.${pd.key} step below 1e-4`).toBeGreaterThanOrEqual(1e-4);
      }
    }
  });

  it('param keys are unique per pattern and never reserved', () => {
    for (const p of patterns) {
      const keys = p.params.map((pd) => pd.key);
      expect(new Set(keys).size, `${p.id} has duplicate param keys`).toBe(keys.length);
      for (const k of keys) expect(RESERVED.has(k), `${p.id}.${k} is reserved`).toBe(false);
    }
  });

  it('defaults are within their own declared range', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        expect(pd.default, `${p.id}.${pd.key} default below min`).toBeGreaterThanOrEqual(pd.min);
        expect(pd.default, `${p.id}.${pd.key} default above max`).toBeLessThanOrEqual(pd.max);
      }
    }
  });
});
