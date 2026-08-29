import { describe, it, expect } from 'vitest';
import { renderPoster, artworkSize, QR_TARGET } from '../../src/compose/render';
import { encodeQr } from '../../src/compose/qr';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { colorwaysFor } from '../../src/compose/colorways';
import { approxMeasure } from '../../src/compose/measure';
import { el, type SvgNode } from '../../src/core/svg';
import type { PosterData } from '../../src/compose/data';

const SH = sheet({ format: 'a3' });
const CW = colorwaysFor({ hue: 250, chroma: 0.09, accentShift: 150 });
const DATA: PosterData = {
  name: 'Voxel Form', description: 'A cubic lattice sampled by a density field.',
  seed: 71203, formLabel: 'VOXEL', modeLabel: 'ISOMETRIC',
  params: [{ key: 'GRID', value: '14' }, { key: 'SEED', value: '71203' }],
};

function render(id: string, hideText = false): SvgNode {
  const s = SKELETONS.find((k) => k.id === id)!;
  const art = el('svg', {}, [el('rect', { width: 600, height: 848, fill: 'paper' })]);
  void artworkSize(SH, s);
  const r = renderPoster({ sheet: SH, skeleton: s, colorway: CW[0]!, data: DATA, artwork: art, measure: approxMeasure(), hideText });
  if (!r.ok) throw new Error(r.error);
  return r.node;
}

function findQr(node: SvgNode): SvgNode | null {
  if (node.attrs['class'] === 'qr') return node;
  for (const c of node.children) {
    const hit = findQr(c);
    if (hit) return hit;
  }
  return null;
}

/**
 * Reconstruct the symbol from the drawn rectangles alone — module size and
 * origin are derived from the geometry, not from the renderer's constants — so
 * this catches an offset, a wrong scale or an inverted symbol, none of which
 * the encoder test can see.
 */
function readBack(qr: SvgNode, ink: string): boolean[][] {
  const mods = qr.children.filter((n) => n.tag === 'rect' && n.attrs['fill'] === ink);
  expect(mods.length).toBeGreaterThan(0);
  const size = Math.min(...mods.map((m) => Number(m.attrs['width'])));
  const x0 = Math.min(...mods.map((m) => Number(m.attrs['x'])));
  const y0 = Math.min(...mods.map((m) => Number(m.attrs['y'])));
  const n = encodeQr(QR_TARGET).size;
  const grid = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  for (const m of mods) {
    const c = Math.round((Number(m.attrs['x']) - x0) / size);
    const r = Math.round((Number(m.attrs['y']) - y0) / size);
    if (r >= 0 && r < n && c >= 0 && c < n) grid[r]![c] = true;
  }
  return grid;
}

describe('QR on the sheet', () => {
  it('appears on every layout', () => {
    for (const s of SKELETONS) expect(findQr(render(s.id)), s.id).not.toBeNull();
  });

  it('renders the exact symbol the encoder produces', () => {
    const expected = encodeQr(QR_TARGET).modules;
    for (const s of SKELETONS) {
      const qr = findQr(render(s.id))!;
      expect(readBack(qr, CW[0]!.ink), s.id).toEqual(expected);
    }
  });

  it('sits on its own plate so it never lands on the artwork', () => {
    for (const s of SKELETONS) {
      const qr = findQr(render(s.id))!;
      const plate = qr.children[0]!;
      expect(plate.tag, s.id).toBe('rect');
      expect(plate.attrs['fill'], s.id).toBe(CW[0]!.paper);
      // The plate has to cover every module it backs.
      const mods = qr.children.filter((n) => n.attrs['fill'] === CW[0]!.ink && n.tag === 'rect');
      const px = Number(plate.attrs['x']);
      const pw = Number(plate.attrs['width']);
      for (const m of mods) {
        expect(Number(m.attrs['x'])).toBeGreaterThanOrEqual(px);
        expect(Number(m.attrs['x']) + Number(m.attrs['width'])).toBeLessThanOrEqual(px + pw + 0.05);
      }
    }
  });

  it('prints the wordmark under it', () => {
    const qr = findQr(render('3a'))!;
    expect(qr.children.some((n) => n.text === 'flowshape.art')).toBe(true);
  });

  it('goes away with the rest of the text', () => {
    for (const s of SKELETONS) expect(findQr(render(s.id, true)), s.id).toBeNull();
  });
});
