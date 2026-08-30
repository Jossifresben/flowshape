import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { decodeState } from '../../src/core/url-state';
import { getPattern } from '../../src/patterns/registry';
import { SHOWCASE, SHOWCASE_POSTERS } from '../../src/content/showcase';
import { LANGS, LANG_STORAGE_KEY } from '../../src/i18n';
import { SHARE } from '../../src/i18n/share';
import {
  SHARE_PAGES, META_START, META_END, SITE, PAGE_IDS,
  metaBlock, shellFor, sharePages, twin, type SharePage,
} from '../../scripts/share-pages';

/**
 * Share cards are invisible in normal use: nothing on the site renders them,
 * nobody notices a wrong one until a link is already out in the world, and the
 * bug this replaced — two `og:image` tags in one document, so the Spanish card
 * was never once served — sat in production unseen. These assertions are the
 * only thing that catches the next one.
 *
 * They run against the same code `npm run build` runs: `shellFor` is what the
 * plugin calls per page, and the plugin's own `generateBundle` is exercised
 * below against the real `index.html`, so "exists after a build" is checked on
 * the build path rather than on a `dist/` that may or may not be there.
 */

const ROOT = path.join(__dirname, '..', '..');
const INDEX = readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/** Every share document, exactly as the build writes it. */
const BUILT: Array<{ page: SharePage; html: string }> = SHARE_PAGES.map((page) => ({
  page, html: shellFor(INDEX, page),
}));

const count = (html: string, needle: string): number => html.split(needle).length - 1;

/** The single value of `<meta property|name="key" content="…">`. Fails the
 *  caller loudly when the tag is absent or doubled, which is the whole point. */
function meta(html: string, key: string): string {
  const re = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)" ?/>`, 'g');
  const found = [...html.matchAll(re)].map((m) => m[1]!);
  expect(found, `expected exactly one '${key}' tag`).toHaveLength(1);
  return found[0]!;
}

function link(html: string, rel: string): string[] {
  const re = new RegExp(`<link rel="${rel}"[^>]*href="([^"]*)"`, 'g');
  return [...html.matchAll(re)].map((m) => m[1]!);
}

describe('share page table', () => {
  it('covers four views in two languages, at the expected paths', () => {
    expect(SHARE_PAGES.map((p) => p.path)).toEqual([
      '/', '/gallery/', '/gallery/posters/', '/gallery/videos/',
      '/es/', '/es/gallery/', '/es/gallery/posters/', '/es/gallery/videos/',
    ]);
    expect(SHARE_PAGES).toHaveLength(PAGE_IDS.length * LANGS.length);
  });

  it('writes `/` to dist/index.html and every other page to its own directory', () => {
    expect(SHARE_PAGES.map((p) => p.file)).toEqual([
      'index.html', 'gallery/index.html', 'gallery/posters/index.html', 'gallery/videos/index.html',
      'es/index.html', 'es/gallery/index.html', 'es/gallery/posters/index.html',
      'es/gallery/videos/index.html',
    ]);
  });

  it('boots the SPA at a hash the router still recognises', () => {
    // Guards the app's own contract, not this table's: `main.ts` matches the
    // `#/gallery` prefix and `showcase.ts` reads the segment after it, so a
    // rename on either side must break here rather than land a share page on
    // the wrong tab.
    expect(SHARE_PAGES.map((p) => p.hash)).toEqual([
      '#/', '#/gallery', '#/gallery/posters', '#/gallery/videos',
      '#/?lang=es', '#/gallery?lang=es', '#/gallery/posters?lang=es', '#/gallery/videos?lang=es',
    ]);
  });

  it('pairs each page with its twin in the other language', () => {
    for (const page of SHARE_PAGES) {
      expect(twin(page).id).toBe(page.id);
      expect(twin(page).lang).not.toBe(page.lang);
      expect(twin(twin(page))).toEqual(page);
    }
  });
});

