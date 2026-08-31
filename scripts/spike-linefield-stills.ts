// Spike-only helper (branch spike/linefield): renders linefield SVGs for
// visual review and measures generate() time at 1920x1080. Not wired into
// any npm script; run with `vite-node scripts/spike-linefield-stills.ts <outdir>`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { linefield } from '../src/patterns/linefield';
import { defaultParams, generateSafe } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';

const OUT = process.argv[2] ?? '/tmp/linefield-stills';
mkdirSync(OUT, { recursive: true });

// Dark ground per the brief: #111 paper, light-gray ink.
const PAL: Palette = { paper: '#111111', ink: '#c8c8c8', accent: '#e3261a' };
const SIZE = { w: 1920, h: 1080 };

function shoot(name: string, params: Record<string, number>, seed: number): void {
  const svg = serialize(generateSafe(linefield, params, seed, SIZE), PAL);
  writeFileSync(join(OUT, `${name}.svg`), svg);
  console.log(`${name}.svg  (${(svg.length / 1024).toFixed(0)} KB)`);
}

const d = defaultParams(linefield);
shoot('defaults-seed1', d, 1);
shoot('seed2', d, 2);
shoot('seed3', d, 3);
shoot('seed7', d, 7);
shoot('phase25', { ...d, phase: 0.25 }, 1);
shoot('phase50', { ...d, phase: 0.5 }, 1);
shoot('phase75', { ...d, phase: 0.75 }, 1);
shoot('degenerate-swirl0-wav0', { ...d, swirl: 0, waviness: 0 }, 1);

// Timing: p50/p99 of generate() at 1920x1080, defaults.
const times: number[] = [];
for (let i = 0; i < 200; i++) {
  const t0 = performance.now();
  generateSafe(linefield, { ...d, phase: (i % 100) / 100 }, 1 + (i % 5), SIZE);
  times.push(performance.now() - t0);
}
times.sort((a, b) => a - b);
const p = (q: number): string => times[Math.min(times.length - 1, Math.floor(q * times.length))]!.toFixed(2);
console.log(`generate 1920x1080: p50 ${p(0.5)} ms · p99 ${p(0.99)} ms (n=200, governor 26 ms)`);
