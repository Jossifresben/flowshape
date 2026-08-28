/**
 * Build-time thumbnail generation.
 *
 * Renders every registered pattern once, at a fixed seed/size/palette, to a
 * static SVG file under `public/thumbs/<id>.svg`. Vite copies `public/`
 * verbatim into `dist/`, so these become separately-cacheable static assets
 * that never touch the JS bundle. This runs as a `prebuild` step (see
 * package.json) so `npm run build` always regenerates them, and the output
 * is committed so `npm run dev` works without requiring a prior build.
 *
 * Run with: npx vite-node scripts/build-thumbs.ts
 */
import '../src/patterns/index';
import { listPatterns, generateSafe, defaultParams } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const THUMB_PALETTE: Palette = { paper: '#ffffff', ink: '#1c1b22', accent: '#e3261a' };
const THUMB_SIZE = { w: 240, h: 320 };
const THUMB_SEED = 1;

/** Thumbnails are 240×320; full print density is invisible at that size and costs KB. */
const THUMB_OVERRIDES: Record<string, Record<string, number>> = {
  clifford: { maxDots: 4000 },
  harmonograph: { duration: 260 },
  phyllotaxis: { points: 900 },
};

function build(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const def of listPatterns()) {
    const params = { ...defaultParams(def), ...(THUMB_OVERRIDES[def.id] ?? {}) };
    const node = generateSafe(def, params, THUMB_SEED, THUMB_SIZE);
    out[def.id] = serialize(node, THUMB_PALETTE);
  }
  return out;
}

function main(): void {
  const thumbs = build();
  const ids = Object.keys(thumbs).sort();

  const here = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.join(here, '..', 'public', 'thumbs');
  mkdirSync(outDir, { recursive: true });

  for (const id of ids) {
    writeFileSync(path.join(outDir, `${id}.svg`), thumbs[id], 'utf-8');
  }
  // eslint-disable-next-line no-console
  console.log(`wrote ${ids.length} thumbnails to ${path.relative(process.cwd(), outDir)}`);
}

main();
