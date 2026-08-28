import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

export const bands = definePattern({
  id: 'bands',
  family: 'curves',
  phase: 1,
  heavy: false,
  usesSeed: false,
  params: [
    { key: 'bandCount', kind: 'int', min: 3, max: 14, step: 1, default: 7, label: 'bands.bandCount' },
    { key: 'minThickness', kind: 'float', min: 2, max: 40, step: 1, default: 6, label: 'bands.minThickness' },
    { key: 'maxThickness', kind: 'float', min: 10, max: 120, step: 1, default: 54, label: 'bands.maxThickness' },
    { key: 'growthExponent', kind: 'float', min: 0.4, max: 3, step: 0.05, default: 1.6, label: 'bands.growthExponent' },
    { key: 'gap', kind: 'float', min: 0, max: 30, step: 1, default: 8, label: 'bands.gap' },
    { key: 'startAngle', kind: 'float', min: 0, max: 360, step: 1, default: 180, label: 'bands.startAngle' },
    { key: 'sweepAngle', kind: 'float', min: 30, max: 360, step: 1, default: 180, label: 'bands.sweepAngle' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 10, step: 1, default: 0, label: 'bands.accentEvery' },
  ],
  generate(p, _seed, size) {
    const n = p['bandCount']!;
    const minT = p['minThickness']!;
    const maxT = p['maxThickness']!;
    const growth = p['growthExponent']!;
    const gap = p['gap']!;
    const startAngle = p['startAngle']!;
    const sweepAngle = p['sweepAngle']!;
    const accentEvery = p['accentEvery']!;
    const cx = size.w / 2, cy = size.h / 2;

    // First pass: compute thicknesses and raw (unscaled) radii, starting at 0.
    const thicknesses: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = minT + (maxT - minT) * (i / Math.max(1, n - 1)) ** growth;
      thicknesses.push(t);
    }
    const r0s: number[] = [];
    const r1s: number[] = [];
    let running = 0;
    for (let i = 0; i < n; i++) {
      const t = thicknesses[i]!;
      r0s.push(running);
      r1s.push(running + t);
      running += t + gap;
    }
    const totalExtent = running - gap; // outer edge of the last band
    const maxAllowed = 0.46 * Math.min(size.w, size.h);
    const scale = totalExtent > 0 ? maxAllowed / totalExtent : 1;

    const a0 = (startAngle * Math.PI) / 180;
    const a1 = ((startAngle + sweepAngle) * Math.PI) / 180;
    const large = sweepAngle > 180 ? 1 : 0;
    const pt = (r: number, a: number): string =>
      `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;

    const children: SvgNode[] = [];
    for (let i = 0; i < n; i++) {
      const r0 = r0s[i]! * scale;
      const r1 = r1s[i]! * scale;
      const d = `M${pt(r1, a0)}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${large} 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0.toFixed(2)} ${r0.toFixed(2)} 0 ${large} 0 ${pt(r0, a0)}Z`;
      const accent = accentEvery > 0 && (i + 1) % accentEvery === 0;
      children.push(el('path', {
        d,
        fill: accent ? 'accent' : 'ink',
        stroke: 'none',
      }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
