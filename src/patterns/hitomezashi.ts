import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

/**
 * Dash-periods of travel per phase cycle. A hitomezashi line's dash pattern
 * — `(j + bit) % 2 === 0` — is 2-cell periodic along the line, so sliding the
 * dashes by a whole number of 2-cell periods maps the field exactly onto
 * itself. That is what makes the drift below a genuine seamless loop rather
 * than an approximate one: at phase 1 the emitted stitch set is identical to
 * phase 0's, bit for bit, with no re-drawing of a single random bit.
 */
const LAPS = 8;
/** Cells of travel per cycle. Two per lap (the dash period is two cells). */
const TRAVEL = LAPS * 2;

export const hitomezashi = definePattern({
  id: 'hitomezashi',
  family: 'tilings',
  phase: 1,
  heavy: false,
  usesSeed: true,
  anim: { continuous: ['strokeWidth', 'size'], usesPhase: true },
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
    // Intrinsic motion: the stitch field scrolls diagonally while the lattice
    // itself — the column and row lines, and the parity fill that marks the
    // pattern's region structure — stays exactly where it is. Vertical
    // stitches slide DOWN their own columns, horizontal stitches slide RIGHT
    // along their own rows: each family travels along the direction it is
    // drawn in, which is the only translation that keeps every stitch on its
    // own grid line. The two families sliding past each other lock back into
    // register every whole cell (four times a cycle at LAPS = 2), alternating
    // between the bit pattern and its exact complement.
    //
    // `% 1` folds phase 1 onto 0, so phase 1 is literally the phase-0
    // expression, and adding a drift of 0 is the exact float identity — the
    // committed snapshots (phase 0, default params) are untouched.
    const drift = ((p['phase'] ?? 0) % 1) * TRAVEL * cell;
    // Stitches that have scrolled out of the drawn band are dropped and the
    // ones scrolling in are picked up, so the field is full at every phase.
    // At drift 0 the extended indices all fall outside the band, leaving the
    // original emission order exactly as it was.
    const bandY = oy + rows * cell;
    const bandX = ox + cols * cell;
    let d = '';
    for (let i = 0; i <= cols; i++) for (let j = -TRAVEL; j < rows; j++) {
      if (((j + cb[i]!) % 2 + 2) % 2 !== 0) continue;
      const y0 = oy + j * cell + drift;
      const y1 = oy + (j + 1) * cell + drift;
      if (y1 - 1 <= oy || y0 + 1 >= bandY) continue;
      d += `M${ox + i * cell} ${y0 + 1}V${y1 - 1}`;
    }
    for (let j = 0; j <= rows; j++) for (let i = -TRAVEL; i < cols; i++) {
      if (((i + rb[j]!) % 2 + 2) % 2 !== 0) continue;
      const x0 = ox + i * cell + drift;
      const x1 = ox + (i + 1) * cell + drift;
      if (x1 - 1 <= ox || x0 + 1 >= bandX) continue;
      d += `M${x0 + 1} ${oy + j * cell}H${x1 - 1}`;
    }
    children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, 'stroke-linecap': 'round' }));
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
