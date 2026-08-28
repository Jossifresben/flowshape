import { describe, it, expect } from 'vitest';
import type { PatternDef } from '../../src/patterns/registry';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

export const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
export const SIZE = { w: 600, h: 840 };

/** Heavy patterns run a full simulation per invariant; the 5s default is not enough. */
const INVARIANT_TIMEOUT_MS = 60_000;

export function render(def: PatternDef, params: Record<string, number>, seed: number): string {
  return serialize(def.generate(params, seed, SIZE), PAL);
}

/** The five invariants every flowshape pattern must satisfy. */
export function standardPatternTests(def: PatternDef, opts: { maxElements: number }): void {
  describe(`${def.id} · standard invariants`, () => {
    it('is deterministic', () => {
      const p = defaultParams(def);
      expect(render(def, p, 42)).toBe(render(def, p, 42));
    }, INVARIANT_TIMEOUT_MS);

    it('matches the committed snapshot (URL permanence guarantee)', () => {
      expect(render(def, defaultParams(def), 1)).toMatchSnapshot();
    }, INVARIANT_TIMEOUT_MS);

    it('emits no NaN/Infinity at any single-param extreme', () => {
      const combos: Record<string, number>[] = [defaultParams(def)];
      for (const pd of def.params) {
        combos.push({ ...defaultParams(def), [pd.key]: pd.min });
        combos.push({ ...defaultParams(def), [pd.key]: pd.max });
      }
      for (const c of combos) {
        const svg = render(def, c, 7);
        expect(svg).not.toContain('NaN');
        expect(svg).not.toContain('Infinity');
      }
    }, INVARIANT_TIMEOUT_MS);

    it('respects its element budget at defaults', () => {
      const svg = render(def, defaultParams(def), 1);
      const n = (svg.match(/<(circle|path|line|rect|polygon)/g) ?? []).length;
      expect(n).toBeLessThanOrEqual(opts.maxElements);
    }, INVARIANT_TIMEOUT_MS);

    it('varies with seed when usesSeed', () => {
      if (!def.usesSeed) return;
      const p = defaultParams(def);
      expect(render(def, p, 1)).not.toBe(render(def, p, 2));
    }, INVARIANT_TIMEOUT_MS);
  });
}
