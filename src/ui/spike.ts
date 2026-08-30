/**
 * DEV-only: `#/dev/spike` — the two next-curve candidates (knot, hyperweave)
 * on the REAL animate stage, toggleable, with the DEMO tracks available.
 *
 * The spike patterns are imported here (which registers them) and nowhere
 * else: patterns/index.ts does not know them, so the gallery, the worker
 * manifest, and the production bundle stay untouched. Presets live in the
 * local table below — routes through real ParamDefs, resolved by the same
 * applyRoutes as every registered preset; PRESETS_BY_PATTERN is not touched.
 */
import { knot } from '../patterns/knot';
import { hyperweave } from '../patterns/hyperweave';
import { defaultParams, generateSafe } from '../patterns/registry';
import { drawTree } from '../anim/canvas-render';
import type { AnimPreset } from '../anim/presets';
import type { AppState } from '../core/url-state';
import { mountAnimate } from './animate';

/** DEV bench: generate+draw cost at the 16:9 stage's real geometry
 *  (1920×1080 canvas, user units /1.8). Call from the console:
 *  `await __spikeBench()`. Deterministic phases, 240 frames per pattern. */
declare global { interface Window { __spikeBench?: () => Promise<Record<string, { p50: number; p99: number }>> } }
window.__spikeBench = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1920; canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;
  const pal = { paper: '#141414', ink: '#e8e8e8', accent: '#e3261a' };
  const out: Record<string, { p50: number; p99: number }> = {};
  for (const def of [knot, hyperweave]) {
    const times: number[] = [];
    for (let i = 0; i < 240; i++) {
      const t0 = performance.now();
      const node = generateSafe(def, { ...defaultParams(def), phase: (i / 240) % 1 }, 5, { w: 1920 / 1.8, h: 1080 / 1.8 });
      ctx.setTransform(1.8, 0, 0, 1.8, 0, 0);
      drawTree(ctx, node, pal);
      times.push(performance.now() - t0);
      if (i % 60 === 59) await new Promise((r) => setTimeout(r, 0));
    }
    times.sort((a, b) => a - b);
    out[def.id] = { p50: times[120]!, p99: times[237]! };
  }
  return out;
};

const SPIKE_PRESETS: Record<string, AnimPreset[]> = {
  [knot.id]: [
    // `breathe` is the amplitude axis the intrinsic motion already rides,
    // so bass pushes the same swell the phase flow produces; `depth` on
    // brightness makes the over/under contrast sharpen on bright passages.
    { id: 'tumble', label: { en: 'Tumble', es: 'Voltereta' }, routes: [
      { feature: 'bass', param: 'breathe', depth: 0.4 },
      { feature: 'bright', param: 'depth', depth: 0.25 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'deep', label: { en: 'Deep', es: 'Fondo' }, routes: [
      { feature: 'level', param: 'depth', depth: 0.45 },
      { feature: 'mid', param: 'opacity', depth: 0.4 },
    ] },
  ],
  [hyperweave.id]: [
    // `wobble` is the ripple the intrinsic motion already rides — bass
    // deepens the same shimmer; the figure's arcs never lose the theorem.
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'bass', param: 'wobble', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    { id: 'engrave', label: { en: 'Engrave', es: 'Graba' }, routes: [
      { feature: 'level', param: 'wobble', depth: 0.3 },
      { feature: 'mid', param: 'opacity', depth: 0.4 },
      { feature: 'bright', param: 'strokeWidth', depth: 0.2 },
    ] },
  ],
};

function stateFor(patternId: string): AppState {
  return { patternId, seed: 5, params: {}, color: {}, lang: 'en', view: 'a' };
}

export function mountSpike(root: HTMLElement): () => void {
  root.innerHTML = '';
  // The router's setView is private to main.ts; the animate stage's layout
  // hangs off this class, so apply it here and drop it on cleanup.
  root.classList.add('view-animate');
  const bar = document.createElement('div');
  bar.style.cssText =
    'display:flex;gap:8px;align-items:center;padding:8px 16px;font:12px/1.4 monospace;';
  const note = document.createElement('span');
  note.textContent = 'DEV SPIKE · next curve —';
  bar.append(note);

  const stage = document.createElement('div');
  let cleanup: (() => void) | null = null;
  let active = knot.id;

  const buttons = new Map<string, HTMLButtonElement>();
  function show(id: string): void {
    active = id;
    cleanup?.();
    stage.innerHTML = '';
    cleanup = mountAnimate(stage, { state: stateFor(id), presets: SPIKE_PRESETS[id]! });
    for (const [bid, b] of buttons) b.style.fontWeight = bid === active ? 'bold' : 'normal';
  }
  for (const id of [knot.id, hyperweave.id]) {
    const b = document.createElement('button');
    b.textContent = id.toUpperCase();
    b.style.cssText = 'font:inherit;padding:2px 10px;cursor:pointer;';
    b.addEventListener('click', () => show(id));
    buttons.set(id, b);
    bar.append(b);
  }

  root.append(bar, stage);
  show(active);
  return () => { cleanup?.(); root.classList.remove('view-animate'); };
}
