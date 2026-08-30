/**
 * Open Graph card generation: one card per share page per language.
 *
 * Writes `scripts/.og/og-<page>-<lang>.html` — a 1200x630 page whose artwork
 * is produced by the project's own generators, at fixed seeds, so every social
 * card is made of the same maths the site is. `npm run og` then rasterises
 * each page with headless Chrome into `public/og-<page>-<lang>-<version>.png`,
 * following the manifest this script writes beside them.
 *
 * The four pages differ in the *shape* of their artwork, not only in their
 * words, because a card that is the same picture with different copy is a card
 * nobody reads twice:
 *
 *   home     one large object          — the pattern grid: a single made thing
 *   gallery  a 2x2 grid of four        — a curated set, four different families
 *   posters  two overlapping sheets    — real compositions, on paper
 *   videos   a four-frame filmstrip    — one pattern at four points in its cycle
 *
 * Chrome is not a build dependency: the PNGs are committed, and this script
 * only runs when the card design or the wording changes.
 */
import '../src/patterns/index';
import { getPattern, generateSafe } from '../src/patterns/registry';
import { serialize, type Palette } from '../src/core/svg';
import { resolvePalette } from '../src/poster/palettes';
import { decodeState, type AppState } from '../src/core/url-state';
import { sheet } from '../src/compose/units';
import { SKELETONS } from '../src/compose/skeletons';
import { variantsFor, findVariant } from '../src/compose/variants';
import { colorwaysFor } from '../src/compose/colorways';
import { posterData } from '../src/compose/data';
import { renderPoster, artworkSize } from '../src/compose/render';
import { approxMeasure } from '../src/compose/measure';
import { LANGS, type Lang } from '../src/i18n';
import { shareText } from '../src/i18n/share';
import { CARD_VERSION, PAGE_IDS, type PageId } from './share-pages';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '.og');

const CARD = { w: 1200, h: 630 };
/** The right-hand artwork panel every card shares. */
const ART = { w: 430, h: 560 };

// --- the artwork behind each page ------------------------------------------

/**
 * Hashes, not loose parameter objects: every one of these is a real link the
 * site already serves, so a card can never show artwork the visitor cannot
 * then open. `tests/ui/share-pages.test.ts` asserts each one decodes and, for
 * the gallery and poster cards, that it is an entry of the curated set the
 * page it advertises actually shows.
 */

/** home — the voxel sculpture the first card carried. Kept: it is the piece
 *  already in circulation, and a single solid object reads as "a made thing"
 *  where a field of lines would read as a texture. */
const HOME_HASH = '#/p/voxel?v=1&seed=68182&hue=266&chroma=0.115&paperL=0.08&accentShift=130&shape=1&dimension=14&gap=0.09&shellOnly=1&scatter=0.53&faceShading=0.75&depthShading=0.55&strokeWidth=0.75&size=1.17&phase=0';

/** gallery — four entries of `SHOWCASE`, one from each of four different
 *  families (curves, tilings, points, growth), so the tile grid shows range
 *  rather than four variations of one look. None of them is the home card's
 *  pattern or the videos card's. */
const GALLERY_HASHES = [
  '#/p/maurer?v=1&seed=1&hue=0&accentShift=130&n=10&d=73&strokeWidth=0.5&envelope=1&size=1.12&phase=0',
  '#/p/truchet?v=1&seed=36131&hue=15&paperL=0.08&accentShift=130&cell=30&variant=0&render=0&strokeWidth=1&boldChance=0.14&accentChance=0.04&size=1',
  '#/p/phyllotaxis?v=1&seed=26280&hue=254&paperL=0.08&accentShift=130&points=1110&angle=124.3445&radialExp=0.65&dotMin=3.15&dotGrow=0.0004&accentEvery=108&size=1&phase=0',
  '#/p/diffgrowth?v=1&seed=82403&hue=0&paperL=0.08&accentShift=130&iterations=500&repulsion=18&rings=2&strokeWidth=1.1&size=1.31',
];

