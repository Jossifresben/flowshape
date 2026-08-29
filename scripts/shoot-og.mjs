/**
 * Rasterises the Open Graph cards written by `build-og.ts` into
 * `public/og-<lang>.png`, using whatever Chrome is on this machine.
 *
 * Kept out of `npm run build` on purpose: the PNGs are committed, so a normal
 * build (and CI) never needs a browser. Override the binary with CHROME=…
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

for (const lang of ['en', 'es']) {
  const html = path.join(root, 'scripts', '.og', `og-${lang}.html`);
  const out = path.join(root, 'public', `og-${lang}.png`);
  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1200,630',
    `--screenshot=${out}`, `file://${html}`,
  ], { stdio: 'inherit' });
  console.log(`wrote ${out}`);
}
