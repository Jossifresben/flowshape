import { decodeState } from '../core/url-state';
import { getPattern, generateSafe } from '../patterns/registry';
import { serialize, type SvgNode } from '../core/svg';
import { resolvePalette } from '../poster/palettes';
import { renderSize } from '../poster/formats';
import { AnimWorkerClient } from '../anim/worker-client';
import { t, type Lang } from '../i18n';
// `composerThumb` special-cases a poster hash so a saved poster renders as
// its composition, not its bare artwork — see `renderThumb` below.
import { composerThumb } from './poster';

/**
 * The live thumbnail renderer shared by every grid of creation hashes:
 * `#/saved` (a visitor's own favourites) and `#/gallery` (the curated
 * showcase). Both mount many cards on one page and both can hold a `heavy`
 * pattern, so the worker queue below is shared rather than duplicated per
 * view.
 */

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

/** One shared worker for the whole page, one request at a time. A grid can
 *  hold many heavy items and each is a full generation, so they are
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

/** Terminates the shared worker. Called from a view's teardown so leaving
 *  the page does not leave a thread running. */
export function stopThumbWorker(): void {
  worker?.dispose();
  worker = null;
  queue.length = 0;
  busy = false;
}

/** The render size a saved hash implies. Designs and posters follow their
 *  paper format; an animation follows its stage aspect. Both go through the
 *  same normalised short edge, so a card is one code path. */
export function sizeFor(state: NonNullable<ReturnType<typeof decodeState>>): { w: number; h: number } {
  if (state.view !== 'a') return renderSize(state);
  const stage = state.stage ?? '169';
  const ratio = stage === '169' ? 16 / 9 : stage === '916' ? 9 / 16 : 1;
  return ratio >= 1 ? { w: Math.round(600 * ratio), h: 600 } : { w: 600, h: Math.round(600 / ratio) };
}

/** Renders a creation hash's artwork, live, into `box`. A `heavy` pattern
 *  (currently just `diffgrowth`) is routed through the shared compute worker
 *  instead of running inline: at default params it costs ~660ms and on a
 *  real saved hash with non-default params it has measured over 4s on the
 *  main thread, against a few ms for every other pattern — inline, one heavy
 *  card would freeze the whole grid while it computes. */
export function renderThumb(box: HTMLElement, hash: string, lang: Lang): void {
  const state = decodeState(hash);
  const def = state ? getPattern(state.patternId) : undefined;
  if (!state || !def) {
    box.classList.add('gone');
    box.textContent = t('saved.gone', lang);
    return;
  }
  const size = sizeFor(state);
  box.style.aspectRatio = `${size.w} / ${size.h}`;

  // A poster is its composition, not its artwork. Rendering the bare pattern
  // here made a saved poster byte-identical to the design it came from — same
  // SVG, same aspect, only the badge differing.
  if (state.view === 'c') {
    try {
      const svg = composerThumb(state);
      if (svg) { box.innerHTML = svg; return; }
    } catch {
      // Fall through to the plain artwork rather than showing nothing.
    }
  }
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
export function onVisible(entries: IntersectionObserverEntry[], obs: IntersectionObserver): void {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target as HTMLElement & { render?: () => void };
    obs.unobserve(el);
    el.render?.();
  }
}
