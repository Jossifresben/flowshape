/**
 * The eight pre-rendered share pages.
 *
 * Every route in the app is a hash — `#/`, `#/gallery`, `#/gallery/posters`,
 * `#/gallery/videos`. A fragment is never sent to the server and social
 * scrapers do not run JavaScript, so before this every share of every page
 * resolved to the one `dist/index.html` and the one card in its head. Setting
 * the tags from JS cannot fix that; only a real path with its own document
 * can.
 *
 * So the build emits eight documents — four views × two languages — each a
 * copy of the processed `index.html` with one block of the head swapped and,
 * for the seven that are not the app entry, a redirect into the SPA at the
 * matching hash route.
 *
 * Why a post-build plugin rather than Vite's multi-page `rollupOptions.input`:
 *
 *  - MPA input needs eight real HTML files checked in. Seven of them would be
 *    generated content committed beside the generator, and the head would be
 *    duplicated eight times — the copy would live in markup instead of in
 *    `src/i18n/share.ts`, so a wording change would be an eight-file edit.
 *  - Deriving each shell from the *processed* `index.html` means every shell
 *    picks up the hashed script/style tags, the JSON-LD, the favicons and any
 *    future head change for free. Only the marked region ever differs.
 *  - Eight Rollup inputs would also be eight entry points into the same
 *    module graph, which invites a different chunk split for no gain. One
 *    entry, one bundle, eight documents.
 *
 * The plugin runs at build only and adds no runtime dependency.
 */
import type { Plugin } from 'vite';
import { LANGS, LANG_STORAGE_KEY, type Lang } from '../src/i18n';
import { shareText } from '../src/i18n/share';

/** Absolute origin. OG images and og:url must be absolute — a scraper does not
 *  resolve relative URLs against the page it fetched. */
export const SITE = 'https://flowshape.art';

/**
 * Bumped on every card change; carried in each PNG's filename.
 *
 * Social platforms cache OG images by URL and will keep serving a stale card
 * indefinitely, so a new card needs a new URL. `scripts/shoot-og.mjs` writes
 * the files and this constant names them, so the tags and the files can never
 * disagree about the version.
 */
export const CARD_VERSION = 'v5';

/** The four views that get a share page. */
export const PAGE_IDS = ['home', 'gallery', 'posters', 'videos'] as const;
export type PageId = (typeof PAGE_IDS)[number];

/** The hash route each page hands the SPA. */
const HASH: Record<PageId, string> = {
  home: '#/',
  gallery: '#/gallery',
  posters: '#/gallery/posters',
  videos: '#/gallery/videos',
};

/** The path segment below the language root, always trailing-slash. Netlify's
 *  Pretty URLs (on by default) serve `dist/<dir>/index.html` at `/<dir>/` and
 *  forward `/<dir>` to it, so the trailing-slash form is the canonical one and
 *  is what og:url and rel=canonical name. */
const SUBPATH: Record<PageId, string> = {
  home: '',
  gallery: 'gallery/',
  posters: 'gallery/posters/',
  videos: 'gallery/videos/',
};

export interface SharePage {
  id: PageId;
  lang: Lang;
  /** Site-absolute path, with a trailing slash. */
  path: string;
  /** Output file relative to `dist/`. */
  file: string;
  /** The hash the shell hands the app. */
  hash: string;
  /** Site-absolute path of this page's card, as written into `public/`. */
  image: string;
}

function pathFor(id: PageId, lang: Lang): string {
  return lang === 'en' ? `/${SUBPATH[id]}` : `/es/${SUBPATH[id]}`;
}

function makePage(id: PageId, lang: Lang): SharePage {
  const path = pathFor(id, lang);
  return {
    id,
    lang,
    path,
    file: `${path.slice(1)}index.html`,
    // `lang` rides in the hash query rather than the path, because that is the
    // only place `currentLang()` looks. English is omitted: `encodeState`
    // drops the default, so an English page must produce the same URL a
    // first-time visitor already gets.
    hash: lang === 'es' ? `${HASH[id]}?lang=es` : HASH[id],
    image: `/og-${id}-${lang}-${CARD_VERSION}.png`,
  };
}

/** English first, so `SHARE_PAGES[0]` is `/` — the app entry. */
export const SHARE_PAGES: SharePage[] = LANGS.flatMap((lang) =>
  PAGE_IDS.map((id) => makePage(id, lang)),
);

/** The twin of a page: same view, other language. */
export function twin(page: SharePage): SharePage {
  const other = page.lang === 'en' ? 'es' : 'en';
  return SHARE_PAGES.find((p) => p.id === page.id && p.lang === other)!;
}

