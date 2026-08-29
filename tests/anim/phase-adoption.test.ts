import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };
const ADOPTERS = ['harmonograph', 'phyllotaxis', 'helix'];

describe.each(ADOPTERS)('%s phase', (id) => {
  it('declares usesPhase', () => {
    expect(getPattern(id)!.anim?.usesPhase).toBe(true);
  });
  it('phase=0 matches the no-phase render exactly', () => {
    const def = getPattern(id)!;
    const a = serialize(generateSafe(def, defaultParams(def), 7, SIZE), PAL);
    const b = serialize(generateSafe(def, { ...defaultParams(def), phase: 0 }, 7, SIZE), PAL);
    expect(b).toBe(a);
  });
  it('phase=0.3 changes the geometry', () => {
    const def = getPattern(id)!;
    const a = serialize(generateSafe(def, defaultParams(def), 7, SIZE), PAL);
    const b = serialize(generateSafe(def, { ...defaultParams(def), phase: 0.3 }, 7, SIZE), PAL);
    expect(b).not.toBe(a);
  });
});
