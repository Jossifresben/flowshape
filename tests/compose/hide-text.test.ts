import { describe, it, expect } from 'vitest';
import { renderPoster } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { variantsFor } from '../../src/compose/variants';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { el, serialize } from '../../src/core/svg';
import type { PosterData } from '../../src/compose/data';

const SH = sheet({ format: 'a3' });
const CW = colorwaysFor({ hue: 250, chroma: 0.09, accentShift: 150 });
const ART = el('svg', { viewBox: '0 0 600 848' }, [
  el('rect', { width: 600, height: 848, fill: 'paper' }),
  el('circle', { cx: 300, cy: 400, r: 120, stroke: 'ink', fill: 'none' }),
]);
const DATA: PosterData = {
  name: 'Voxel Form', description: 'A cubic lattice sampled by a density field.',
  seed: 71203, formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [{ key: 'GRID', value: '14' }, { key: 'SEED', value: '71203' }],
};
const NEUTRAL = { paper: '#000', ink: '#000', accent: '#000' };

function dump(id: string, hideText: boolean): string {
  const s = SKELETONS.find((k) => k.id === id)!;
  const r = renderPoster({ sheet: SH, skeleton: s, colorway: CW[0]!, data: DATA, artwork: ART, measure: approxMeasure(), hideText });
  if (!r.ok) throw new Error(r.error);
  return serialize(r.node, NEUTRAL);
}

describe('hideText', () => {
  it('emits no text element at all, in every layout', () => {
    for (const s of SKELETONS) {
      expect(dump(s.id, true), s.id).not.toContain('<text');
    }
  });

  it('keeps the artwork and the composition it sits in', () => {
    for (const s of SKELETONS) {
      const out = dump(s.id, true);
      expect(out, s.id).toContain('<circle');
      expect(out, s.id).toContain(CW[0]!.paper);
      expect(out.startsWith('<svg'), s.id).toBe(true);
    }
  });

  it('keeps geometric marks and drops textual ones', () => {
    // A rule belongs to the layout; a numeral and a code are text by another name.
    const ruled = SKELETONS.find((s) => s.accent === 'rule')!;
    expect(dump(ruled.id, true)).toContain(CW[0]!.accent);
    const numeral = SKELETONS.find((s) => s.accent === 'numeral')!;
    expect(dump(numeral.id, true)).not.toContain('71203');
  });

  it('keeps the layout exactly, only without the text', () => {
    // The artwork must stay in its own region rather than absorbing the empty
    // type region: the layout the user browsed to is the thing to preserve.
    const bedHeight = (out: string) => {
      const re = new RegExp(`<rect x="[\\d.]+" y="[\\d.]+" width="[\\d.]+" height="([\\d.]+)" fill="${CW[0]!.ink}"`);
      const m = re.exec(out);
      if (!m) throw new Error('no artwork bed found');
      return Number(m[1]);
    };
    for (const s of SKELETONS) {
      if (s.present !== 'as-generated' || s.artwork === 'full') continue;
      expect(bedHeight(dump(s.id, true)), s.id).toBeCloseTo(bedHeight(dump(s.id, false)), 4);
    }
  });

  it('keeps crop marks but drops the vertical caption', () => {
    const decorated = SKELETONS.find((s) => s.decoration.cropMarks && s.decoration.verticalCaption)!;
    const out = dump(decorated.id, true);
    expect(out.split('crop-mark').length - 1).toBe(4);
    expect(out).not.toContain('SEED');
  });

  it('keeps accent grounds, which are fields rather than text', () => {
    const grounded = SKELETONS.find((s) => s.accent === 'ground')!;
    expect(dump(grounded.id, true)).toContain(CW[0]!.ground);
  });

  it('renders a layout whose title would not fit, because there is no title', () => {
    const banded = SKELETONS.find((s) => s.oneLineTitle)!;
    const long = { ...DATA, name: 'Extraordinarily Overlong Pattern Name Indeed' };
    const opts = { sheet: SH, skeleton: banded, colorway: CW[0]!, data: long, artwork: ART, measure: approxMeasure() };
    expect(renderPoster(opts).ok).toBe(false);
    expect(renderPoster({ ...opts, hideText: true }).ok).toBe(true);
  });

  it('holds across every variant and format', () => {
    for (const format of ['a3', 'square', 'letter']) {
      const sh = sheet({ format });
      for (const v of variantsFor(SKELETONS, sh.ratio)) {
        const r = renderPoster({ sheet: sh, skeleton: v.skeleton, colorway: CW[3]!, data: DATA, artwork: ART, measure: approxMeasure(), hideText: true });
        expect(r.ok, v.id).toBe(true);
        if (r.ok) expect(serialize(r.node, NEUTRAL), v.id).not.toContain('<text');
      }
    }
  });
});
