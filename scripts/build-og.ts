/**
 * Open Graph card generation, one per language.
 *
 * Writes `scripts/.og/og-<lang>.html` — a 1200x630 page whose artwork is
 * produced by the project's own generators, at a fixed seed, so the social
 * card is made of the same maths the site is. `npm run og` then rasterises
 * each page with headless Chrome into `public/og-<lang>.png`.
 *
 * Chrome is not a build dependency: the PNGs are committed, and this script
 * only runs when the card design or the wording changes.
 */
import '../src/patterns/index';
import { getPattern, generateSafe } from '../src/patterns/registry';
import { serialize } from '../src/core/svg';
import { resolvePalette } from '../src/poster/palettes';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '.og');

const CARD = { w: 1200, h: 630 };
const ART = { w: 430, h: 560 };
const ART_PATTERN = 'voxel';
const ART_SEED = 68182;
const ART_PARAMS = {
  shape: 1, dimension: 14, gap: 0.09, shellOnly: 1, scatter: 0.53,
  faceShading: 0.75, depthShading: 0.55, strokeWidth: 0.75, size: 1.17, phase: 0,
};
// The card takes its ink and accent from the artwork's own colour state, so the
// social image matches the URL it came from. `paperL` is deliberately NOT let
// through to the card background — see `artwork()`.
const ART_COLOR = { hue: 266, chroma: 0.115, paperL: 0.08, accentShift: 130 };

const COPY = {
  en: {
    headline: 'Shape mathematics<br>into art.',
    sub: '25 pattern generators · tune every parameter · print it, or set it moving to music',
    tag: 'FREE · OPEN SOURCE · NO ACCOUNT',
  },
  es: {
    headline: 'Convierte las matemáticas<br>en arte.',
    sub: '25 generadores de patrones · ajusta cada parámetro · imprímelo o ponlo en movimiento',
    tag: 'LIBRE · CÓDIGO ABIERTO · SIN CUENTA',
  },
} as const;

function artwork(): string {
  const def = getPattern(ART_PATTERN)!;
  const node = generateSafe(def, ART_PARAMS, ART_SEED, ART);
  // `paper` is transparent here: the card's own background shows through, so
  // the artwork sits on the ground colour rather than on a pasted rectangle.
  // This is why ART_COLOR's paperL does not reach the card — the ground stays
  // the site's #17171a and only ink/accent carry the artwork's hue, which keeps
  // the card's left-hand type on the same background it was designed against.
  return serialize(node, { ...resolvePalette(ART_COLOR), paper: 'transparent' });
}

function page(lang: keyof typeof COPY): string {
  const c = COPY[lang];
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${CARD.w}px; height: ${CARD.h}px; display: flex; align-items: center;
    background: #17171a; color: #ececea; overflow: hidden;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .left { flex: 1; padding: 64px 0 64px 72px; }
  .mark { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
  .mark span { color: #e3261a; }
  h1 { margin: 34px 0 0; font-size: 62px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
  .sub { margin-top: 26px; font-size: 21px; line-height: 1.45; color: #8e8e90; max-width: 15em; }
  .tag {
    margin-top: 40px; font-family: 'IBM Plex Mono', Menlo, monospace;
    font-size: 13px; letter-spacing: 0.16em; color: #8e8e90;
  }
  .art { width: ${ART.w}px; height: ${ART.h}px; margin-right: 56px; flex: none; }
  .art svg { width: 100%; height: 100%; display: block; }
</style></head><body>
  <div class="left">
    <div class="mark">flowshape<span>.art</span></div>
    <h1>${c.headline}</h1>
    <p class="sub">${c.sub}</p>
    <div class="tag">${c.tag}</div>
  </div>
  <div class="art">${artwork()}</div>
</body></html>`;
}

mkdirSync(OUT, { recursive: true });
for (const lang of ['en', 'es'] as const) {
  const file = path.join(OUT, `og-${lang}.html`);
  writeFileSync(file, page(lang));
  console.log(`wrote ${file}`);
}