/** posters — two entries of `SHOWCASE_POSTERS`, rendered as real composed
 *  sheets through the composer rather than as bare artwork, because the sheet
 *  (margins, type block, QR) is what the page is selling. Front sheet is the
 *  coloured one; the muted one sits behind it. */
const POSTER_FRONT = '#/c/flowfield?v=1&seed=41399&hue=97&chroma=0.115&paperL=0.08&accentShift=130&layout=3a.s0.d0.a1&cway=0&freq=0.011&curl=2.15&spacing=9&steps=300&strokeWidth=0.85&emphasisEvery=26&size=1&phase=0';
const POSTER_BACK = '#/c/harmonograph?v=1&seed=38978&hue=0&paperL=0.08&accentShift=130&layout=3d.s0.d0.a0&cway=8&ratio=0&detune=0.017&damping=0.001&duration=570&strokeWidth=0.3&opacity=0.52&size=1.1&phase=0';

/** videos — the flow field, which is one of the curated recordings, sampled at
 *  four points of its phase cycle. Chosen because it fills a wide frame edge
 *  to edge (a radial pattern would leave two black margins in a filmstrip
 *  cell) and because its motion is legible as a still sequence. */
const VIDEO_HASH = '#/p/flowfield?v=1&seed=41399&hue=97&chroma=0.115&paperL=0.08&accentShift=130&freq=0.011&curl=2.15&spacing=9&steps=300&strokeWidth=0.85&emphasisEvery=26&size=1&phase=0';
const VIDEO_PHASES = [0, 0.25, 0.5, 0.75];

/** The palette a composed poster carries: its tree already holds literal
 *  colours, so the role palette is inert. Same constant `ui/poster.ts` uses. */
const BAKED: Palette = { paper: '#000000', ink: '#000000', accent: '#000000' };

function state(hash: string): AppState {
  const s = decodeState(hash);
  if (!s) throw new Error(`card hash does not decode: ${hash}`);
  return s;
}

/** A design hash, rendered at `size`. `paper` is left to the state's own
 *  colour so a tile reads as a card of its own; `transparent` is passed only
 *  where the artwork should sit directly on the card ground. */
function design(hash: string, size: { w: number; h: number }, opts: { paper?: string; phase?: number } = {}): string {
  const s = state(hash);
  const def = getPattern(s.patternId);
  if (!def) throw new Error(`card hash names an unregistered pattern: ${hash}`);
  const params = opts.phase === undefined ? s.params : { ...s.params, phase: opts.phase };
  const node = generateSafe(def, params, s.seed, size);
  const pal = resolvePalette(s.color);
  return serialize(node, opts.paper ? { ...pal, paper: opts.paper } : pal);
}

/** A poster hash, rendered as the composed sheet — the same path
 *  `ui/poster.ts`'s `composerThumb` takes, written out here so this script
 *  never imports a `ui/` module (they reach for `document` at load).
 *
 *  `lang` is forced onto the state because a sheet carries the pattern's own
 *  blurb: without it the Spanish card would show two English posters. */
function poster(hash: string, lang: Lang): string {
  const s = { ...state(hash), lang };
  const def = getPattern(s.patternId);
  if (!def) throw new Error(`poster hash names an unregistered pattern: ${hash}`);
  const sh = sheet(s);
  const variants = variantsFor(SKELETONS, sh.ratio);
  const variant = findVariant(variants, s.layout) ?? variants[0];
  const colorway = colorwaysFor(s.color)[s.cway ?? 0];
  if (!variant || !colorway) throw new Error(`poster hash has no layout/colourway: ${hash}`);
  const r = renderPoster({
    sheet: sh, skeleton: variant.skeleton, colorway, data: posterData(def, s),
    artwork: generateSafe(def, s.params, s.seed, artworkSize(sh, variant.skeleton)),
    measure: approxMeasure(), hideText: false,
  });
  if (!r.ok) throw new Error(`poster hash did not render: ${hash}`);
  return serialize(r.node, BAKED);
}

