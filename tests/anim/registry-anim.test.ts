import { describe, it, expect } from 'vitest';
import { definePattern, defaultParams, generateSafe, PHASE_PARAM } from '../../src/patterns/registry';
import { RESERVED } from '../../src/core/reserved';
import { el } from '../../src/core/svg';

function probe(id: string, anim?: { continuous?: string[]; usesPhase?: boolean }) {
  return definePattern({
    id, family: 'curves', phase: 1, heavy: false, anim,
    params: [{ key: 'amp', kind: 'float', min: 0, max: 10, step: 0.1, default: 5, label: 'x.amp' }],
    generate(p) {
      return el('svg', { viewBox: '0 0 10 10' }, [el('circle', { cx: p['phase'] ?? -1, cy: 0, r: 1, fill: 'ink' })]);
    },
  });
}

describe('anim registry metadata', () => {
  it('reserves the animate keys', () => {
    for (const k of ['stage', 'apre', 'aint', 'phase']) expect(RESERVED.has(k)).toBe(true);
  });
  it('injects PHASE_PARAM only for usesPhase patterns, hidden and defaulting to 0', () => {
    const withPhase = probe('t-phase', { usesPhase: true });
    const without = probe('t-nophase');
    expect(withPhase.params.some((p) => p.key === 'phase' && p.hidden === true)).toBe(true);
    expect(without.params.some((p) => p.key === 'phase')).toBe(false);
    expect(defaultParams(withPhase)['phase']).toBe(0);
    expect(PHASE_PARAM.default).toBe(0);
  });
  it('delivers a clamped phase through generateSafe', () => {
    const def = probe('t-phase2', { usesPhase: true });
    const svg = generateSafe(def, { phase: 0.25 }, 1, { w: 10, h: 10 });
    const circle = svg.children[1]!;
    expect(circle.attrs['cx']).toBe(0.25);
  });
  it('rejects anim.continuous keys that are not numeric params', () => {
    expect(() => probe('t-bad', { continuous: ['nope'] })).toThrow(/continuous/);
  });
});
