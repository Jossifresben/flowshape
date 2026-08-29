import { describe, it, expect } from 'vitest';
import type { PatternDef } from '../../src/patterns/registry';
import { defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

export const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
export const SIZE = { w: 600, h: 840 };

/** Heavy patterns run a full simulation per invariant; the 5s default is not enough. */
const INVARIANT_TIMEOUT_MS = 60_000;

export function render(def: PatternDef, params: Record<string, number>, seed: number): string {
  return serialize(generateSafe(def, params, seed, SIZE), PAL);
}

/**
 * The rendered SVG's element tags, sorted (i.e. draw order stripped). Two
 * renders can differ as raw strings purely because a PRNG draw reordered
 * which of several identical-looking, non-overlapping elements gets painted
 * first — a real byte diff with zero visual effect (this is exactly how
 * voxel's old depth tie-break jitter defeated the "varies with seed" check
 * below without voxel's Randomize doing anything visible). Comparing the
 * sorted element list instead asks the question that actually matters: did
 * the *set* of things drawn change, not just the order they were drawn in.
 * It's an imperfect proxy for "looks different" (two elements can swap
 * paint order and still look different if they overlap), but every pattern
 * currently in the registry either doesn't reorder at all or reorders only
 * non-overlapping elements, so it's a strictly more honest check than raw
 * string inequality without any known false positives today.
 */
function canonicalElements(svg: string): string {
  const tags = svg.match(/<(circle|path|line|rect|polygon|polyline|ellipse|text)[^>]*>/g) ?? [];
  return tags.slice().sort().join('\n');
}

/** The six invariants every flowshape pattern must satisfy. */
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
      // Order-independent (see canonicalElements): catches a pattern whose
      // only seed-driven behaviour is invisible at default params (e.g. a
      // cull that never triggers, or a tie-break among elements that never
      // overlap), where a raw string diff would pass even though Randomize
      // visibly does nothing.
      const a = canonicalElements(render(def, p, 1));
      const b = canonicalElements(render(def, p, 2));
      expect(a).not.toBe(b);
    }, INVARIANT_TIMEOUT_MS);

    it('is seed-invariant when NOT usesSeed', () => {
      if (def.usesSeed) return;
      // The inverse of the check above: a pattern that doesn't declare
      // usesSeed must not actually vary with seed either, or its Randomize
      // button (which randomises params, not seed, for such patterns) would
      // silently misrepresent what a shared/URL-encoded seed does to it.
      const p = defaultParams(def);
      expect(render(def, p, 1)).toBe(render(def, p, 2));
    }, INVARIANT_TIMEOUT_MS);
  });
}
