import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

export const timestable = definePattern({
  id: 'timestable',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'chords', kind: 'int', min: 100, max: 600, step: 10, default: 400, label: 'timestable.chords' },
    { key: 'multiplier', kind: 'float', min: 2, max: 100, step: 0.05, default: 34, label: 'timestable.multiplier' },
    { key: 'strokeWidth', kind: 'float', min: 0.1, max: 2, step: 0.05, default: 0.35, label: 'timestable.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.05, max: 1, step: 0.01, default: 0.28, label: 'timestable.opacity' },
    { key: 'showCircle', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'timestable.showCircle' },
  ],
  generate(p, _seed, size) {
    const N = p['chords']!;
    const M = p['multiplier']!;
    const cx = size.w / 2, cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.34;
    const pt = (k: number): [number, number] => {
      const a = (2 * Math.PI * k) / N - Math.PI / 2;
      return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    };
    let d = '';
    for (let k = 0; k < N; k++) {
      const [x1, y1] = pt(k);
      const [x2, y2] = pt((k * M) % N);
      d += `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }
    const children: SvgNode[] = [
      el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: p['opacity']! }),
    ];
    if (p['showCircle']! === 1) {
      children.push(el('circle', { cx, cy, r: R, fill: 'none', stroke: 'ink', 'stroke-width': 1, opacity: 0.5 }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
