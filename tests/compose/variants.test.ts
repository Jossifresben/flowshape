import { describe, it, expect } from 'vitest';
import { variantsFor, findVariant } from '../../src/compose/variants';
import { SKELETONS } from '../../src/compose/skeletons';
import { validate } from '../../src/compose/regions';

describe('variantsFor', () => {
  it('produces a browsable list for A3', () => {
    const vs = variantsFor(SKELETONS, 1.414);
    expect(vs.length).toBeGreaterThan(40);
    expect(vs.length).toBeLessThan(200);
  });

  it('never emits an invalid variant', () => {
    for (const ratio of [1.414, 1.0, 0.71, 1.292, 1.548]) {
      for (const v of variantsFor(SKELETONS, ratio)) {
        expect([v.id, validate(v.skeleton)]).toEqual([v.id, []]);
      }
    }
  });

  it('filters by sheet ratio', () => {
    const a3 = variantsFor(SKELETONS, 1.414);
    const land = variantsFor(SKELETONS, 0.71);
    expect(land.length).toBeLessThan(a3.length);
    expect(land.length).toBeGreaterThan(0);
    const ids = new Set(land.map((v) => v.skeleton.id));
    expect(ids.has('3a')).toBe(false);
    expect(ids.has('3d')).toBe(true);
  });

  it('is deterministic and stable in order', () => {
    expect(variantsFor(SKELETONS, 1.414).map((v) => v.id))
      .toEqual(variantsFor(SKELETONS, 1.414).map((v) => v.id));
    expect(variantsFor(SKELETONS, 1.414)[0]!.id).toBe('3a.s0.d0.a0');
  });

  it('shows every distinct layout before repeating one', () => {
    // Consecutive steps must change the layout, not a detail of it: nesting by
    // skeleton made the first several steps look identical to each other.
    const vs = variantsFor(SKELETONS, 1.414);
    const fitting = SKELETONS.filter((s) => vs.some((v) => v.skeleton.id === s.id)).length;
    const firstPass = vs.slice(0, fitting).map((v) => v.skeleton.id);
    expect(new Set(firstPass).size).toBe(fitting);
  });

  it('keeps every id unique', () => {
    const ids = variantsFor(SKELETONS, 1.414).map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('varies split, decoration and accent within one skeleton', () => {
    const mine = variantsFor(SKELETONS, 1.414).filter((v) => v.skeleton.id === '3c');
    expect(new Set(mine.map((v) => v.skeleton.split)).size).toBe(3);
    expect(new Set(mine.map((v) => v.skeleton.decoration.cropMarks)).size).toBe(2);
    expect(new Set(mine.map((v) => v.skeleton.accent)).size).toBe(2);
  });

  it('gives full-bleed layouts one split position, not three', () => {
    const mine = variantsFor(SKELETONS, 1.414).filter((v) => v.skeleton.id === '3d');
    expect(new Set(mine.map((v) => v.skeleton.split)).size).toBe(1);
  });
});

describe('findVariant', () => {
  it('resolves a stored id, and falls back to the first when it is gone', () => {
    const vs = variantsFor(SKELETONS, 1.414);
    expect(findVariant(vs, '3c.s1.d0.a0')!.id).toBe('3c.s1.d0.a0');
    expect(findVariant(vs, 'nope')).toBeUndefined();
    expect(findVariant(vs, undefined)).toBeUndefined();
  });
});
