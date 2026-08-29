import { describe, it, expect } from 'vitest';
import { renderPoster } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { variantsFor } from '../../src/compose/variants';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { truncateDescription } from '../../src/compose/text';
import { el, serialize } from '../../src/core/svg';
import type { PosterData } from '../../src/compose/data';

const ART = el('svg', { viewBox: '0 0 600 848' }, [el('rect', { width: 600, height: 848, fill: 'paper' })]);
const CW = colorwaysFor({ hue: 250, chroma: 0.12, accentShift: 150 });
const FORMATS = ['a3', 'a4', 'letter', 'tabloid', 'square', 'in24x36'];
const NEUTRAL = { paper: '#000', ink: '#000', accent: '#000' };

const base: PosterData = {
  name: 'Voxel Form', description: 'A cubic lattice sampled by a density field.',
  seed: 71203, formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [
    { key: 'GRID', value: '14' }, { key: 'DENSITY', value: '0.62' },
    { key: 'CUBES', value: '1704' }, { key: 'SEED', value: '71203' },
  ],
};

const FIXTURES: Array<[string, PosterData]> = [
  ['nominal', base],
  ['four-word name', { ...base, name: 'Warped Differential Growth Field' }],
  ['one-word name', { ...base, name: 'Harmonograph' }],
  ['200-char description', { ...base, description: truncateDescription('lattice '.repeat(30).trim()) }],
  ['one param', { ...base, params: [{ key: 'GRID', value: '14' }] }],
  ['no params', { ...base, params: [] }],
  ['empty description', { ...base, description: '' }],
];

describe('overflow fixtures', () => {
  for (const format of FORMATS) {
    const sh = sheet({ format });
    const variants = variantsFor(SKELETONS, sh.ratio);

    it(`offers at least one layout for ${format}`, () => {
      expect(variants.length).toBeGreaterThan(0);
    });

    for (const [label, data] of FIXTURES) {
      it(`${format} / ${label}: every variant either renders or fails loudly`, () => {
        for (const v of variants) {
          for (const c of [CW[0]!, CW[5]!]) {
            const r = renderPoster({ sheet: sh, skeleton: v.skeleton, colorway: c, data, artwork: ART, measure: approxMeasure() });
            if (r.ok) {
              const out = serialize(r.node, NEUTRAL);
              expect(out.startsWith('<svg'), `${v.id} produced no svg`).toBe(true);
              expect(out, `${v.id} left an undefined in the output`).not.toContain('undefined');
              expect(out, `${v.id} left a NaN in the output`).not.toContain('NaN');
            } else {
              expect(['title-too-long', 'title-needs-one-line']).toContain(r.error);
            }
          }
        }
      });
    }
  }

  it('never truncates a description with an ellipsis mid-word', () => {
    const out = truncateDescription('supercalifragilistic '.repeat(12).trim(), 140);
    expect(out.endsWith('…')).toBe(true);
    expect(out.replace('…', '').trim().split(' ').pop()).toBe('supercalifragilistic');
  });

  it('keeps at least one layout renderable for every fixture on A3', () => {
    const sh = sheet({ format: 'a3' });
    const variants = variantsFor(SKELETONS, sh.ratio);
    for (const [label, data] of FIXTURES) {
      const any = variants.some((v) =>
        renderPoster({ sheet: sh, skeleton: v.skeleton, colorway: CW[0]!, data, artwork: ART, measure: approxMeasure() }).ok);
      expect(any, `no layout survives ${label}`).toBe(true);
    }
  });
});
