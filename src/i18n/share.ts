import type { Lang, Pair } from './index';

/**
 * Copy for the pre-rendered share pages: the eight real paths under `dist/`
 * that carry per-page Open Graph tags, and the eight PNG cards behind them.
 *
 * A sibling of `ui.ts` rather than part of it: the app never renders any of
 * these strings — only `scripts/share-pages.ts` (the head block) and
 * `scripts/build-og.ts` (the card artwork) read them — so keeping them out of
 * `UI` keeps them out of the browser bundle. Nothing under `src/` imports this
 * module at runtime, and the only import here is a type, so there is no edge
 * from the app into it at all.
 *
 * Keys are `<page>.<slot>`, one group per share page:
 *   docTitle   the document <title>
 *   docDesc    <meta name="description"> — the long, search-facing one
 *   cardTitle  og:title / twitter:title / og:image:alt
 *   cardDesc   og:description / twitter:description — kept under ~200 chars,
 *              which is where the platforms truncate
 *   headA/headB  the card artwork's headline, one line each (the same
 *              two-key shape `gal.headlineA`/`gal.headlineB` already uses,
 *              because the break is a design decision, not a wrap)
 *   sub        the card's grey standfirst
 *   tag        the card's mono strapline
 *
 * `home.docTitle` and `home.docDesc` are deliberately the exact strings the
 * hand-written `index.html` shipped with: `/` is the app entry and a real
 * indexed page, so its search-facing copy must not drift when it starts being
 * generated from here.
 */
