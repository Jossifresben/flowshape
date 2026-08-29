import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, type AppState } from '../../src/core/url-state';

const state: AppState = {
  patternId: 'phyllotaxis',
  seed: 71203,
  params: { points: 1500, angle: 137.51 },
  color: { hue: 40, chroma: 0.08, paperL: 0.2, accentShift: 30 },
  lang: 'es',
};

describe('url state', () => {
  it('round-trips', () => {
    const hash = encodeState(state);
    expect(decodeState(hash)).toEqual(state);
  });

  it('decodes hex overrides and omits empty fields', () => {
    const s: AppState = { ...state, color: { bg: '131a2b' }, lang: 'en' };
    const hash = encodeState(s);
    expect(hash).not.toContain('pal=');
    expect(hash).not.toContain('lang=');  // en is default, omitted
    expect(decodeState(hash)).toEqual(s);
  });

  it('returns null for an unknown route shape', () => {
    expect(decodeState('#/nope')).toBeNull();
    expect(decodeState('')).toBeNull();
  });

  it('survives garbage params (clamping happens later, decoding never throws)', () => {
    const s = decodeState('#/p/phyllotaxis?v=1&seed=abc&points=<script>&angle=12');
    expect(s).not.toBeNull();
    expect(s!.seed).toBe(1); // non-numeric seed falls back to 1
    expect(s!.params['angle']).toBe(12);
    expect(s!.params['points']).toBeUndefined(); // non-numeric dropped
  });

  it('returns null (never throws) on malformed percent-escapes', () => {
    expect(decodeState('#/p/%')).toBeNull();
    expect(decodeState('#/p/%E0%A4%A')).toBeNull();
    expect(decodeState('#/p/%C0%80')).toBeNull();
  });

  it('ignores params that collide with reserved keys', () => {
    const hash = encodeState({ ...state, params: { seed: 7, angle: 12 } });
    expect(decodeState(hash)!.seed).toBe(71203);
    expect(decodeState(hash)!.params).toEqual({ angle: 12 });
  });

  it('silently ignores a stale theme= param from an old shared link', () => {
    const s = decodeState('#/p/girih?theme=light&seed=3');
    expect(s).not.toBeNull();
    expect(s).not.toHaveProperty('theme');
    expect(s!.params).not.toHaveProperty('theme');
    expect(s!.params).toEqual({});
  });

  it('round-trips a custom format', () => {
    const s: AppState = { ...state, format: 'custom', cw: 30, ch: 40, cu: 'cm' };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it('omits the default format and rejects a bad unit', () => {
    const hash = encodeState({ ...state, format: 'a3' });
    expect(hash).not.toContain('format=');
    const bad = decodeState('#/p/girih?v=1&format=custom&cw=10&ch=10&cu=furlongs');
    expect(bad!.cu).toBeUndefined();
    expect(bad!.params['cw']).toBeUndefined(); // reserved, never a pattern param
  });
});

describe('animate view state', () => {
  it('round-trips an animate URL', () => {
    const s = decodeState(encodeState({
      patternId: 'harmonograph', seed: 9, params: { detune: 0.01 }, color: {}, lang: 'en',
      view: 'a', stage: '916', apre: 'pulse', aint: 0.7,
    }))!;
    expect(s.view).toBe('a');
    expect(s.stage).toBe('916');
    expect(s.apre).toBe('pulse');
    expect(s.aint).toBeCloseTo(0.7);
    expect(s.params['detune']).toBeCloseTo(0.01);
  });
  it('leaves poster URLs byte-identical to before', () => {
    const hash = encodeState({ patternId: 'moire', seed: 2, params: {}, color: {}, lang: 'en' });
    expect(hash.startsWith('#/p/moire?')).toBe(true);
    expect(hash).not.toContain('stage');
    const s = decodeState(hash)!;
    expect(s.view).toBeUndefined();
  });
  it('rejects garbage stage/aint values', () => {
    const s = decodeState('#/a/moire?v=1&seed=1&stage=4x3&aint=7')!;
    expect(s.view).toBe('a');
    expect(s.stage).toBeUndefined();
    expect(s.aint).toBe(1);
  });
  it('round-trips the colour toggle and omits it when off', () => {
    const on = decodeState(encodeState({
      patternId: 'harmonograph', seed: 9, params: {}, color: {}, lang: 'en',
      view: 'a', acol: true,
    }))!;
    expect(on.acol).toBe(true);
    const hashOff = encodeState({
      patternId: 'harmonograph', seed: 9, params: {}, color: {}, lang: 'en',
      view: 'a', acol: false,
    });
    expect(hashOff).not.toContain('acol');
    const off = decodeState(hashOff)!;
    expect(off.acol).toBeUndefined();
  });
});
