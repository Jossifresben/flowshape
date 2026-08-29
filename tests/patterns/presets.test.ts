import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern } from '../../src/patterns/registry';
import { PRESETS } from '../../src/patterns/presets';

describe('PRESETS', () => {
  it('every key is a registered pattern id', () => {
    for (const id of Object.keys(PRESETS)) {
      expect(getPattern(id), `PRESETS.${id} is not a registered pattern`).toBeDefined();
    }
  });

  it('every param key exists in that pattern\'s ParamDefs', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      const def = getPattern(id)!;
      const validKeys = new Set(def.params.map((p) => p.key));
      for (const key of Object.keys(preset.params ?? {})) {
        expect(validKeys.has(key), `PRESETS.${id}.${key} is not a param of ${id}`).toBe(true);
      }
    }
  });

  it('every param value is within its ParamDef min/max', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      const def = getPattern(id)!;
      const byKey = new Map(def.params.map((p) => [p.key, p]));
      for (const [key, value] of Object.entries(preset.params ?? {})) {
        const pd = byKey.get(key)!;
        expect(value, `PRESETS.${id}.${key} below min`).toBeGreaterThanOrEqual(pd.min);
        expect(value, `PRESETS.${id}.${key} above max`).toBeLessThanOrEqual(pd.max);
      }
    }
  });
});
