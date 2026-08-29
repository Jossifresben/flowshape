import { describe, it, expect } from 'vitest';
import { regions, artworkSize, renderPoster } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { el, serialize } from '../../src/core/svg';
import type { PosterData } from '../../src/compose/data';

const SH = sheet({ format: 'a3' });
const CW = colorwaysFor({ hue: 250, chroma: 0.08, accentShift: 150 });
const DATA: PosterData = {
  name: 'Voxel Form',
  description: 'A cubic lattice sampled by a density field.',
  seed: 71203,
  formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [
    { key: 'GRID', value: '14' }, { key: 'DENSITY', value: '0.62' },
    { key: 'CUBES', value: '1704' }, { key: 'SEED', value: '71203' },
  ],
};
const ART = el('svg', { viewBox: '0 0 600 848' }, [el('rect', { width: 600, height: 848, fill: 'paper' })]);
const NEUTRAL = { paper: '#000', ink: '#000', accent: '#000' };

function skel(id: string) { return SKELETONS.find((s) => s.id === id)!; }

describe('regions', () => {
  it('splits horizontally with the artwork leading when declared', () => {
    const { art, type } = regions(SH, skel('3a'));
    expect(art.y).toBe(0);
    expect(art.h).toBeCloseTo(SH.h * 0.538, 4);
    expect(type.y).toBeCloseTo(art.h, 4);
    expect(art.h + type.h).toBeCloseTo(SH.h, 4);
  });

  it('splits with the artwork trailing when declared', () => {
    const { art, type } = regions(SH, skel('3c'));
    expect(type.y).toBe(0);
    expect(art.y).toBeCloseTo(SH.h * 0.56, 4);
  });

  it('splits vertically for column layouts', () => {
    const { art, type } = regions(SH, skel('4d'));
    expect(type.x).toBe(0);
    expect(type.w).toBeCloseTo(SH.w * 0.442, 4);
    expect(art.x).toBeCloseTo(type.w, 4);
    expect(art.h).toBe(SH.h);
  });

  it('gives full-field layouts the whole sheet for both regions', () => {
    const { art, type } = regions(SH, skel('3d'));
    expect(art).toEqual({ x: 0, y: 0, w: SH.w, h: SH.h });
    expect(type).toEqual(art);
  });
});

describe('artworkSize', () => {
  it('matches the artwork region aspect with a 600 short edge', () => {
    const size = artworkSize(SH, skel('3a'));
    expect(Math.min(size.w, size.h)).toBe(600);
    const { art } = regions(SH, skel('3a'));
    expect(size.w / size.h).toBeCloseTo(art.w / art.h, 2);
  });
});

describe('renderPoster artwork field', () => {
  const base = { sheet: SH, colorway: CW[0]!, data: DATA, artwork: ART, measure: approxMeasure() };

  it('paints the sheet ground and clips the artwork to its region', () => {
    const r = renderPoster({ ...base, skeleton: skel('3a') });
    expect(r.ok).toBe(true);
    const svg = serialize(r.ok ? r.node : el('g', {}), NEUTRAL);
    expect(svg).toContain(`width="${SH.w}"`);
    expect(svg).toContain(CW[0]!.paper);
    expect(svg).toContain('clipPath');
  });

  it('bakes the artwork palette so inversion is a swap, not a filter', () => {
    const asGen = SKELETONS.find((s) => s.present === 'as-generated')!;
    const inverted = SKELETONS.find((s) => s.present === 'inverted')!;
    const dump = (id: typeof asGen) => {
      const r = renderPoster({ ...base, skeleton: id });
      return serialize(r.ok ? r.node : el('g', {}), NEUTRAL);
    };
    expect(dump(asGen)).not.toBe(dump(inverted));
    expect(dump(asGen)).not.toContain('filter');
    expect(dump(inverted)).not.toContain('filter');
  });

  it('falls back from tinted to inverted on a dark ground, and says so', () => {
    const tinted = SKELETONS.find((s) => s.present === 'tinted')!;
    const dark = CW.find((c) => c.groundLum < 0.45)!;
    const warns: string[] = [];
    renderPoster({ ...base, skeleton: tinted, colorway: dark, onWarn: (m) => warns.push(m) });
    expect(warns.join(' ')).toContain('tinted');
  });

  it('renders every skeleton without throwing', () => {
    for (const s of SKELETONS) {
      const r = renderPoster({ ...base, skeleton: s });
      expect([s.id, typeof r.ok]).toEqual([s.id, 'boolean']);
    }
  });
});
