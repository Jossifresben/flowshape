import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

const D2R = Math.PI / 180;

/** Long parallel lines at angle `angleDeg`, spaced `spacing` apart, covering the whole frame. */
function gratingLines(
  cx: number,
  cy: number,
  angleDeg: number,
  spacing: number,
  diag: number,
): string[] {
  const a = angleDeg * D2R;
  const cos = Math.cos(a), sin = Math.sin(a);
  const paths: string[] = [];
  const half = diag / 2;
  for (let off = -half; off <= half; off += spacing) {
    // Base line runs perpendicular to `a`, offset along `a` by `off`, spanning `-half..half`.
    const bx = cx + off * cos, by = cy + off * sin;
    const x0 = bx - half * sin, y0 = by + half * cos;
    const x1 = bx + half * sin, y1 = by - half * cos;
    paths.push(`M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`);
  }
  return paths;
}

/** Concentric circles of spacing `spacing` centred at (ox, oy), covering radius up to `maxR`. */
function gratingCircles(ox: number, oy: number, spacing: number, maxR: number): SvgNode[] {
  const out: SvgNode[] = [];
  for (let r = spacing; r <= maxR; r += spacing) {
    out.push(el('circle', { cx: ox.toFixed(2), cy: oy.toFixed(2), r: r.toFixed(2), fill: 'none' }));
  }
  return out;
}

export const moire = definePattern({
  id: 'moire',
  family: 'fields',
  phase: 1,
  heavy: false,
  usesSeed: false,
  anim: { continuous: ['angleB', 'spacingB', 'offset', 'strokeWidth', 'size'] },
  params: [
    { key: 'mode', kind: 'enum', min: 0, max: 1, step: 1, default: 0, label: 'moire.mode', options: ['moire.lines', 'moire.circles'] },
    { key: 'spacingA', kind: 'float', min: 4, max: 40, step: 0.1, default: 9, label: 'moire.spacingA' },
    { key: 'spacingB', kind: 'float', min: 4, max: 40, step: 0.1, default: 9.6, label: 'moire.spacingB' },
    { key: 'angleA', kind: 'float', min: 0, max: 180, step: 1, default: 0, label: 'moire.angleA' },
    { key: 'angleB', kind: 'float', min: 0, max: 180, step: 1, default: 6, label: 'moire.angleB' },
    { key: 'offset', kind: 'float', min: 0, max: 200, step: 1, default: 60, label: 'moire.offset' },
    { key: 'strokeWidth', kind: 'float', min: 0.15, max: 1.5, step: 0.05, default: 0.4, label: 'moire.strokeWidth' },
  ],
  generate(p, _seed, size) {
    const cx = size.w / 2, cy = size.h / 2;
    const sw = p['strokeWidth']!;
    const children: SvgNode[] = [];

    if (p['mode']! === 0) {
      const diag = Math.hypot(size.w, size.h);
      const a = gratingLines(cx, cy, p['angleA']!, p['spacingA']!, diag);
      const b = gratingLines(cx, cy, p['angleB']!, p['spacingB']!, diag);
      for (const d of a) children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': sw }));
      for (const d of b) children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': sw }));
    } else {
      const maxR = Math.hypot(size.w, size.h) * 0.6;
      const off = p['offset']!;
      const a = gratingCircles(cx - off / 2, cy, p['spacingA']!, maxR);
      const b = gratingCircles(cx + off / 2, cy, p['spacingB']!, maxR);
      for (const c of a) children.push({ ...c, attrs: { ...c.attrs, stroke: 'ink', 'stroke-width': sw } });
      for (const c of b) children.push({ ...c, attrs: { ...c.attrs, stroke: 'ink', 'stroke-width': sw } });
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
