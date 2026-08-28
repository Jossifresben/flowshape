import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns, generateSafe } from '../../src/patterns/registry';
import { RESERVED } from '../../src/core/reserved';

const patterns = listPatterns();
const FRAME = { w: 600, h: 840 };

describe('pattern registry as a whole', () => {
  it('registers all 12 launch patterns at phase 1', () => {
    expect(patterns).toHaveLength(12);
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

  it('every pattern has a universal size param', () => {
    for (const p of patterns) {
      const sizeParam = p.params.find((pd) => pd.key === 'size');
      expect(sizeParam, `${p.id} missing size param`).toBeDefined();
      expect(sizeParam!.kind).toBe('float');
      expect(sizeParam!.default).toBe(1);
    }
  });

  it('generateSafe wraps children in a scaling <g> only when size !== 1', () => {
    for (const p of patterns) {
      const scaled = generateSafe(p, { size: 0.5 }, 1, FRAME);
      expect(scaled.children, `${p.id} scaled root should have exactly one child`).toHaveLength(1);
      const wrapper = scaled.children[0]!;
      expect(wrapper.tag, `${p.id} scaled root's child should be a <g>`).toBe('g');
      expect(String(wrapper.attrs['transform']), `${p.id} <g> transform should scale(0.5)`).toContain(
        'scale(0.5)',
      );

      const unscaled = generateSafe(p, { size: 1 }, 1, FRAME);
      const hasGWrapper = unscaled.children.length === 1 && unscaled.children[0]!.tag === 'g';
      expect(hasGWrapper, `${p.id} size:1 should return the ungrouped tree`).toBe(false);
    }
  });
});
