import { describe, it, expect } from 'vitest';
import { renderPoster } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { el, serialize } from '../../src/core/svg';
import type { Skeleton } from '../../src/compose/regions';
import type { PosterData } from '../../src/compose/data';

const SH = sheet({ format: 'a3' });
const CW = colorwaysFor({ hue: 250, chroma: 0.08, accentShift: 150 });
const ART = el('svg', { viewBox: '0 0 600 848' }, [el('rect', { width: 600, height: 848, fill: 'paper' })]);
const DATA: PosterData = {
  name: 'Voxel Form', description: 'A cubic lattice sampled by a density field.',
  seed: 71203, formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [{ key: 'GRID', value: '14' }, { key: 'SEED', value: '71203' }],
};
const NEUTRAL = { paper: '#000', ink: '#000', accent: '#000' };

function dumpSkeleton(over: Partial<Skeleton>, base = '3a'): string {
  const s = { ...SKELETONS.find((k) => k.id === base)!, ...over };
  const r = renderPoster({ sheet: SH, skeleton: s, colorway: CW[0]!, data: DATA, artwork: ART, measure: approxMeasure() });
  if (!r.ok) throw new Error(r.error);
  return serialize(r.node, NEUTRAL);
}

describe('accent marks', () => {
  it('renders exactly one accent mark, never two', () => {
    const out = dumpSkeleton({ accent: 'rule' });
    expect(out.split(CW[0]!.accent).length - 1).toBe(1);
  });

  it('renders the seed for the numeral mode, not a decorative index', () => {
    expect(dumpSkeleton({ accent: 'numeral' })).toContain('71203');
  });

  it('renders the form label for the code mode', () => {
    expect(dumpSkeleton({ accent: 'code' })).toContain('VOXEL');
  });

  it('puts no accent on the sheet at all for the none mode', () => {
    expect(dumpSkeleton({ accent: 'none' })).not.toContain(CW[0]!.accent);
  });
});

describe('scrim', () => {
  it('lays a gradient over full-bleed artwork, and only there', () => {
    const full = SKELETONS.find((s) => s.artwork === 'full')!;
    const r = renderPoster({ sheet: SH, skeleton: full, colorway: CW[0]!, data: DATA, artwork: ART, measure: approxMeasure() });
    const out = serialize(r.ok ? r.node : el('g', {}), NEUTRAL);
    expect(out).toContain('linearGradient');
    expect(dumpSkeleton({})).not.toContain('linearGradient');
  });
});

describe('decoration', () => {
  it('draws four crop marks when the variant asks for them', () => {
    const on = dumpSkeleton({ decoration: { cropMarks: true, verticalCaption: false } });
    const off = dumpSkeleton({ decoration: { cropMarks: false, verticalCaption: false } });
    expect(on.split('crop-mark').length - 1).toBe(4);
    expect(off).not.toContain('crop-mark');
  });

  it('sets the vertical caption rotated, from real fields', () => {
    const on = dumpSkeleton({ decoration: { cropMarks: false, verticalCaption: true } });
    expect(on).toContain('rotate(-90');
    expect(on).toContain('VOXEL');
  });
});
