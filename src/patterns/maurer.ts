import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

const D2R = Math.PI / 180;

export const maurer = definePattern({
  id: 'maurer',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'n', kind: 'int', min: 1, max: 12, step: 1, default: 6, label: 'maurer.n' },
    { key: 'd', kind: 'int', min: 1, max: 359, step: 1, default: 71, label: 'maurer.d' },
    { key: 'strokeWidth', kind: 'float', min: 0.1, max: 3, step: 0.1, default: 0.35, label: 'maurer.strokeWidth' },
    { key: 'envelope', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'maurer.envelope' },
  ],
  generate(p, _seed, size) {
    const n = p['n']!;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.44;
    const walk: string[] = [];
    for (let k = 0; k <= 360; k++) {
      const th = k * p['d']! * D2R;
      const r = R * Math.sin(n * th);
      walk.push(`${k ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(2)} ${(cy + r * Math.sin(th)).toFixed(2)}`);
    }
    const children: SvgNode[] = [];
    if (p['envelope']! === 1) {
      const env: string[] = [];
      for (let k = 0; k <= 1440; k++) {
        const th = k * 0.25 * D2R;
        const r = R * Math.sin(n * th);
        env.push(`${k ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(2)} ${(cy + r * Math.sin(th)).toFixed(2)}`);
      }
      children.push(
        el('path', { d: env.join(''), fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']! * 1.4, opacity: 0.25 }),
      );
    }
    children.push(
      el('path', { d: walk.join(''), fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: 0.8 }),
    );
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