const OG_LOCALE: Record<Lang, string> = { en: 'en_US', es: 'es_ES' };

export const META_START = '<!-- share:meta:start -->';
export const META_END = '<!-- share:meta:end -->';

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The head block a share page carries: document title and description,
 * canonical and hreflang, then Open Graph and Twitter.
 *
 * Exactly one `og:image` per document, by construction — the tag is written
 * once from `page.image`. The hand-written head this replaced declared two
 * (an English and a Spanish card in the same document); scrapers take the
 * first, so the Spanish card was never once served.
 */
export function metaBlock(page: SharePage): string {
  const en = page.lang === 'en' ? page : twin(page);
  const es = page.lang === 'es' ? page : twin(page);
  const url = SITE + page.path;
  const image = SITE + page.image;
  const title = shareText(`${page.id}.cardTitle`, page.lang);
  const desc = shareText(`${page.id}.cardDesc`, page.lang);
  const lines = [
    `<title>${esc(shareText(`${page.id}.docTitle`, page.lang))}</title>`,
    `<meta name="description" content="${esc(shareText(`${page.id}.docDesc`, page.lang))}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE + en.path}" />`,
    `<link rel="alternate" hreflang="es" href="${SITE + es.path}" />`,
    // English is the site default, so it is also what an unmatched locale gets.
    `<link rel="alternate" hreflang="x-default" href="${SITE + en.path}" />`,
    '',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="flowshape.art" />',
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[page.lang]}" />`,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[twin(page).lang]}" />`,
    '',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(title)}" />`,
  ];
  return lines.map((l) => (l === '' ? '' : `    ${l}`)).join('\n');
}

/** Replaces the marked region of a document with `page`'s own head block. */
export function applyMeta(html: string, page: SharePage): string {
  const start = html.indexOf(META_START);
  const end = html.indexOf(META_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`share-pages: ${META_START} … ${META_END} markers not found in index.html`);
  }
  return (
    html.slice(0, start + META_START.length)
    + '\n' + metaBlock(page) + '\n    '
    + html.slice(end)
  );
}

/**
 * The inline head script that hands a share page over to the app.
 *
 * `location.replace`, so the shell never becomes a history entry the back
 * button has to walk back through. It runs while the head is still parsing,
 * before the body exists, so nothing of the shell is ever painted; the tiny
 * style above it covers the frame the browser may still show by painting the
 * site's own ground colour rather than white.
 *
 * A Spanish page also records the choice, because `currentLang()` reads the
 * URL first but never writes it: without this, a reader who arrived on
 * `/es/gallery/` would be thrown back into English by their first click on a
 * link that carries no `lang`.
 */
function handoff(page: SharePage): string {
  const remember = page.lang === 'es'
    ? `try{localStorage.setItem(${JSON.stringify(LANG_STORAGE_KEY)},'es')}catch(e){}`
    : '';
  // `location.search` is carried across so campaign parameters survive the hop.
  return `<style>html,body{background:#17171a;margin:0}</style>`
    + `<script>${remember}location.replace('/'+location.search+${JSON.stringify(page.hash)})</script>`;
}

/** Builds one share document from the processed `index.html`. */
export function shellFor(indexHtml: string, page: SharePage): string {
  let out = applyMeta(indexHtml, page);
  const htmlTag = /<html\s+lang="[^"]*"/i;
  if (!htmlTag.test(out)) throw new Error('share-pages: no <html lang="…"> in index.html');
  out = out.replace(htmlTag, `<html lang="${page.lang}"`);
  // `/` is the app entry and is already at the right route; every other page
  // is a shell that hands over.
  if (page.file !== 'index.html') {
    const charset = /<meta\s+charset="[^"]*"\s*\/?>/i;
    if (!charset.test(out)) throw new Error('share-pages: no <meta charset> in index.html');
    // Immediately after the charset declaration, so it stays inside the first
    // 1024 bytes the encoding sniffer reads and still runs before the
    // stylesheet and font requests are started.
    out = out.replace(charset, (m) => `${m}\n    ${handoff(page)}`);
  }
  return out;
}

/** Emits the seven derived documents and normalises `index.html`'s own head
 *  block, so all eight come from one table. */
export function sharePages(): Plugin {
  return {
    name: 'flowshape:share-pages',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') {
        throw new Error('share-pages: index.html is not in the bundle');
      }
      const html = typeof index.source === 'string'
        ? index.source
        : Buffer.from(index.source).toString('utf8');
      for (const page of SHARE_PAGES) {
        const out = shellFor(html, page);
        if (page.file === 'index.html') index.source = out;
        else this.emitFile({ type: 'asset', fileName: page.file, source: out });
      }
    },
  };
}
