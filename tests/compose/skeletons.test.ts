import { describe, it, expect } from 'vitest';
import { SKELETONS } from '../../src/compose/skeletons';
import { validate, fitsSheet } from '../../src/compose/regions';

describe('skeletons', () => {
  it('ships the eight approved reference layouts', () => {
    expect(SKELETONS.map((s) => s.id)).toEqual(['3a', '3b', '3c', '3d', '4a', '4b', '4c', '4d']);
  });

  it('every shipped skeleton is legal under the validator', () => {
    for (const s of SKELETONS) expect([s.id, validate(s)]).toEqual([s.id, []]);
  });

  it('covers A3 with several layouts and landscape with at least one', () => {
    expect(SKELETONS.filter((s) => fitsSheet(s, 1.414)).length).toBeGreaterThanOrEqual(6);
    expect(SKELETONS.filter((s) => fitsSheet(s, 0.71)).length).toBeGreaterThanOrEqual(1);
    expect(SKELETONS.filter((s) => fitsSheet(s, 1.0)).length).toBeGreaterThanOrEqual(1);
  });

  it('keeps one layout with no accent at all', () => {
    expect(SKELETONS.filter((s) => s.accent === 'none' && s.altAccent === undefined)).toHaveLength(1);
  });

  it('marks the band layouts as one-line-title layouts', () => {
    for (const s of SKELETONS) {
      if (s.title === 'banded') expect(s.oneLineTitle).toBe(true);
    }
  });

  it('demands a scrim wherever type sits on full-bleed artwork', () => {
    for (const s of SKELETONS) {
      if (s.artwork === 'full') expect(s.scrim).toBe(true);
    }
  });
});
