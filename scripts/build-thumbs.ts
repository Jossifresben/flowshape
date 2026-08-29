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
import { serialize } from '../src/core/svg';
import { resolvePalette } from '../src/poster/palettes';
import { PRESETS } from '../src/patterns/presets';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const THUMB_SIZE = { w: 240, h: 320 };
const THUMB_SEED = 1;

/** Thumbnails are 240×320; full print density is invisible at that size and costs KB. */
const THUMB_OVERRIDES: Record<string, Record<string, number>> = {
  harmonograph: { duration: 260 },
  phyllotaxis: { points: 900 },
};

/**
 * When a pattern has a curated preset (see `presets.ts`), the thumbnail
 * renders that hand-tuned state — preset params merged over the defaults,
 * the preset's own seed, and the preset's colour — instead of the bare
 * defaults. A preset WINS over the THUMB_OVERRIDES density caps: the card is a
 * sample of the state you get when you click it, so it must not diverge from
 * it. The caps still apply to patterns with no preset, where they exist purely
 * to keep file size down and no artistic intent is being contradicted.
 */
function build(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const def of listPatterns()) {
    const preset = PRESETS[def.id];
    const params = preset
      ? { ...defaultParams(def), ...(preset.params ?? {}) }
      : { ...defaultParams(def), ...(THUMB_OVERRIDES[def.id] ?? {}) };
    const seed = preset?.seed ?? THUMB_SEED;
    const palette = resolvePalette(preset?.color ?? {});
    const node = generateSafe(def, params, seed, THUMB_SIZE);
    out[def.id] = serialize(node, palette);
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