/** The right-hand panel's markup, per page. */
function art(id: PageId, lang: Lang): string {
  if (id === 'home') {
    return `<div class="art art-solo">${design(HOME_HASH, ART, { paper: 'transparent' })}</div>`;
  }
  if (id === 'gallery') {
    const tile = 205;
    const cells = GALLERY_HASHES
      .map((h) => `<div class="tile">${design(h, { w: tile, h: tile })}</div>`)
      .join('');
    return `<div class="art art-grid">${cells}</div>`;
  }
  if (id === 'posters') {
    return `<div class="art art-sheets">
    <div class="sheet back">${poster(POSTER_BACK, lang)}</div>
    <div class="sheet front">${poster(POSTER_FRONT, lang)}</div>
  </div>`;
  }
  const frame = { w: 428, h: 120 };
  const frames = VIDEO_PHASES
    .map((phase) => `<div class="frame">${design(VIDEO_HASH, frame, { phase })}</div>`)
    .join('');
  return `<div class="art art-strip">${frames}<div class="scrub"><i></i></div></div>`;
}

// --- the card ---------------------------------------------------------------

const STYLE = `
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

  /* home — one object, straight on the card ground. */
  .art-solo svg { height: 100%; }

  /* gallery — four tiles, each framed the way a gallery card is on the site. */
  .art-grid {
    display: grid; grid-template-columns: repeat(2, 205px); grid-template-rows: repeat(2, 205px);
    gap: 20px; align-content: center; justify-content: center;
  }
  .tile { overflow: hidden; border: 1px solid #2e2e33; border-radius: 2px; }

  /* posters — a stack of sheets, the front one lit and the back one dropped
     back with brightness rather than opacity, so it stays a sheet of paper
     instead of turning into a ghost of the card ground. */
  .art-sheets { position: relative; }
  .art-sheets .sheet { position: absolute; }
  .art-sheets .sheet svg { width: 100%; height: auto; }
  .art-sheets .back {
    left: 0; top: 50px; width: 300px; transform: rotate(-7deg);
    filter: brightness(0.62) saturate(0.7);
  }
  .art-sheets .front {
    left: 108px; top: 118px; width: 312px;
    box-shadow: -22px 14px 44px rgba(0, 0, 0, 0.62);
  }

  /* videos — four frames of one cycle, with the scrubber that says so. */
  .art-strip { display: flex; flex-direction: column; justify-content: center; }
  .frame { height: 122px; overflow: hidden; border: 1px solid #2e2e33; }
  .frame + .frame { margin-top: 8px; }
  .scrub { margin-top: 18px; height: 2px; background: #2e2e33; position: relative; }
  .scrub i { position: absolute; left: 0; top: 0; height: 2px; width: 38%; background: #e3261a; }
`;

function page(id: PageId, lang: Lang): string {
  const headA = shareText(`${id}.headA`, lang);
  const headB = shareText(`${id}.headB`, lang);
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
  <div class="left">
    <div class="mark">flowshape<span>.art</span></div>
    <h1>${headA}<br>${headB}</h1>
    <p class="sub">${shareText(`${id}.sub`, lang)}</p>
    <div class="tag">${shareText(`${id}.tag`, lang)}</div>
  </div>
  ${art(id, lang)}
</body></html>`;
}

mkdirSync(OUT, { recursive: true });
/** What `shoot-og.mjs` rasterises. Written here so the page list and the card
 *  version live in one place and the shooter needs no TypeScript. */
const manifest: Array<{ html: string; png: string }> = [];
for (const lang of LANGS) {
  for (const id of PAGE_IDS) {
    const html = `og-${id}-${lang}.html`;
    writeFileSync(path.join(OUT, html), page(id, lang));
    manifest.push({ html, png: `og-${id}-${lang}-${CARD_VERSION}.png` });
    console.log(`wrote ${path.join(OUT, html)}`);
  }
}
writeFileSync(path.join(OUT, 'cards.json'), JSON.stringify(manifest, null, 2));
console.log(`wrote ${path.join(OUT, 'cards.json')} (${manifest.length} cards)`);
