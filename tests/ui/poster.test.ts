import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { composerModel, composerUrl } from '../../src/ui/poster';
import type { AppState } from '../../src/core/url-state';

const BASE: AppState = {
  patternId: 'voxel', seed: 71203, params: {}, color: {}, lang: 'en', view: 'c', format: 'a3',
};

describe('composerModel', () => {
  it('offers a browsable list of layouts for the chosen format', () => {
    expect(composerModel(BASE)!.variants.length).toBeGreaterThan(10);
  });

  it('offers fewer layouts for a square sheet than for A3', () => {
    const a3 = composerModel(BASE)!;
    const sq = composerModel({ ...BASE, format: 'square' })!;
    expect(sq.variants.length).toBeLessThan(a3.variants.length);
    expect(sq.variants.length).toBeGreaterThan(0);
  });

  it('resolves the stored layout and colorway, and falls back cleanly', () => {
    const m = composerModel({ ...BASE, layout: '3c.s1.d0.a0', cway: 5 })!;
    expect(m.variant.id).toBe('3c.s1.d0.a0');
    expect(m.colorway.index).toBe(5);
    const fallback = composerModel({ ...BASE, layout: 'gone', cway: 999 })!;
    expect(fallback.variant.id).toBe(fallback.variants[0]!.id);
    expect(fallback.colorway.index).toBe(0);
  });

  it('steps layouts and colorways with wraparound', () => {
    const m = composerModel(BASE)!;
    expect(m.stepLayout(-1)).toBe(m.variants[m.variants.length - 1]!.id);
    expect(m.stepColorway(-1)).toBe(m.colorways.length - 1);
    expect(m.stepColorway(1)).toBe(1);
  });

  it('renders the current selection to an SVG string', () => {
    const svg = composerModel(BASE)!.toSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Voxel Form');
  });

  it('drops all text when the state asks for it', () => {
    const svg = composerModel({ ...BASE, notext: true })!.toSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('<text');
  });

  it('only offers layouts that can actually take this pattern name', () => {
    const m = composerModel(BASE)!;
    for (const v of m.variants) expect(m.renderVariant(v).ok, v.id).toBe(true);
  });

  it('returns null for an unknown pattern rather than throwing', () => {
    expect(composerModel({ ...BASE, patternId: 'nope' })).toBeNull();
  });
});

describe('composerUrl', () => {
  it('carries the full playground state into the composer route', () => {
    const url = composerUrl({
      patternId: 'voxel', seed: 71203, params: { grid: 14 },
      color: { hue: 30 }, lang: 'es', format: 'a2',
    });
    expect(url).toContain('#/c/voxel');
    expect(url).toContain('seed=71203');
    expect(url).toContain('format=a2');
    expect(url).toContain('lang=es');
    expect(url).toContain('grid=14');
    expect(url).toContain('hue=30');
  });

  it('starts a fresh composer session rather than inheriting a stale layout', () => {
    const url = composerUrl({ ...BASE, layout: '3c.s2.d1.a1', cway: 7, notext: true });
    expect(url).not.toContain('layout=');
    expect(url).not.toContain('cway=');
    expect(url).not.toContain('notext=');
  });
});