describe('share page documents', () => {
  it('declares exactly one og:image — the bug that hid the Spanish card', () => {
    for (const { page, html } of BUILT) {
      expect(count(html, 'property="og:image"'), `${page.path} og:image count`).toBe(1);
      expect(meta(html, 'og:image')).toBe(SITE + page.image);
    }
  });

  it('points every image tag at an absolute URL', () => {
    for (const { html } of BUILT) {
      for (const key of ['og:image', 'twitter:image']) {
        expect(meta(html, key).startsWith(`${SITE}/`)).toBe(true);
      }
    }
  });

  it('serves an image that is actually on disk', () => {
    for (const { page } of SHARE_PAGES.map((page) => ({ page }))) {
      const file = path.join(ROOT, 'public', page.image);
      const stat = statSync(file, { throwIfNoEntry: false });
      expect(stat?.isFile(), `missing public${page.image} — run \`npm run og\``).toBe(true);
      expect(stat!.size).toBeGreaterThan(0);
    }
  });

  it('gives every page a distinct card', () => {
    const images = SHARE_PAGES.map((p) => p.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('carries exactly one self-referential canonical', () => {
    for (const { page, html } of BUILT) {
      expect(link(html, 'canonical'), `${page.path} canonical`).toEqual([SITE + page.path]);
    }
  });

  it('pairs the en/es twins with hreflang, and defaults to English', () => {
    for (const { page, html } of BUILT) {
      const en = page.lang === 'en' ? page : twin(page);
      const es = page.lang === 'es' ? page : twin(page);
      expect(link(html, 'alternate" hreflang="en')).toEqual([SITE + en.path]);
      expect(link(html, 'alternate" hreflang="es')).toEqual([SITE + es.path]);
      expect(link(html, 'alternate" hreflang="x-default')).toEqual([SITE + en.path]);
    }
  });

  it('declares the right locale, and names the twin as the alternate', () => {
    const expected = { en: 'en_US', es: 'es_ES' } as const;
    for (const { page, html } of BUILT) {
      expect(meta(html, 'og:locale'), `${page.path} og:locale`).toBe(expected[page.lang]);
      expect(meta(html, 'og:locale:alternate')).toBe(expected[twin(page).lang]);
      expect(html).toContain(`<html lang="${page.lang}"`);
    }
  });

  it('has a title, a description and matching twitter tags', () => {
    for (const { page, html } of BUILT) {
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
      expect(title, `${page.path} <title>`).toBeTruthy();
      expect(meta(html, 'description')).not.toBe('');
      expect(meta(html, 'twitter:title')).toBe(meta(html, 'og:title'));
      expect(meta(html, 'twitter:description')).toBe(meta(html, 'og:description'));
      expect(meta(html, 'twitter:image')).toBe(meta(html, 'og:image'));
      expect(meta(html, 'og:image:alt')).toBe(meta(html, 'og:title'));
      expect(meta(html, 'twitter:card')).toBe('summary_large_image');
    }
  });

  it('says something different on every page, in both languages', () => {
    const titles = BUILT.map(({ html }) => meta(html, 'og:title'));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('keeps the app entry free of any redirect, and hands over on the other seven', () => {
    for (const { page, html } of BUILT) {
      if (page.file === 'index.html') {
        expect(html).not.toContain('location.replace');
        continue;
      }
      // `replace`, never `assign` or a plain assignment: the shell must not
      // become a history entry the back button has to walk back through.
      expect(html, `${page.path} handover`).toContain(`location.replace('/'+location.search+"${page.hash}")`);
      expect(html).not.toContain('location.href =');
      expect(html).not.toContain('pushState');
      // Before the stylesheet, so nothing of the shell is ever painted.
      expect(html.indexOf('location.replace')).toBeLessThan(html.indexOf('<link rel="icon"'));
    }
  });

  it('remembers Spanish on the way in, and never writes a language on the English pages', () => {
    for (const { page, html } of BUILT) {
      const writes = html.includes(`localStorage.setItem("${LANG_STORAGE_KEY}",'es')`);
      expect(writes, `${page.path} language handover`).toBe(page.lang === 'es');
    }
  });

  it('keeps the app entry intact — same script, same JSON-LD, same favicons', () => {
    const home = BUILT[0]!;
    expect(home.page.path).toBe('/');
    for (const marker of [
      '<script type="module" src="/src/main.ts"></script>',
      '<div id="app"></div>',
      '"@type": "WebApplication"',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    ]) {
      expect(home.html, `index.html lost: ${marker}`).toContain(marker);
    }
    // The document `/` serves is the committed one, byte for byte.
    expect(home.html).toBe(INDEX);
  });
});

describe('the build emits all eight', () => {
  it('writes every share path from generateBundle', () => {
    const emitted = new Map<string, string>();
    const index = { type: 'asset' as const, fileName: 'index.html', source: INDEX };
    const plugin = sharePages();
    const hook = plugin.generateBundle as unknown as (
      this: { emitFile: (f: { fileName: string; source: string }) => void },
      options: unknown,
      bundle: Record<string, unknown>,
    ) => void;
    hook.call(
      { emitFile: (f) => void emitted.set(f.fileName, f.source) },
      {},
      { 'index.html': index },
    );

    for (const page of SHARE_PAGES) {
      if (page.file === 'index.html') {
        expect(index.source).toBe(shellFor(INDEX, page));
        continue;
      }
      expect(emitted.has(page.file), `build did not emit dist/${page.file}`).toBe(true);
      expect(emitted.get(page.file)).toBe(shellFor(INDEX, page));
    }
    // Nothing beyond the table.
    expect(emitted.size).toBe(SHARE_PAGES.length - 1);
  });

  it('refuses to build if index.html loses its markers', () => {
    expect(() => shellFor(INDEX.replace(META_START, ''), SHARE_PAGES[1]!)).toThrow(/markers/);
    expect(() => shellFor(INDEX.replace(META_END, ''), SHARE_PAGES[1]!)).toThrow(/markers/);
  });
});

describe('committed index.html', () => {
  it('holds exactly what the build would write into its marked region', () => {
    // `npm run dev` serves this file directly, so a hand edit here would make
    // development disagree with production without anything failing.
    const start = INDEX.indexOf(META_START) + META_START.length;
    const end = INDEX.indexOf(META_END);
    expect(INDEX.slice(start, end)).toBe(`\n${metaBlock(SHARE_PAGES[0]!)}\n    `);
  });

  it('declares one og:image and one canonical', () => {
    expect(count(INDEX, 'property="og:image"')).toBe(1);
    expect(link(INDEX, 'canonical')).toEqual([`${SITE}/`]);
  });
});

describe('card artwork', () => {
  // The cards are generated from real site URLs (see `scripts/build-og.ts`), so
  // a card can never advertise artwork the visitor cannot then open. These
  // pin the two that must also be members of the set their page shows.
  const cards = readFileSync(path.join(ROOT, 'scripts', 'build-og.ts'), 'utf8');
  const hashes = [...cards.matchAll(/'(#\/[pc]\/[^']+)'/g)].map((m) => m[1]!);

  it('finds the hashes it is supposed to check', () => {
    expect(hashes.length).toBeGreaterThanOrEqual(7);
  });

  it('decodes every card hash to a registered pattern', () => {
    for (const hash of hashes) {
      const state = decodeState(hash);
      expect(state, `card hash does not decode: ${hash}`).not.toBeNull();
      expect(getPattern(state!.patternId), `unregistered pattern in ${hash}`).toBeDefined();
    }
  });

  it('draws the gallery and poster cards from the curated sets they advertise', () => {
    const curated = new Set([...SHOWCASE, ...SHOWCASE_POSTERS].map((e) => e.hash));
    for (const hash of hashes) {
      if (hash.startsWith('#/c/')) {
        expect(curated.has(hash), `poster card is not a curated poster: ${hash}`).toBe(true);
      }
    }
    // Four design tiles on the gallery card, all curated; the home and video
    // cards may legitimately use a design of their own.
    const designs = hashes.filter((h) => h.startsWith('#/p/') && curated.has(h));
    expect(designs.length).toBeGreaterThanOrEqual(4);
  });
});

describe('share copy', () => {
  it('has both languages for every slot of every page', () => {
    for (const id of PAGE_IDS) {
      for (const slot of ['docTitle', 'docDesc', 'cardTitle', 'cardDesc', 'headA', 'headB', 'sub', 'tag']) {
        const pair = SHARE[`${id}.${slot}`];
        expect(pair, `missing SHARE entry '${id}.${slot}'`).toBeTruthy();
        expect(pair![0]).not.toBe('');
        expect(pair![1]).not.toBe('');
      }
    }
  });

  it('actually translates — no Spanish string is a copy of its English', () => {
    const identical = Object.entries(SHARE).filter(([, p]) => p[0] === p[1]).map(([k]) => k);
    expect(identical).toEqual([]);
  });

  it('keeps card descriptions inside what the platforms show', () => {
    for (const [key, pair] of Object.entries(SHARE)) {
      if (!key.endsWith('.cardDesc')) continue;
      // ~200 characters is where X and LinkedIn truncate; past that the tail
      // is written for nobody.
      for (const s of pair) expect(s.length, `${key} is ${s.length} chars`).toBeLessThanOrEqual(200);
    }
  });
});
