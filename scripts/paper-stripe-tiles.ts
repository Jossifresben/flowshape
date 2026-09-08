/**
 * Numbers and figures for docs/paper/stripe-tiles.md — every figure in the
 * paper is a URL state of the app, and every number here is recomputed from
 * the registry, never typed in. Run: npx vite-node scripts/paper-stripe-tiles.ts
 */
import '../src/patterns/index';
import { bauhaus, buildCells, traceChains } from '../src/patterns/bauhaus';
import { defaultParams, generateSafe } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';
import { substance } from '../tests/anim/coverage';
import { writeFileSync, mkdirSync } from 'node:fs';

const PAL: Palette = { paper: '#ffffff', ink: '#111111', accent: '#e3261a' };
const S = { w: 600, h: 600 };
const base = defaultParams(bauhaus);
type St = Record<string, number>;
const STATES: Record<string, St> = {
  // Figure 1: one seed, one alphabet, four placements
  'fig1a-free': { ...base, motif: 0, symmetry: 0, repeat: 0, cell: 100, stripes: 3, width: 0.5, tilt: 0, accentEvery: 0 },
  'fig1b-pmm':  { ...base, motif: 0, symmetry: 1, repeat: 2, cell: 100, stripes: 3, width: 0.5, tilt: 0, accentEvery: 0 },
  'fig1c-p4m':  { ...base, motif: 0, symmetry: 2, repeat: 2, cell: 100, stripes: 3, width: 0.5, tilt: 0, accentEvery: 0 },
  'fig1d-p4':   { ...base, motif: 0, symmetry: 3, repeat: 2, cell: 100, stripes: 3, width: 0.5, tilt: 0, accentEvery: 0 },
  // Figure 2: arcs only — Smith's tile with four stripes, every fourth chain in accent
  'fig2-chains': { ...base, motif: 1, symmetry: 0, repeat: 0, cell: 120, stripes: 4, width: 0.32, tilt: 0, accentEvery: 4 },
  // Figure 3: discs under pmm at three phases
  'fig3a-phase0':   { ...base, motif: 2, symmetry: 1, repeat: 2, cell: 100, stripes: 8, width: 0.45, tilt: 0, accentEvery: 0, phase: 0 },
  'fig3b-phase025': { ...base, motif: 2, symmetry: 1, repeat: 2, cell: 100, stripes: 8, width: 0.45, tilt: 0, accentEvery: 0, phase: 0.25 },
  'fig3c-phase05':  { ...base, motif: 2, symmetry: 1, repeat: 2, cell: 100, stripes: 8, width: 0.45, tilt: 0, accentEvery: 0, phase: 0.5 },
  // Figure 4: the pipes rolling — dead-end chains under phase
  'fig4a-pipes0':  { ...base, motif: 0, symmetry: 0, repeat: 0, cell: 75, stripes: 4, width: 0.5, tilt: 0, accentEvery: 0, phase: 0 },
  'fig4b-pipes03': { ...base, motif: 0, symmetry: 0, repeat: 0, cell: 75, stripes: 4, width: 0.5, tilt: 0, accentEvery: 0, phase: 0.3 },
};
const SEED = 7;
mkdirSync('docs/paper/figures', { recursive: true });
for (const [name, st] of Object.entries(STATES)) {
  const node = generateSafe(bauhaus, st, SEED, S);
  node.attrs['width'] = 1200; node.attrs['height'] = 1200;
  writeFileSync(`docs/paper/figures/${name}.svg`, serialize(node, PAL));
}
// URL for each figure state (the caption is the reproduction recipe)
const url = (st: St): string => {
  const q = Object.entries(st).filter(([k]) => k !== 'size').map(([k, v]) => `${k}=${v}`).join('&');
  return `https://flowshape.art/#/p/bauhaus?v=1&seed=${SEED}&${q}`;
};
// Chain statistics for the figure states and the paper's table
const ACROSS = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]] as const;
function stats(st: St, seed: number, w = S.w, h = S.h) {
  const cell = st['cell']!; const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
  const cells = buildCells(st, seed, cols, rows); const chains = traceChains(cells, cols, rows);
  const cellAt = (I: number, J: number) => (I < 0 || J < 0 || I >= cols || J >= rows ? null : cells[J * cols + I]!);
  const border = (I: number, J: number, side: number) => { const [dI, dJ] = ACROSS[side]!; return cellAt(I + dI, J + dJ) === null; };
  let open = 0, closed = 0, deadEnds = 0, borderEnds = 0, segments = 0;
  for (const c of chains) {
    segments += c.steps.length;
    if (c.closed) { closed++; continue; }
    open++;
    const f = c.steps[0]!, l = c.steps[c.steps.length - 1]!;
    for (const [I, J, side] of [[f.cell.I, f.cell.J, f.sin], [l.cell.I, l.cell.J, l.sout]] as const) { if (border(I, J, side)) borderEnds++; else deadEnds++; }
  }
  const frozen = chains.filter((c) => c.frozen).length;
  return { cols, rows, cells: cells.length, segments, chains: chains.length, open, closed, borderEnds, deadEnds, frozen };
}
const out: Record<string, unknown> = {};
for (const [name, st] of Object.entries(STATES)) out[name] = { url: url(st), ...stats(st, SEED) };
// Table: the invariant test's grid (10×14) across motifs, summed over three seeds
const table: Record<string, unknown>[] = [];
for (const [label, motif] of [['pipes', 0], ['chevrons', 4], ['hatch', 6], ['knot', 7]] as const) {
  for (const [sym, symmetry] of [['free', 0], ['pmm', 1], ['p4', 3]] as const) {
    const acc = { chains: 0, open: 0, closed: 0, deadEnds: 0, borderEnds: 0, frozen: 0 };
    for (const seed of [1, 7, 42]) { const s = stats({ ...base, motif, symmetry, repeat: 0, cell: 60 }, seed, 600, 840); for (const k of Object.keys(acc) as (keyof typeof acc)[]) acc[k] += s[k]; }
    table.push({ motif: label, symmetry: sym, seeds: 3, ...acc });
  }
}
out['table'] = table;
// Lateral motion: largest frame-to-frame change in total ink across one cycle, figure-3 state, 200 samples
{
  const st = STATES['fig3a-phase0']!; const inks: number[] = [];
  for (let i = 0; i <= 200; i++) inks.push(substance(generateSafe(bauhaus, { ...st, phase: i / 200 }, SEED, S), S.w, S.h).ink);
  let max = 0; for (let i = 0; i < 200; i++) max = Math.max(max, Math.abs(inks[i + 1]! - inks[i]!) / inks[i]!);
  out['fig3_max_frame_ink_change_pct'] = Math.round(max * 10000) / 100;
  const a = serialize(generateSafe(bauhaus, { ...st, phase: 0 }, SEED, S), PAL), b = serialize(generateSafe(bauhaus, { ...st, phase: 1 }, SEED, S), PAL);
  out['fig3_phase1_equals_phase0'] = a === b;
}
writeFileSync('docs/paper/figures/numbers.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