export const SHARE: Record<string, Pair> = {
  // --- / and /es/ — the pattern grid ---------------------------------------
  'home.docTitle': [
    'flowshape.art — mathematical patterns into print-ready posters',
    'flowshape.art — patrones matemáticos en pósters listos para imprimir',
  ],
  'home.docDesc': [
    'flowshape turns mathematics into art. Play with 36 pattern generators, tune every parameter, and take the result out as a print-ready SVG or PNG — or set it moving to music. Every pattern shows its formula and its code, in English and Spanish. Free, open source, runs entirely in your browser.',
    'flowshape convierte las matemáticas en arte. Juega con 36 generadores de patrones, ajusta cada parámetro y llévate el resultado como SVG o PNG listo para imprimir, o ponlo a moverse con la música. Cada patrón muestra su fórmula y su código, en inglés y en español. Libre, de código abierto y funciona entero en tu navegador.',
  ],
  'home.cardTitle': [
    'flowshape.art — shape mathematics into art',
    'flowshape.art — convierte las matemáticas en arte',
  ],
  'home.cardDesc': [
    '36 mathematical pattern generators. Tune every parameter, read the formula behind it, then print it or set it moving to music. Free and open source.',
    '36 generadores de patrones matemáticos. Ajusta cada parámetro, lee la fórmula que hay detrás, imprímelo o ponlo a moverse con la música. Libre y de código abierto.',
  ],
  'home.headA': ['Shape mathematics', 'Convierte las matemáticas'],
  'home.headB': ['into art.', 'en arte.'],
  'home.sub': [
    '36 pattern generators · tune every parameter · print it, or set it moving to music',
    '36 generadores de patrones · ajusta cada parámetro · imprímelo o ponlo en movimiento',
  ],
  'home.tag': ['FREE · OPEN SOURCE · NO ACCOUNT', 'LIBRE · CÓDIGO ABIERTO · SIN CUENTA'],

  // --- /gallery/ and /es/gallery/ — the curated designs --------------------
  'gallery.docTitle': [
    'Gallery — hand-picked flowshape designs',
    'Galería — diseños de flowshape elegidos a mano',
  ],
  'gallery.docDesc': [
    'A curated gallery of generative designs made with flowshape. Every piece is a live link: open it, change any parameter, and take away your own version as a print-ready SVG or PNG.',
    'Una galería seleccionada de diseños generativos hechos con flowshape. Cada pieza es un enlace vivo: ábrela, cambia cualquier parámetro y llévate tu propia versión en SVG o PNG listo para imprimir.',
  ],
  'gallery.cardTitle': [
    'flowshape.art — a gallery of hand-picked designs',
    'flowshape.art — una galería de diseños elegidos a mano',
  ],
  'gallery.cardDesc': [
    'Generative designs chosen by hand. Every piece in the gallery is a live link — open it, change anything, make it yours.',
    'Diseños generativos elegidos a mano. Cada pieza de la galería es un enlace vivo: ábrela, cambia lo que quieras y hazla tuya.',
  ],
  'gallery.headA': ['Designs,', 'Diseños,'],
  'gallery.headB': ['hand-picked.', 'elegidos a mano.'],
  'gallery.sub': [
    'Every piece in the gallery is a live link — open it, change any parameter, make it your own',
    'Cada pieza de la galería es un enlace vivo: ábrela, cambia cualquier parámetro y hazla tuya',
  ],
  'gallery.tag': ['CURATED · EVERY PIECE IS A LINK', 'SELECCIÓN · CADA PIEZA ES UN ENLACE'],

  // --- /gallery/posters/ and /es/gallery/posters/ --------------------------
  'posters.docTitle': [
    'Posters — print-ready generative art from flowshape',
    'Pósters — arte generativo de flowshape listo para imprimir',
  ],
  'posters.docDesc': [
    'Generative posters composed on real paper sizes, with the formula and its parameters set beside the artwork. Browse layouts and colourways, then export a print-ready SVG or PNG.',
    'Pósters generativos compuestos sobre tamaños de papel reales, con la fórmula y sus parámetros junto a la obra. Explora diseños y gamas de color, y exporta un SVG o PNG listo para imprimir.',
  ],
  'posters.cardTitle': [
    'flowshape.art — print-ready generative posters',
    'flowshape.art — pósters generativos listos para imprimir',
  ],
  'posters.cardDesc': [
    'Posters composed on real paper sizes, the formula set beside the artwork. Browse layouts and colourways, export a print-ready SVG or PNG.',
    'Pósters compuestos sobre tamaños de papel reales, con la fórmula junto a la obra. Explora diseños y gamas de color, exporta SVG o PNG listo para imprimir.',
  ],
  'posters.headA': ['Print-ready', 'Pósters listos'],
  'posters.headB': ['posters.', 'para imprimir.'],
  'posters.sub': [
    'Real paper sizes · layouts and colourways to browse · the formula printed beside the artwork',
    'Tamaños de papel reales · diseños y gamas de color · la fórmula impresa junto a la obra',
  ],
  'posters.tag': ['A3 · A2 · SVG & PNG · PRINT-READY', 'A3 · A2 · SVG Y PNG · LISTO PARA IMPRIMIR'],

  // --- /gallery/videos/ and /es/gallery/videos/ ----------------------------
  'videos.docTitle': [
    'Videos — flowshape patterns in motion',
    'Vídeos — patrones de flowshape en movimiento',
  ],
  'videos.docDesc': [
    'Recordings from the flowshape live stage: mathematical patterns moving, some of them driven by sound. Open any one and take the controls yourself, in the browser.',
    'Grabaciones del escenario en vivo de flowshape: patrones matemáticos en movimiento, algunos guiados por el sonido. Abre cualquiera y toma tú mismo los mandos, en el navegador.',
  ],
  'videos.cardTitle': [
    'flowshape.art — mathematics in motion',
    'flowshape.art — matemáticas en movimiento',
  ],
  'videos.cardDesc': [
    'Recordings from the live stage: patterns moving, some of them driven by sound. Open one and take the controls yourself.',
    'Grabaciones del escenario en vivo: patrones en movimiento, algunos guiados por el sonido. Abre uno y toma tú mismo los mandos.',
  ],
  'videos.headA': ['Mathematics', 'Matemáticas'],
  'videos.headB': ['in motion.', 'en movimiento.'],
  'videos.sub': [
    'Recorded from the live stage · driven by sound · open any one and take the controls',
    'Grabado del escenario en vivo · guiado por el sonido · abre cualquiera y toma los mandos',
  ],
  'videos.tag': ['RECORDED LIVE · AUDIO-REACTIVE', 'GRABADO EN VIVO · REACTIVO AL AUDIO'],
};

/** A share string. Throws on an unknown key rather than echoing it: these are
 *  read at build time by two scripts, so a typo must stop the build instead of
 *  baking the key itself into a social card nobody looks at. */
export function shareText(key: string, lang: Lang): string {
  const pair = SHARE[key];
  if (!pair) throw new Error(`unknown share key: ${key}`);
  return lang === 'es' ? pair[1] : pair[0];
}
