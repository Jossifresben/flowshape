import { SHOWCASE, type ShowcaseEntry } from '../content/showcase';
import { decodeState } from '../core/url-state';
import { currentLang, patternName, t, type Lang } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';
import { renderThumb, onVisible, stopThumbWorker } from './thumb';

/**
 * `#/gallery` — the curated showcase: hand-picked designs from
 * `content/showcase.ts`, rendered live with the same thumbnail renderer as
 * `#/saved`. Named `showcase` internally (not `gallery`) because
 * `src/ui/gallery.ts` and its `.gal-*` classes already are the pattern grid —
 * this view reuses that markup but is a different module so the two
 * "galleries" in the codebase stay unambiguous. The navbar label is Gallery.
 */

/** Fisher–Yates, in place on a copy — `SHOWCASE` is an exported const the
 *  test suite also imports, so it is never mutated here. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Shuffled once per page load and then held: the router re-mounts this view
 *  on every return to #/gallery and on every language switch, and
 *  reshuffling under the visitor each time would lose their place in a grid
 *  they are reading. A new visit is a new order; a navigation is not.
 *  `Math.random`, deliberately — this is view ordering, not pattern
 *  generation, so it must NOT go through `core/prng`'s seeded generator,
 *  which exists to make artwork reproducible. The whole point here is that
 *  the order differs per visit. */
const ORDER: ShowcaseEntry[] = shuffle(SHOWCASE);

/** A card's display name: the curator's own title when set, otherwise the
 *  pattern's plain name — never `autoTitle`, which appends the seed. The
 *  seed is a detail the visitor never chose, so it is noise on a page they
 *  are browsing rather than editing. */
function cardName(entry: ShowcaseEntry, lang: Lang): string {
  if (entry.title) return entry.title[lang === 'es' ? 1 : 0];
  const state = decodeState(entry.hash);
  return state ? patternName(state.patternId, lang) : entry.hash;
}

function buildCard(entry: ShowcaseEntry, lang: Lang, observer: IntersectionObserver): HTMLElement {
  const card = document.createElement('a');
  card.className = 'gal-card';
  card.href = entry.hash;

  const box = document.createElement('div');
  box.className = 'gal-thumb show-thumb';
  // Rendering is deferred to the observer: a card off screen costs nothing,
  // and the one heavy pattern in the list only pays its ~660ms when scrolled
  // into view.
  (box as HTMLElement & { render?: () => void }).render = () => renderThumb(box, entry.hash, lang);
  observer.observe(box);

  const name = document.createElement('span');
  name.className = 'gal-name';
  name.textContent = cardName(entry, lang);

  card.append(box, name);
  return card;
}

/** Mounts the curated gallery. Returns a teardown, because this view
 *  registers an IntersectionObserver and uses the shared thumbnail worker —
 *  both must not outlive it, exactly as `mountSaved` requires. */
export function mountShowcase(root: HTMLElement): () => void {
  const lang = currentLang();
  root.innerHTML = '';
  document.documentElement.lang = lang;

  const head = document.createElement('div');
  head.className = 'show-head';
  const heading = document.createElement('h1');
  heading.className = 'show-title';
  heading.textContent = t('show.title', lang);
  const subtitle = document.createElement('p');
  subtitle.className = 'show-subtitle';
  subtitle.textContent = t('show.subtitle', lang);
  head.append(heading, subtitle);

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  const observer = new IntersectionObserver(onVisible, { rootMargin: '200px' });

  if (ORDER.length === 0) {
    const p = document.createElement('p');
    p.className = 'show-empty';
    p.textContent = t('show.empty', lang);
    grid.append(p);
  } else {
    for (const entry of ORDER) grid.append(buildCard(entry, lang, observer));
  }

  root.append(buildNav(lang, 'gallery'), head, grid, buildFooter(lang));

  return () => {
    observer.disconnect();
    stopThumbWorker();
  };
}
