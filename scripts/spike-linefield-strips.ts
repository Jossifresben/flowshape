// Spike-only helper (branch spike/field-patterns): renders a phase strip
// (0, 1/8, 1/4, 3/8, 1/2) of linefield as one HTML page for a headless-Chrome
// screenshot, and prints motion metrics — per-stroke angular travel across the
// cycle — so "does it actually move" is a number, not a feeling.
// Run: `npx vite-node scripts/spike-linefield-strips.ts <outdir> [seed]`,
// then screenshot <outdir>/strip.html with headless Chrome.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { linefield } from '../src/patterns/linefield';
import { defaultParams, generateSafe } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';

const OUT = process.argv[2] ?? '/tmp/linefield-strips';
const SEED = Number(process.argv[3] ?? 5);
mkdirSync(OUT, { recursive: true });

const PAL: Palette = { paper: '#111111', ink: '#c8c8c8', accent: '#e3261a' };
const SIZE = { w: 960, h: 540 };
const STRIP_PHASES = [0, 0.125, 0.25, 0.375, 0.5];

const d = defaultParams(linefield);
const svgAt = (ph: number): string =>
  serialize(generateSafe(linefield, { ...d, phase: ph }, SEED, SIZE), PAL);

// --- strip page -----------------------------------------------------------
const cells = STRIP_PHASES.map((ph) =>
  `<figure style="margin:0"><div style="width:576px">${svgAt(ph)
    .replace('<svg ', '<svg style="width:576px;height:324px;display:block" ')
  }</div><figcaption style="font:12px monospace;color:#888;padding:2px 4px">ph=${ph}</figcaption></figure>`,
).join('');
writeFileSync(join(OUT, 'strip.html'),
  `<body style="margin:0;background:#000;display:flex;gap:4px">${cells}</body>`);
console.log(`strip.html written (seed ${SEED}) — screenshot at 2916x352`);

// --- motion metrics -------------------------------------------------------
// Axial angle per stroke (mod π), sampled at 16 phases; travel = Σ|Δθ| with
// deltas wrapped to (−π/2, π/2]. A stroke is "visibly moving" if its total
// travel across the cycle exceeds 0.35 rad (~20°).
function angles(svg: string): number[] {
  const out: number[] = [];
  for (const m of svg.matchAll(/x1="([^"]*)" y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"/g)) {
    const a = Math.atan2(Number(m[4]) - Number(m[2]), Number(m[3]) - Number(m[1]));
    out.push(((a % Math.PI) + Math.PI) % Math.PI);
  }
  return out;
}
const NPH = 16;
const frames = Array.from({ length: NPH + 1 }, (_, i) => angles(svgAt(i / NPH)));
const n = frames[0]!.length;
const travel = new Float64Array(n);
const dev = new Float64Array(n); // max deviation from the phase-0 orientation
for (let f = 1; f <= NPH; f++) {
  for (let i = 0; i < n; i++) {
    let dd = frames[f]![i]! - frames[f - 1]![i]!;
    if (dd > Math.PI / 2) dd -= Math.PI;
    if (dd < -Math.PI / 2) dd += Math.PI;
    travel[i] = travel[i]! + Math.abs(dd);
    let d0 = frames[f]![i]! - frames[0]![i]!;
    if (d0 > Math.PI / 2) d0 -= Math.PI;
    if (d0 < -Math.PI / 2) d0 += Math.PI;
    dev[i] = Math.max(dev[i]!, Math.abs(d0));
  }
}
const sorted = [...travel].sort((a, b) => a - b);
const mean = travel.reduce((s, v) => s + v, 0) / n;
const meanDev = dev.reduce((s, v) => s + v, 0) / n;
const THRESH = 0.35;
const moving = travel.filter((v) => v > THRESH).length;
console.log(`strokes ${n} · mean travel ${mean.toFixed(3)} rad · median ${sorted[Math.floor(n / 2)]!.toFixed(3)} · p10 ${sorted[Math.floor(n * 0.1)]!.toFixed(3)}`);
console.log(`mean max-deviation from ph0 ${meanDev.toFixed(3)} rad`);
console.log(`moving (travel > ${THRESH} rad): ${moving}/${n} = ${((100 * moving) / n).toFixed(1)}%`);
