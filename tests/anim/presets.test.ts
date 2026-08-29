import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns } from '../../src/patterns/registry';
import { PRESETS_BY_PATTERN } from '../../src/anim/presets';

describe('anim presets', () => {
  it('every registered pattern has at least one preset', () => {
    for (const def of listPatterns()) {
      expect(PRESETS_BY_PATTERN[def.id]?.length, def.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every preset references only real params with legal shapes', () => {
    for (const [pid, presets] of Object.entries(PRESETS_BY_PATTERN)) {
      const def = getPattern(pid);
      expect(def, pid).toBeDefined();
      for (const pre of presets) {
        expect(pre.label.en.length).toBeGreaterThan(0);
        expect(pre.label.es.length).toBeGreaterThan(0);
        for (const r of pre.routes) {
          const pd = def!.params.find((p) => p.key === r.param);
          expect(pd, `${pid}/${pre.id}: ${r.param}`).toBeDefined();
          expect(['float', 'int']).toContain(pd!.kind);
          expect(Math.abs(r.depth)).toBeLessThanOrEqual(1);
        }
        if (def!.heavy) expect(pre.routes.length, `${pid} is heavy`).toBe(0);
        const ev = pre.event;
        if (ev) {
          expect(ev.everyBeats).toBeGreaterThanOrEqual(1);
          if (ev.kind === 'flip') expect(def!.params.find((p) => p.key === ev.param)?.kind).toBe('bool');
          if (ev.kind === 'step') {
            const pd = def!.params.find((p) => p.key === ev.param);
            expect(pd, `${pid}/${pre.id}: step ${ev.param}`).toBeDefined();
            expect(['int', 'float', 'enum']).toContain(pd!.kind);
          }
          if (ev.kind === 'reseed') expect(def!.usesSeed, `${pid}: reseed needs usesSeed`).toBe(true);
        }
      }
    }
  });
  it('heavy patterns always carry an event (their only animation channel)', () => {
    for (const def of listPatterns().filter((d) => d.heavy)) {
      for (const pre of PRESETS_BY_PATTERN[def.id]!) expect(pre.event, def.id).toBeDefined();
    }
  });
});
