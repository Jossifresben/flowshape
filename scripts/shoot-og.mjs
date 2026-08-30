/**
 * Rasterises the Open Graph cards written by `build-og.ts` into
 * `public/og-<page>-<lang>-<CARD_VERSION>.png`, using whatever Chrome is on
 * this machine.
 *
 * The page list and the version both come from `scripts/.og/cards.json`, which
 * `build-og.ts` writes: this file stays plain JavaScript (no TypeScript
 * toolchain to launch a browser) and still cannot drift from the table in
 * `scripts/share-pages.ts` that the <meta> tags are generated from.
 *
 * The filename carries a version because social platforms cache OG images by
 * URL and will keep serving a stale card indefinitely. Bump CARD_VERSION in
 * `scripts/share-pages.ts` whenever the card changes; the tags and the files
 * move together, with no per-platform cache flush.
 *
 * Kept out of `npm run build` on purpose: the PNGs are committed, so a normal
 * build (and CI) never needs a browser. Override the binary with CHROME=…
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES = [
  process.env['CHROME'],
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CANDIDATES.find((c) => existsSync(c));
if (!chrome) {
  console.error('No Chrome found. Set CHROME=/path/to/chrome and re-run.');
  process.exit(1);
}

const manifestPath = path.join(root, 'scripts', '.og', 'cards.json');
if (!existsSync(manifestPath)) {
  console.error('No scripts/.og/cards.json — run `vite-node scripts/build-og.ts` first.');
  process.exit(1);
}
const cards = JSON.parse(readFileSync(manifestPath, 'utf8'));

for (const card of cards) {
  const html = path.join(root, 'scripts', '.og', card.html);
  const out = path.join(root, 'public', card.png);
  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1200,630',
    `--screenshot=${out}`, `file://${html}`,
  ], { stdio: 'inherit' });
  console.log(`wrote ${out}`);
}
