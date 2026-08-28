import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

/** Known-good sets from paulbourke.net/fractals/clifford. */
const SETS: [number, number, number, number][] = [
  [-1.4, 1.6, 1.0, 0.7],
  [1.6, -0.6, -1.2, 1.6],
  [1.7, 1.7, 0.6, 1.2],
  [1.5, -1.8, 1.6, 0.9],
  [-1.7, 1.3, -0.1, -1.2],
  [-1.7, 1.8, -1.9, -0.4],
  [-1.8, -2.0, -0.5, -0.9],
];

export const clifford = definePattern({
  id: 'clifford',
  family: 'attractors',
  phase: 1,
  heavy: false,
  params: [
    { key: 'variant', kind: 'enum', min: 0, max: 6, step: 1, default: 4, label: 'clifford.variant', options: ['clifford.v1', 'clifford.v2', 'clifford.v3', 'clifford.v4', 'clifford.v5', 'clifford.v6', 'clifford.v7'] },
    { key: 'iterations', kind: 'int', min: 20000, max: 200000, step: 5000, default: 120000, label: 'clifford.iterations' },
    { key: 'maxDots', kind: 'int', min: 4000, max: 12000, step: 500, default: 12000, label: 'clifford.maxDots' },
    { key: 'dotSize', kind: 'float', min: 0.3, max: 1.5, step: 0.05, default: 0.55, label: 'clifford.dotSize' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.45, label: 'clifford.opacity' },
  ],
  generate(p, _seed, size) {
    const [a, b, c, d] = SETS[p['variant']!]!;
    const iters = p['iterations']!;
    const keepEvery = Math.max(1, Math.floor(iters / p['maxDots']!));
    const sx = (size.w * 0.44) / (1 + Math.abs(c));
    const sy = (size.h * 0.44) / (1 + Math.abs(d));
    const cx = size.w / 2, cy = size.h / 2;
    let x = 0.1, y = 0.1;
    const children: SvgNode[] = [];
    for (let i = 0; i < iters; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx; y = ny;
      if (i > 100 && i % keepEvery === 0) {
        children.push(el('circle', {
          cx: cx + x * sx,
          cy: cy + y * sy,
          r: p['dotSize']!,
          fill: 'ink',
          opacity: p['opacity']!,
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
