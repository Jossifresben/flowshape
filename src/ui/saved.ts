import { list, readState, reset } from '../core/saved';
import { currentLang, t, type Lang } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';
import { decodeState } from '../core/url-state';
import { getPattern, generateSafe } from '../patterns/registry';
import { serialize, type SvgNode } from '../core/svg';
import { resolvePalette } from '../poster/palettes';
import { renderSize } from '../poster/formats';
import { AnimWorkerClient } from '../anim/worker-client';
// `kind` is derived from the hash, never stored — a stored copy could contradict it.
import { kindOf, type SavedItem, type Kind } from '../core/saved';

let worker: AnimWorkerClient | null = null;
const queue: Array<() => void> = [];
let busy = false;

function pump(): void {
  if (busy) return;
  const next = queue.shift();
  if (!next) return;
  busy = true;
  next();
}

/** One shared worker for the whole page, one request at a time. A saved grid
 *  can hold many heavy items and each is a full generation, so they are
 *  serialised rather than raced. Built on `AnimWorkerClient` — the id-
 *  correlated wrapper the animation stage already uses against
 *  `compute.worker.ts` — rather than a second hand-rolled `postMessage`
 *  protocol. */
function computeHeavy(
  patternId: string, params: Record<string, number>, seed: number,
  size: { w: number; h: number }, onNode: (node: SvgNode | null) => void,
): void {
  queue.push(() => {
    worker ??= new AnimWorkerClient();
    worker.request(patternId, params, seed, size).then((node) => {
      busy = false;
      onNode(node);
      pump();
    });
  });
  pump();
}

/** Terminates the shared worker. Called from the view's teardown so leaving
 *  the page does not leave a thread running. */
export function stopSavedWorker(): void {
  worker?.dispose();
  worker = null;
  queue.length = 0;
  busy = false;
}

/** Mounts the saved page. Returns a teardown, because this view registers a
 *  `storage` listener and an IntersectionObserver that must not outlive it. */
export function mountSaved(root: HTMLElement): () => void {
  const lang = currentLang();
  root.innerHTML = '';
  document.documentElement.lang = lang;

  const head = document.createElement('div');
  head.className = 'saved-head';
  const heading = document.createElement('h1');
  heading.className = 'saved-title';
  heading.textContent = t('saved.title', lang);
  const count = document.createElement('span');
  count.className = 'saved-count';
  head.append(heading, count);

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  const notice = document.createElement('div');
  notice.className = 'saved-notice';

  let observer = new IntersectionObserver(onVisible, { rootMargin: '200px' });

  // `readState()` reports only what READING found, so 'quota' cannot appear
  // here — a full store still reads fine. Quota is reported by the star, from
  // the failed write's own Result.
  const NOTICE_KEY: Record<string, string> = {
    corrupt: 'saved.corrupt', future: 'saved.future',
  };

  function renderNotice(): void {
    notice.innerHTML = '';
    const state = readState();
    if (state === 'ok') return;
    const p = document.createElement('p');
    p.textContent = t(NOTICE_KEY[state] ?? 'fav.unavailable', lang);
    notice.append(p);
    // Only a store this build cannot parse gets the destructive recovery. A
    // 'future' store is intact and readable by a newer bundle — offering a
    // reset there would let a stale cache destroy perfectly good work.
    if (state !== 'corrupt') return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = t('saved.reset', lang);
    // The only destructive operation in the feature, and only ever reached
    // through this explicit choice — nothing else discards an unreadable store.
    btn.addEventListener('click', () => { reset(); render(); });
    notice.append(btn);
  }

  function renderEmpty(): void {
    const wrap = document.createElement('div');
    wrap.className = 'saved-empty';
    const p = document.createElement('p');
    p.textContent = t('saved.empty', lang);
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = '#/';
    a.textContent = t('saved.emptyCta', lang);
    wrap.append(p, a);
    grid.append(wrap);
  }

  function render(): void {
    const items = list();
    count.textContent = `${items.length} ${t('saved.count', lang)}`;
    observer.disconnect();
    observer = new IntersectionObserver(onVisible, { rootMargin: '200px' });
    grid.innerHTML = '';
    renderNotice();
    if (items.length === 0) { renderEmpty(); return; }
    for (const item of items) grid.append(buildCard(item, lang, observer));
  }

  render();
  root.append(buildNav(lang, 'saved'), head, notice, grid, buildFooter(lang));

  return () => { observer.disconnect(); stopSavedWorker(); };
}

