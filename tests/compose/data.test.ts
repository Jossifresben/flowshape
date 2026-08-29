import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams } from '../../src/patterns/registry';
import { posterData } from '../../src/compose/data';
import type { AppState } from '../../src/core/url-state';

function stateFor(id: string, over: Partial<AppState> = {}): AppState {
  const def = getPattern(id)!;
  return { patternId: id, seed: 71203, params: defaultParams(def), color: {}, lang: 'en', ...over };
}

describe('posterData', () => {
  it('takes the name from the gallery table and the blurb from the language', () => {
    const def = getPattern('voxel')!;
    expect(posterData(def, stateFor('voxel')).name).toBe('Voxel Form');
    expect(posterData(def, stateFor('voxel', { lang: 'es' })).description)
      .toContain('malla cúbica');
  });

  it('derives the labels from real fields, not an invented taxonomy', () => {
    const def = getPattern('voxel')!;
    const d = posterData(def, stateFor('voxel'));
    expect(d.formLabel).toBe('VOXEL');
    expect(d.modeLabel).toBe(def.family.toUpperCase());
  });

  it('renders at most four params and never the injected ones', () => {
    for (const id of ['voxel', 'truchet', 'phyllotaxis']) {
      const def = getPattern(id)!;
      const d = posterData(def, stateFor(id));
      expect(d.params.length).toBeLessThanOrEqual(4);
      expect(d.params.map((p) => p.key)).not.toContain('SIZE');
      expect(d.params.map((p) => p.key)).not.toContain('PHASE');
    }
  });

  it('includes the seed only where the pattern consumes it', () => {
    for (const id of ['voxel', 'truchet', 'phyllotaxis']) {
      const def = getPattern(id)!;
      const keys = posterData(def, stateFor(id)).params.map((p) => p.key);
      expect(keys.includes('SEED')).toBe(def.usesSeed === true);
    }
  });

  it('leaves series code, index and meta unset in v1', () => {
    const d = posterData(getPattern('voxel')!, stateFor('voxel'));
    expect(d.seriesCode).toBeUndefined();
    expect(d.index).toBeUndefined();
    expect(d.meta).toBeUndefined();
  });

  it('always carries the seed, whether or not the pattern consumes it', () => {
    for (const id of ['voxel', 'truchet', 'phyllotaxis']) {
      expect(posterData(getPattern(id)!, stateFor(id)).seed).toBe(71203);
    }
  });

  it('truncates an over-long description at a word boundary', () => {
    const def = getPattern('voxel')!;
    const d = posterData(def, stateFor('voxel'));
    expect(d.description.length).toBeLessThanOrEqual(141);
  });
});
