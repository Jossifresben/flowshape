import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, type AppState } from '../../src/core/url-state';

const state: AppState = {
  patternId: 'phyllotaxis',
  seed: 71203,
  params: { points: 1500, angle: 137.51 },
  color: { pal: 'navy-gold' },
  theme: 'light',
  lang: 'es',
};

describe('url state', () => {
  it('round-trips (light theme, explicit in the URL)', () => {
    const hash = encodeState(state);
    expect(hash).toContain('theme=light');
    expect(decodeState(hash)).toEqual(state);
  });

  it('round-trips (dark theme, omitted from the URL as default)', () => {
    const s: AppState = { ...state, theme: 'dark' };
    const hash = encodeState(s);
    expect(hash).not.toContain('theme=');
    expect(decodeState(hash)).toEqual(s);
  });

  it('decodes hex overrides and omits empty fields', () => {
    const s: AppState = { ...state, color: { bg: '131a2b' }, theme: 'dark', lang: 'en' };
    const hash = encodeState(s);
    expect(hash).not.toContain('pal=');
    expect(hash).not.toContain('theme='); // dark is default, omitted
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
});
