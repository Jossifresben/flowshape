import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

export const hitomezashi = definePattern({
  id: 'hitomezashi',
  family: 'tilings',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'cell', kind: 'int', min: 8, max: 30, step: 1, default: 12, label: 'hitomezashi.cell' },
    { key: 'bitChance', kind: 'float', min: 0.2, max: 0.8, step: 0.01, default: 0.5, label: 'hitomezashi.bitChance' },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 4, step: 0.1, default: 0.7, label: 'hitomezashi.strokeWidth' },
    { key: 'fillParity', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'hitomezashi.fillParity' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'hitomezashi'));
    const cell = p['cell']!;
    const cols = Math.floor(size.w / cell);
    const rows = Math.floor(size.h / cell);
    const ox = (size.w - cols * cell) / 2;
    const oy = (size.h - rows * cell) / 2;
    const cb: number[] = [], rb: number[] = [];
    for (let i = 0; i <= cols; i++) cb.push(rnd() < p['bitChance']! ? 1 : 0);
    for (let j = 0; j <= rows; j++) rb.push(rnd() < p['bitChance']! ? 1 : 0);
    const children: SvgNode[] = [];
    if (p['fillParity']! === 1) {
      const xc = [0]; for (let i = 0; i < cols; i++) xc.push(xc[i]! ^ cb[i]!);
      const yr = [0]; for (let j = 0; j < rows; j++) yr.push(yr[j]! ^ rb[j]!);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if ((xc[i]! ^ yr[j]!) === 1) {
          children.push(el('rect', { x: ox + i * cell, y: oy + j * cell, width: cell, height: cell, fill: 'accent', opacity: 0.25 }));
        }
      }
    }
    let d = '';
    for (let i = 0; i <= cols; i++) for (let j = 0; j < rows; j++) {
      if ((j + cb[i]!) % 2 === 0) {
        d += `M${ox + i * cell} ${oy + j * cell + 1}V${oy + (j + 1) * cell - 1}`;
      }
    }
    for (let j = 0; j <= rows; j++) for (let i = 0; i < cols; i++) {
      if ((i + rb[j]!) % 2 === 0) {
        d += `M${ox + i * cell + 1} ${oy + j * cell}H${ox + (i + 1) * cell - 1}`;
      }
    }
    children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, 'stroke-linecap': 'round' }));
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
