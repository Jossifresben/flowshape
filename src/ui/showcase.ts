import { SHOWCASE, SHOWCASE_POSTERS, SHOWCASE_VIDEOS, type ShowcaseEntry, type ShowcaseVideo } from '../content/showcase';
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
 *
 * Three categories share the route: designs (`#/gallery`), posters
 * (`#/gallery/posters`) and videos (`#/gallery/videos`). `main.ts` matches the
 * whole `#/gallery*` prefix and leaves the segment to this module, so a tab
 * switch is an ordinary hash navigation — shareable, and the back button
 * walks it like any other page.
 */

type Tab = 'designs' | 'posters' | 'videos';

/** The tab named by the URL. An unknown segment (including none) reads as
 *  designs — `mountShowcase` separately falls back off an empty category too,
 *  so a stale or hand-typed link never strands the visitor on a blank tab. */
function tabFromHash(hash: string): Tab {
  const seg = hash.slice('#/gallery'.length).replace(/^\/+/, '').split(/[?#]/)[0];
  if (seg === 'posters') return 'posters';
  if (seg === 'videos') return 'videos';
  return 'designs';
}

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
 *  are browsing rather than editing. Shared by designs and posters — both
 *  are `ShowcaseEntry`, so both name the same way. */
function cardName(entry: ShowcaseEntry, lang: Lang): string {
  if (entry.title) return entry.title[lang === 'es' ? 1 : 0];
  const state = decodeState(entry.hash);
  return state ? patternName(state.patternId, lang) : entry.hash;
}

/** A design or poster card. `renderThumb` already special-cases a `#/c/`
 *  hash through the composer (see `thumb.ts`), so this one function serves
 *  both tabs — a poster entry needs no render code of its own. */
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

/** A video card's display name: the curator's title, or the pattern name
 *  behind its `hash` link when set, or nothing — a video need not name a
 *  pattern the way a design or poster always does. */
function videoCardName(entry: ShowcaseVideo, lang: Lang): string | null {
  if (entry.title) return entry.title[lang === 'es' ? 1 : 0];
  if (!entry.hash) return null;
  const state = decodeState(entry.hash);
  return state ? patternName(state.patternId, lang) : null;
}

/** Plays a video card while it is in view and pauses it on the way out.
 *  Forked from `thumb.ts`'s `onVisible` rather than reusing it: that
 *  callback unobserves after the first render because a design/poster's
 *  artwork is generated once and never changes, but a video must keep being
 *  watched for the whole time its card exists so it can pause again on
 *  exit — parameterising the shared callback for one caller's opposite
 *  lifecycle would be a worse trade than a second, five-line function. */
function onVideoVisible(entries: IntersectionObserverEntry[]): void {
  for (const entry of entries) {
    const v = entry.target as HTMLVideoElement;
    if (entry.isIntersecting) {
      // Rejects when autoplay is refused (data-saver, a backgrounded tab).
      // The poster frame is the fallback for that case, not an error.
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }
}

function buildVideoCard(entry: ShowcaseVideo, lang: Lang, observer: IntersectionObserver): HTMLElement {
  const card = document.createElement(entry.hash ? 'a' : 'div');
  card.className = 'gal-card';
  if (entry.hash) (card as HTMLAnchorElement).href = entry.hash;

  const box = document.createElement('div');
  box.className = 'gal-thumb show-thumb';

  const v = document.createElement('video');
  v.src = entry.src;
  v.poster = entry.poster;
  v.muted = true;        // browsers refuse unmuted autoplay, and a page of
  v.loop = true;          // competing soundtracks is hostile regardless
  v.playsInline = true;
  v.preload = 'none';    // a grid of videos must not download megabytes on load
  box.append(v);
  observer.observe(v);

  card.append(box);

  const name = videoCardName(entry, lang);
  if (name) {
    const label = document.createElement('span');
    label.className = 'gal-name';
    label.textContent = name;
    card.append(label);
  }

  return card;
}

/** The tab bar. Reuses the pattern grid's `.gal-chips` / `.gal-chip` /
 *  `.active` styling so the two galleries read as one site. Each chip is a
 *  real link, not a click handler that mutates local state — selecting a tab
 *  must change `location.hash` and let the router re-mount the view, so the
 *  tab is shareable and the back button walks it. Only a non-empty category
 *  gets a chip: an empty Posters or Videos tab is not something to ship, it
 *  should simply not exist yet. */
function buildTabs(lang: Lang, active: Tab, nonEmpty: Record<Tab, boolean>): HTMLElement {
  const row = document.createElement('div');
  row.className = 'gal-chips';
  const make = (tab: Tab, href: string, label: string): void => {
    if (!nonEmpty[tab]) return;
    const a = document.createElement('a');
    a.className = 'gal-chip' + (active === tab ? ' active' : '');
    a.href = href;
    a.textContent = label;
    row.append(a);
  };
  make('designs', '#/gallery', t('show.tabDesigns', lang));
  make('posters', '#/gallery/posters', t('show.tabPosters', lang));
  make('videos', '#/gallery/videos', t('show.tabVideos', lang));
  return row;
}

/** Mounts the curated gallery. Returns a teardown, because this view
 *  registers an IntersectionObserver and uses the shared thumbnail worker —
 *  both must not outlive it, exactly as `mountSaved` requires. */
export function mountShowcase(root: HTMLElement): () => void {
  const lang = currentLang();
  root.innerHTML = '';
  document.documentElement.lang = lang;

  const nonEmpty: Record<Tab, boolean> = {
    designs: SHOWCASE.length > 0,
    posters: SHOWCASE_POSTERS.length > 0,
    videos: SHOWCASE_VIDEOS.length > 0,
  };
  const nonEmptyCount = Object.values(nonEmpty).filter(Boolean).length;

  // An unknown segment, or one naming a category with nothing in it yet,
  // falls back to designs — a direct link to `#/gallery/videos` before any
  // video is curated must not strand the visitor on a bar-less empty page.
  let tab = tabFromHash(location.hash);
  if (!nonEmpty[tab]) tab = 'designs';

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
  let videoObserver: IntersectionObserver | null = null;

  function empty(): void {
    const p = document.createElement('p');
    p.className = 'show-empty';
    p.textContent = t('show.empty', lang);
    grid.append(p);
  }

  if (tab === 'posters') {
    if (SHOWCASE_POSTERS.length === 0) empty();
    else for (const entry of SHOWCASE_POSTERS) grid.append(buildCard(entry, lang, observer));
  } else if (tab === 'videos') {
    videoObserver = new IntersectionObserver(onVideoVisible, { rootMargin: '200px' });
    if (SHOWCASE_VIDEOS.length === 0) empty();
    else for (const entry of SHOWCASE_VIDEOS) grid.append(buildVideoCard(entry, lang, videoObserver));
  } else if (ORDER.length === 0) {
    empty();
  } else {
    for (const entry of ORDER) grid.append(buildCard(entry, lang, observer));
  }

  const parts = [buildNav(lang, 'gallery'), head];
  // Only render the bar at all when more than one category has entries —
  // today that's just designs, so the page must look exactly as it did
  // before this feature existed.
  if (nonEmptyCount > 1) parts.push(buildTabs(lang, tab, nonEmpty));
  parts.push(grid, buildFooter(lang));
  root.append(...parts);

  return () => {
    observer.disconnect();
    videoObserver?.disconnect();
    stopThumbWorker();
  };
}