const KIND_KEY: Record<Kind, string> = {
  p: 'saved.kindP', a: 'saved.kindA', c: 'saved.kindC',
};

/** The render size a saved hash implies. Designs and posters follow their
 *  paper format; an animation follows its stage aspect. Both go through the
 *  same normalised short edge, so a card is one code path. */
function sizeFor(state: NonNullable<ReturnType<typeof decodeState>>): { w: number; h: number } {
  if (state.view !== 'a') return renderSize(state);
  const stage = state.stage ?? '169';
  const ratio = stage === '169' ? 16 / 9 : stage === '916' ? 9 / 16 : 1;
  return ratio >= 1 ? { w: Math.round(600 * ratio), h: 600 } : { w: 600, h: Math.round(600 / ratio) };
}

/** Renders a saved item's artwork, live. A `heavy` pattern (currently just
 *  `diffgrowth`) is routed through the shared compute worker instead of
 *  running inline: at default params it costs ~660ms and on a real saved
 *  hash with non-default params it has measured over 4s on the main thread,
 *  against a few ms for every other pattern — inline, one heavy card would
 *  freeze the whole grid while it computes. */
function renderThumb(box: HTMLElement, item: SavedItem, lang: Lang): void {
  const state = decodeState(item.hash);
  const def = state ? getPattern(state.patternId) : undefined;
  if (!state || !def) {
    box.classList.add('gone');
    box.textContent = t('saved.gone', lang);
    return;
  }
  const size = sizeFor(state);
  box.style.aspectRatio = `${size.w} / ${size.h}`;
  if (def.heavy) {
    box.classList.add('computing');
    computeHeavy(state.patternId, state.params, state.seed, size, (node) => {
      box.classList.remove('computing');
      if (!node) { box.classList.add('gone'); box.textContent = t('saved.gone', lang); return; }
      box.innerHTML = serialize(node, resolvePalette(state.color));
    });
    return;
  }
  try {
    const node = generateSafe(def, state.params, state.seed, size);
    box.innerHTML = serialize(node, resolvePalette(state.color));
  } catch {
    box.classList.add('gone');
    box.textContent = t('saved.gone', lang);
  }
}

/** Renders a card the first time it comes near the viewport, then stops
 *  watching it — a card is generated once per mount, never again on scroll. */
function onVisible(entries: IntersectionObserverEntry[], obs: IntersectionObserver): void {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target as HTMLElement & { render?: () => void };
    obs.unobserve(el);
    el.render?.();
  }
}

function buildCard(item: SavedItem, lang: Lang, observer: IntersectionObserver): HTMLElement {
  const card = document.createElement('div');
  card.className = 'gal-card saved-card';

  const link = document.createElement('a');
  link.className = 'saved-link';
  link.href = item.hash;

  const box = document.createElement('div');
  box.className = 'gal-thumb saved-thumb';
  // Rendering is deferred to the observer: a card off screen costs nothing,
  // and a saved card costs exactly what its playground render cost.
  (box as HTMLElement & { render?: () => void }).render = () => renderThumb(box, item, lang);
  observer.observe(box);

  const meta = document.createElement('div');
  meta.className = 'gal-meta';
  const name = document.createElement('span');
  name.className = 'gal-name saved-name';
  name.textContent = item.title;
  const kind = document.createElement('span');
  kind.className = 'gal-family';
  kind.textContent = t(KIND_KEY[kindOf(item.hash)!], lang);
  meta.append(name, kind);

  link.append(box);
  card.append(link, meta);
  return card;
}
