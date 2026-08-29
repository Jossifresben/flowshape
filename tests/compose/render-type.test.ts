import { describe, it, expect } from 'vitest';
import { renderPoster } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { el, serialize } from '../../src/core/svg';
import type { PosterData } from '../../src/compose/data';

const SH = sheet({ format: 'a3' });
const CW = colorwaysFor({ hue: 250, chroma: 0.08, accentShift: 150 });
const ART = el('svg', { viewBox: '0 0 600 848' }, [el('rect', { width: 600, height: 848, fill: 'paper' })]);
const DATA: PosterData = {
  name: 'Voxel Form', description: 'A cubic lattice sampled by a density field.',
  seed: 71203, formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [
    { key: 'GRID', value: '14' }, { key: 'DENSITY', value: '0.62' },
    { key: 'CUBES', value: '1704' }, { key: 'SEED', value: '71203' },
  ],
};
const NEUTRAL = { paper: '#000', ink: '#000', accent: '#000' };

function dump(id: string, data: PosterData = DATA): string {
  const s = SKELETONS.find((k) => k.id === id)!;
  const r = renderPoster({ sheet: SH, skeleton: s, colorway: CW[0]!, data, artwork: ART, measure: approxMeasure() });
  if (!r.ok) throw new Error(`render failed: ${r.error}`);
  return serialize(r.node, NEUTRAL);
}

describe('title block', () => {
  it('sets the title, tight and bold, in every layout that shows one', () => {
    for (const s of SKELETONS) {
      const out = dump(s.id);
      expect(out, s.id).toContain('Voxel');
      expect(out, s.id).toContain('font-weight="700"');
      expect(out, s.id).toContain('letter-spacing="-0.045em"');
    }
  });

  it('renders the description where the layout has one, and omits it on a tint', () => {
    expect(dump('3a')).toContain('cubic lattice');
    // 4c drops body copy by design: it would sit on the accent and fail 4.5:1.
    expect(dump('4c')).not.toContain('cubic lattice');
  });

  it('uppercases mono labels in the render, not in the data', () => {
    expect(DATA.modeLabel).toBe('ISOMETRIC');
    expect(dump('3d')).toContain('MODE: ISOMETRIC');
  });

  it('gives every numeric run tabular figures so values do not shift by seed', () => {
    expect(dump('3c')).toContain('font-variant-numeric="tabular-nums"');
  });

  it('fails the render rather than ellipsing an unfittable name', () => {
    const s = SKELETONS.find((k) => k.oneLineTitle)!;
    const long = { ...DATA, name: 'Extraordinarily Overlong Pattern Name Indeed' };
    const r = renderPoster({ sheet: SH, skeleton: s, colorway: CW[0]!, data: long, artwork: ART, measure: approxMeasure() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('title-needs-one-line');
  });
});

describe('data block', () => {
  it('renders the four-column parameter grid only where the layout declares it', () => {
    expect(dump('3c')).toContain('DENSITY');
    expect(dump('3a')).not.toContain('DENSITY');
  });

  it('keeps four columns when there are fewer than four params', () => {
    const thin = { ...DATA, params: [{ key: 'GRID', value: '14' }] };
    const out = dump('3c', thin);
    expect(out).toContain('GRID');
    expect(out).not.toContain('DENSITY');
  });

  it('renders the form and mode pair where the layout declares it', () => {
    expect(dump('4d')).toContain('FORM: VOXEL');
    expect(dump('4d')).toContain('MODE: ISOMETRIC');
  });

  it('paints an accent field only where a layout asks for one', () => {
    expect(dump('3b')).toContain(CW[0]!.ground);
    expect(dump('4b')).toContain(CW[0]!.ground);
    expect(dump('3a')).not.toContain(CW[0]!.ground);
  });
});
