import { listPatterns, type Family } from '../patterns/registry';
import { encodeState } from '../core/url-state';
import { PRESETS } from '../patterns/presets';
import { recallState } from '../core/persist';
import { currentLang, patternName, familyLabel, t, withLang, type Lang } from '../i18n';
import { PATTERN_NAMES, FAMILY_NAMES } from '../i18n/patterns';
import { buildNav } from './nav';
import { buildFooter } from './footer';

/** English display names, kept as a plain map for build scripts and tests.
 *  The app itself goes through `patternName(id, lang)`. */
export const NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(PATTERN_NAMES).map(([id, pair]) => [id, pair[0]]),
);

/** English family labels, same rationale as `NAMES`. */
export const FAMILY_LABELS: Record<Family, string> = Object.fromEntries(
  Object.entries(FAMILY_NAMES).map(([f, pair]) => [f, pair[0]]),
) as Record<Family, string>;

/** Canonical family display order for the filter chips. */
const FAMILY_ORDER: Family[] = ['points', 'curves', 'fields', 'tilings', 'isometric', 'growth'];

/** The curated gallery-sample state for a pattern (its `PRESETS` entry, or
 *  bare defaults when the pattern has none). Carries the reader's language so
 *  the playground opens in the language they were just browsing in. */
function presetHash(id: string, lang: Lang): string {
  const preset = PRESETS[id];
  return encodeState({
    patternId: id,
    seed: preset?.seed ?? 1,
    params: preset?.params ?? {},
    color: preset?.color ?? {},
    lang,
  });
}

/** A card's link target: the visitor's own last-touched state for this
 *  pattern if they have one, otherwise the curated preset. An explicit URL
 *  (e.g. a shared link) is never consulted here — this only decides what a
 *  gallery card points to. */
function cardHref(id: string, lang: Lang): string {
  const remembered = recallState(id);
  // A remembered state carries whatever language it was saved in; the card
  // should open in the language the reader is browsing in now.
  return remembered ? withLang(remembered, lang) : presetHash(id, lang);
}

export function mountGallery(root: HTMLElement): void {
  const lang = currentLang();
  const patterns = listPatterns().sort((a, b) => a.id.localeCompare(b.id));
  const families = FAMILY_ORDER.filter((f) => patterns.some((p) => p.family === f));

  let activeFamily: Family | 'all' = 'all';

  root.innerHTML = '';
  document.documentElement.lang = lang;

  const topbar = buildNav(lang, 'patterns');

  // --- hero ---
  const hero = document.createElement('div');
  hero.className = 'gal-hero';

  const heroTop = document.createElement('div');
  heroTop.className = 'gal-hero-top';

  const headline = document.createElement('h1');
  headline.className = 'gal-headline';
  headline.append(t('gal.headlineA', lang), document.createElement('br'), t('gal.headlineB', lang));

  const stats = document.createElement('div');
  stats.className = 'gal-stats';
  stats.textContent =
    `${patterns.length} ${t('gal.patterns', lang)} · ${families.length} ${t('gal.families', lang)}`;

  heroTop.append(headline, stats);

  const subtitle = document.createElement('p');
  subtitle.className = 'gal-subtitle';
  subtitle.textContent = t('gal.subtitle', lang);

  hero.append(heroTop, subtitle);

  // --- family filter chips ---
  const chipsRow = document.createElement('div');
  chipsRow.className = 'gal-chips';

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  function renderChips(): void {
    chipsRow.innerHTML = '';
    const makeChip = (key: Family | 'all', label: string): void => {
      const chip = document.createElement('button');
      chip.className = 'gal-chip' + (activeFamily === key ? ' active' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        activeFamily = key;
        renderChips();
        renderGrid();
      });
      chipsRow.append(chip);
    };
    makeChip('all', t('gal.all', lang));
    for (const f of families) makeChip(f, familyLabel(f, lang));
  }

  // Cards arrive rather than appear. The reveal is tied to the thumbnail
  // actually decoding — not to a timer — because the decode is what causes the
  // pop; animating on a guess just moves the abruptness somewhere else.
  //
  // The hidden state is applied by script and always removed by `reveal`, which
  // fires on load, on error, and on a timeout. A card can therefore never be
  // left invisible by a thumbnail that never arrives.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderGrid(): void {
    grid.innerHTML = '';
    const visible = patterns.filter((p) => activeFamily === 'all' || p.family === activeFamily);
    // Counts reveals in the order they complete, so the wave follows the order
    // thumbnails actually land. Capped so a card scrolled to much later does
    // not inherit a long delay from everything that preceded it.
    let revealed = 0;
    for (const def of visible) {
      const card = document.createElement('a');
      card.className = 'gal-card';
      card.href = cardHref(def.id, lang);

      const thumbBox = document.createElement('div');
      thumbBox.className = 'gal-thumb';
      const img = document.createElement('img');
      img.src = `/thumbs/${def.id}.svg`;
      img.alt = '';
      img.width = 240;
      img.height = 320;
      img.loading = 'lazy';
      img.decoding = 'async';
      thumbBox.append(img);

      const meta = document.createElement('div');
      meta.className = 'gal-meta';

      const name = document.createElement('span');
      name.className = 'gal-name';
      name.textContent = patternName(def.id, lang);

      const family = document.createElement('span');
      family.className = 'gal-family';
      family.textContent = familyLabel(def.family, lang);

      meta.append(name, family);
      card.append(thumbBox, meta);

      if (!reduceMotion) {
        card.classList.add('gal-card-pending');
        const reveal = (): void => {
          if (!card.classList.contains('gal-card-pending')) return;
          card.style.transitionDelay = `${Math.min(revealed++, 8) * 45}ms`;
          card.classList.remove('gal-card-pending');
        };
        if (img.complete) reveal();
        else {
          img.addEventListener('load', reveal, { once: true });
          img.addEventListener('error', reveal, { once: true });
          window.setTimeout(reveal, 2000);
        }
      }

      grid.append(card);
    }
  }

  renderChips();
  renderGrid();

  root.append(topbar, hero, chipsRow, grid, buildFooter(lang));
}
