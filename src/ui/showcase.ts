import { SHOWCASE, SHOWCASE_POSTERS, SHOWCASE_VIDEOS, type ShowcaseEntry, type ShowcaseVideo } from '../content/showcase';
import { decodeState } from '../core/url-state';
import { currentLang, patternName, t, type Lang } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';
import { renderThumb, onVisible, stopThumbWorker } from './thumb';
import { openModal } from './modal';

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
function videoBaseName(entry: ShowcaseVideo, lang: Lang): string | null {
  if (entry.title) return entry.title[lang === 'es' ? 1 : 0];
  if (!entry.hash) return null;
  const state = decodeState(entry.hash);
  return state ? patternName(state.patternId, lang) : null;
}

/** The grid card's label: the work, qualified as a song where one plays. The
 *  grid is tight, so it takes the single translated word and leaves the full
 *  credit to the modal. */
function videoCardName(entry: ShowcaseVideo, lang: Lang): string | null {
  const base = videoBaseName(entry, lang);
  if (!base) return null;
  return entry.credit ? `${base} — ${t('show.song', lang)}` : base;
}

/** The modal's title. It has the width the card does not, so a song is
 *  credited in full here. */
function videoModalTitle(entry: ShowcaseVideo, lang: Lang): string | null {
  const base = videoBaseName(entry, lang);
  if (!base) return null;
  return entry.credit ? `${base} — ${entry.credit[lang === 'es' ? 1 : 0]}` : base;
}

/** Builds the video element and — where `entry.hash` names one — the link
 *  through to the live stage, and opens both inside a single-tab modal.
 *  Kept as one function rather than split across `render`/`onClose`
 *  callbacks: the video element is created once, up front, so both the tab's
 *  `render` (which needs it to append) and `onClose` (which needs it to
 *  pause) close over the same reference instead of re-querying the DOM. */
function openVideoModal(entry: ShowcaseVideo, lang: Lang): void {
  let video: HTMLVideoElement | undefined;

  function render(): HTMLElement {
    const v = document.createElement('video');
    v.src = entry.src;
    v.poster = entry.poster;
    v.controls = true;   // native controls carry fullscreen, which is the requirement
    v.autoplay = true;   // user-initiated by the click that opened this modal
    v.playsInline = true;
    v.preload = 'auto';
    v.className = 'modal-video';
    // Rejects with AbortError/NotAllowedError in some contexts (data-saver
    // mode, an unusual autoplay policy) even though this is a user gesture.
    // The native controls are the fallback for that case, not an error.
    v.play().catch(() => {});
    video = v;

    const wrap = document.createElement('div');
    wrap.className = 'modal-video-wrap';
    wrap.append(v);

    if (entry.hash) {
      const link = document.createElement('a');
      link.className = 'modal-video-link';
      link.href = entry.hash;
      link.textContent = t('show.openStage', lang);
      // Leaving for the live stage must not strand this modal — and its
      // playing audio — stacked on top of the page it navigates to. Reusing
      // the Escape handling `modal.ts` already wires up avoids a second,
      // parallel close path.
      link.addEventListener('click', () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      wrap.append(link);
    }
    return wrap;
  }

  const title = videoModalTitle(entry, lang) ?? t('show.tabVideos', lang);
  openModal({
    title,
    tabs: [{ id: 'video', label: title, render }],
    // DOM removal alone is not reliably synchronous for stopping a playing,
    // audible <video> across every browser — pause explicitly so sound never
    // survives the modal closing.
    onClose: () => video?.pause(),
  });
}

/** A video card: a still poster plus a play affordance. No `<video>` in the
 *  grid at all — the point of this design is that the grid never fetches a
 *  single byte of video until someone asks for it. Clicking (or activating
 *  by keyboard) opens the full recording, with sound, in a modal. */
function buildVideoCard(entry: ShowcaseVideo, lang: Lang): HTMLElement {
  const name = videoCardName(entry, lang);

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'gal-card gal-card-video';
  card.setAttribute('aria-label', name ? `${t('show.play', lang)} ${name}` : t('show.play', lang));
  card.addEventListener('click', () => openVideoModal(entry, lang));

  const box = document.createElement('div');
  box.className = 'gal-thumb show-thumb';

  const img = document.createElement('img');
  img.src = entry.poster;
  img.alt = '';
  img.loading = 'lazy';
  box.append(img);

  const play = document.createElement('span');
  play.className = 'gal-play';
  play.setAttribute('aria-hidden', 'true');
  box.append(play);

  card.append(box);

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
    if (SHOWCASE_VIDEOS.length === 0) empty();
    else for (const entry of SHOWCASE_VIDEOS) grid.append(buildVideoCard(entry, lang));
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
    stopThumbWorker();
  };
}
