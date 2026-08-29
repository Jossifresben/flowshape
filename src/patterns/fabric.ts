import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { deriveSeed } from '../core/prng';
import { fbm2D } from '../core/noise';

export const fabric = definePattern({
  id: 'fabric',
  family: 'fields',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'gridSize', kind: 'int', min: 20, max: 80, step: 1, default: 46, label: 'fabric.gridSize' },
    { key: 'warpAmount', kind: 'float', min: 0, max: 80, step: 1, default: 34, label: 'fabric.warpAmount' },
    { key: 'noiseScale', kind: 'float', min: 1, max: 10, step: 0.1, default: 3.5, label: 'fabric.noiseScale' },
    { key: 'mode', kind: 'enum', min: 0, max: 1, step: 1, default: 0, label: 'fabric.mode', options: ['fabric.dots', 'fabric.mesh'] },
    { key: 'dotSize', kind: 'float', min: 0.4, max: 4, step: 0.05, default: 1.2, label: 'fabric.dotSize' },
    { key: 'strokeWidth', kind: 'float', min: 0.15, max: 1.5, step: 0.05, default: 0.4, label: 'fabric.strokeWidth' },
  ],
  generate(p, seed, size) {
    const noise = fbm2D(deriveSeed(seed, 'fabric'), 2);
    const g = p['gridSize']!;
    const margin = 20;
    const w = size.w - margin * 2, h = size.h - margin * 2;
    const s = p['noiseScale']! / Math.min(size.w, size.h);
    const warp = p['warpAmount']!;

    // Lattice of (gridSize x gridSize) points, warped in-place.
    const px: number[][] = [];
    const py: number[][] = [];
    for (let j = 0; j < g; j++) {
      px.push([]);
      py.push([]);
      for (let i = 0; i < g; i++) {
        const x = margin + (g === 1 ? 0 : (i / (g - 1)) * w);
        const y = margin + (g === 1 ? 0 : (j / (g - 1)) * h);
        const nx = noise(x * s, y * s);
        const ny = noise(x * s + 5.2, y * s + 1.3);
        px[j]!.push(x + warp * nx);
        py[j]!.push(y + warp * ny);
      }
    }

    const children: SvgNode[] = [];
    if (p['mode']! === 0) {
      const r = p['dotSize']!;
      for (let j = 0; j < g; j++) {
        for (let i = 0; i < g; i++) {
          children.push(el('circle', {
            cx: px[j]![i]!.toFixed(2),
            cy: py[j]![i]!.toFixed(2),
            r: r.toFixed(2),
            fill: 'ink',
            stroke: 'none',
          }));
        }
      }
    } else {
      const sw = p['strokeWidth']!;
      for (let j = 0; j < g; j++) {
        let d = '';
        for (let i = 0; i < g; i++) {
          d += `${i ? 'L' : 'M'}${px[j]![i]!.toFixed(2)} ${py[j]![i]!.toFixed(2)}`;
        }
        children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': sw }));
      }
      for (let i = 0; i < g; i++) {
        let d = '';
        for (let j = 0; j < g; j++) {
          d += `${j ? 'L' : 'M'}${px[j]![i]!.toFixed(2)} ${py[j]![i]!.toFixed(2)}`;
        }
        children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': sw }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
