import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, RESERVED, type AppState } from '../../src/core/url-state';
import { posterFilename } from '../../src/poster/export';

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

const BASE: AppState = {
  patternId: 'voxel', seed: 71203, params: { grid: 14 }, color: {}, lang: 'en',
};

describe('composer state', () => {
  it('reserves the composer keys so a pattern can never claim them', () => {
    expect(RESERVED.has('cway')).toBe(true);
    expect(RESERVED.has('notext')).toBe(true);
    expect(RESERVED.has('layout')).toBe(true);
  });

  it('round-trips the composer route with its layout, colorway and text flag', () => {
    const s: AppState = { ...BASE, view: 'c', layout: '3c.s1.d0.a0', cway: 5, notext: true, format: 'a2' };
    const back = decodeState(encodeState(s))!;
    expect(back.view).toBe('c');
    expect(back.layout).toBe('3c.s1.d0.a0');
    expect(back.cway).toBe(5);
    expect(back.notext).toBe(true);
    expect(back.format).toBe('a2');
    expect(back.params['grid']).toBe(14);
  });

  it('keeps the playground and animate routes untouched', () => {
    expect(encodeState(BASE).startsWith('#/p/')).toBe(true);
    expect(encodeState({ ...BASE, view: 'c' }).startsWith('#/c/')).toBe(true);
    expect(decodeState('#/p/voxel?v=1&seed=1')!.view).toBeUndefined();
  });

  it('omits composer keys from non-composer routes', () => {
    const url = encodeState({ ...BASE, view: 'p', layout: '3c.s0.d0.a0', cway: 4, notext: true });
    expect(url).not.toContain('layout=');
    expect(url).not.toContain('cway=');
    expect(url).not.toContain('notext=');
  });

  it('leaves the text flag out of the URL when it is off', () => {
    expect(encodeState({ ...BASE, view: 'c', notext: false })).not.toContain('notext=');
  });

  it('ignores a nonsense colorway index rather than throwing', () => {
    expect(decodeState('#/c/voxel?v=1&seed=1&cway=abc')!.cway).toBeUndefined();
    expect(decodeState('#/c/voxel?v=1&seed=1&cway=-3')!.cway).toBeUndefined();
  });
});

describe('posterFilename', () => {
  it('follows the handover naming scheme', () => {
    expect(posterFilename('voxel', 71203, '3a.s0.d0.a0', 'png'))
      .toBe('flowshape-voxel-71203-3a.s0.d0.a0.png');
  });
});
