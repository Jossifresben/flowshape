import { describe, it, expect } from 'vitest';
import { definePattern, getPattern, listPatterns, defaultParams, clampParams, generateSafe } from '../../src/patterns/registry';
import { el } from '../../src/core/svg';

const dummy = definePattern({
  id: 'dummy',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'n', kind: 'int', min: 1, max: 10, step: 1, default: 3, label: 'param.n' },
    { key: 'wobble', kind: 'float', min: 0, max: 1, step: 0.01, default: 0.5, label: 'param.wobble' },
  ],
  generate: (p, _seed, size) => el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }),
});

describe('registry', () => {
  it('registers and retrieves by id', () => {
    expect(getPattern('dummy')).toBe(dummy);
    expect(listPatterns().map((p) => p.id)).toContain('dummy');
  });

  it('returns undefined for unknown ids', () => {
    expect(getPattern('nope')).toBeUndefined();
  });

  it('builds default params from defs', () => {
    expect(defaultParams(dummy)).toEqual({ n: 3, wobble: 0.5, size: 1 });
  });
});

describe('clampParams', () => {
  it('clamps to range, rounds ints, defaults NaN/missing', () => {
    expect(clampParams(dummy, { n: 99, wobble: -3 })).toEqual({ n: 10, wobble: 0, size: 1 });
    expect(clampParams(dummy, { n: 4.7 })).toEqual({ n: 5, wobble: 0.5, size: 1 });
    expect(clampParams(dummy, { n: NaN, wobble: 0.25 })).toEqual({ n: 3, wobble: 0.25, size: 1 });
  });
});

describe('generateSafe', () => {
  it('clamps raw params before generating', () => {
    let seen: Record<string, number> = {};
    const probe = definePattern({
      id: 'probe-safe',
      family: 'curves',
      phase: 1,
      heavy: false,
      params: [{ key: 'n', kind: 'int', min: 1, max: 10, step: 1, default: 3, label: 'x' }],
      generate: (p, _s, size) => {
        seen = { ...p };
        return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` });
      },
    });
    generateSafe(probe, { n: 99 }, 1, { w: 10, h: 10 });
    expect(seen).toEqual({ n: 10 });
  });
});

const kinds = definePattern({
  id: 'kinds-probe',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'flag', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'x' },
    { key: 'mode', kind: 'enum', min: 0, max: 2, step: 1, default: 0, label: 'x', options: ['a', 'b', 'c'] },
  ],
  generate: (_p, _s, size) => el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }),
});

describe('bool/enum kinds', () => {
  it('clamps bool to 0/1 and enum to option range', () => {
    expect(clampParams(kinds, { flag: 0.7, mode: 9 })).toEqual({ flag: 1, mode: 2, size: 1 });
    expect(clampParams(kinds, { flag: 0.2, mode: -1 })).toEqual({ flag: 0, mode: 0, size: 1 });
    expect(clampParams(kinds, {})).toEqual({ flag: 1, mode: 0, size: 1 });
  });
});

describe('reserved keys', () => {
  it('rejects params with reserved keys', () => {
    expect(() =>
      definePattern({
        id: 'bad-reserved',
        family: 'curves',
        phase: 1,
        heavy: false,
        params: [{ key: 'seed', kind: 'int', min: 0, max: 1, step: 1, default: 0, label: 'x' }],
        generate: (_p, _s, size) => el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }),
      }),
    ).toThrow(/reserved/);
  });
});
