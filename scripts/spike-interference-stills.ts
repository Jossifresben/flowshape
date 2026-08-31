// Spike-only helper (branch spike/interference): renders interference SVGs
// for visual review, converts each to PNG via headless Chrome, and measures
// generate() time at 1920x1080. Not wired into any npm script; run with
// `npx vite-node scripts/spike-interference-stills.ts <outdir>`.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { interference } from '../src/patterns/interference';
import { defaultParams, generateSafe } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';

const OUT = process.argv[2] ?? '/tmp/interference-stills';
mkdirSync(OUT, { recursive: true });

const CHROME_CANDIDATES = [
  process.env['CHROME'],
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean) as string[];
const chrome = CHROME_CANDIDATES.find((c) => existsSync(c));
if (!chrome) {
  console.error('No Chrome found. Set CHROME=/path/to/chrome and re-run.');
  process.exit(1);
}

// Dark ground: the reference looks (both registers) are shown on dark paper.
const PAL: Palette = { paper: '#0b0b0f', ink: '#dcdce6', accent: '#e3261a' };
const SIZE = { w: 1920, h: 1080 };

function shoot(name: string, params: Record<string, number>, seed: number): void {
  const svg = serialize(generateSafe(interference, params, seed, SIZE), PAL);
  const htmlPath = join(OUT, `${name}.html`);
  const pngPath = join(OUT, `${name}.png`);
  // Wrap in a minimal HTML page sized exactly to SIZE so the screenshot has
  // no ambiguity about intrinsic SVG sizing (a bare .svg file with only a
  // viewBox has no CSS-pixel size Chrome can infer reliably headless).
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${SIZE.w}px;height:${SIZE.h}px;background:${PAL.paper};overflow:hidden}
    svg{display:block;width:${SIZE.w}px;height:${SIZE.h}px}
  </style></head><body>${svg}</body></html>`;
  writeFileSync(htmlPath, html);
  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=${SIZE.w},${SIZE.h}`,
    `--screenshot=${pngPath}`, `file://${htmlPath}`,
  ], { stdio: 'inherit' });
  console.log(`wrote ${pngPath}`);
}

const d = defaultParams(interference);
shoot('01-defaults-seed1', d, 1);
shoot('02-seed2', d, 2);
shoot('03-seed7', d, 7);
shoot('04-seed13', d, 13);
shoot('05-phase25', { ...d, phase: 0.25 }, 1);
shoot('06-phase50', { ...d, phase: 0.5 }, 1);
shoot('07-phase75', { ...d, phase: 0.75 }, 1);
// Calm register: same off-canvas geometry as the dramatic default
// (separation/frequency untouched) — only `lines` and `amplitude` drop, low
// enough that no adjacent pair crosses. Still visibly the same two-source
// sweep, just gentle instead of braided.
shoot('08-calm-register', { ...d, lines: 40, amplitude: 20 }, 1);

// Timing: p50/p99 of generate() at 1920x1080, defaults, over 300 runs
// (varying phase/seed slightly so nothing gets memoized away by accident).
const times: number[] = [];
for (let i = 0; i < 300; i++) {
  const t0 = performance.now();
  generateSafe(interference, { ...d, phase: (i % 100) / 100 }, 1 + (i % 5), SIZE);
  times.push(performance.now() - t0);
}
times.sort((a, b) => a - b);
const p = (q: number): string => times[Math.min(times.length - 1, Math.floor(q * times.length))]!.toFixed(3);
console.log(`generate 1920x1080: p50 ${p(0.5)} ms · p99 ${p(0.99)} ms (n=300, governor 26 ms)`);
