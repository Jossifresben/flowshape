import { describe, it, expect } from 'vitest';
import { definePattern, getPattern, listPatterns, defaultParams, clampParams } from '../../src/patterns/registry';
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
    expect(defaultParams(dummy)).toEqual({ n: 3, wobble: 0.5 });
  });
});

describe('clampParams', () => {
  it('clamps to range, rounds ints, defaults NaN/missing', () => {
    expect(clampParams(dummy, { n: 99, wobble: -3 })).toEqual({ n: 10, wobble: 0 });
    expect(clampParams(dummy, { n: 4.7 })).toEqual({ n: 5, wobble: 0.5 });
    expect(clampParams(dummy, { n: NaN, wobble: 0.25 })).toEqual({ n: 3, wobble: 0.25 });
  });
});
