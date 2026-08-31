/**
 * DEV-only: `#/dev/spike` — the three field-pattern candidates (linefield,
 * nodegarden, interference) on the REAL animate stage, toggleable, with the
 * DEMO tracks available.
 *
 * The spike patterns are imported here (which registers them) and nowhere
 * else: patterns/index.ts does not know them, so the gallery, the worker
 * manifest, and the production bundle stay untouched. Presets live in the
 * local table below — routes through real ParamDefs, resolved by the same
 * applyRoutes as every registered preset; PRESETS_BY_PATTERN is not touched.
 *
 * Taxonomy (per the house convention — see src/anim/presets.ts's NEVER_ROUTE
 * discipline): each pattern's chaotic params re-seat the whole composition
 * (linefield `cells`/`vortices` reshuffle the vortex/wave seed streams,
 * nodegarden `cell` re-lays the whole lattice, interference `lines` changes
 * the sample count) — none of the three are routed here, continuous or
 * step. Every route below rides a smooth axis instead: linefield
 * swirl/waviness/warp, nodegarden radius/drift, interference
 * amplitude/frequency/separation (plus the universal strokeWidth/opacity/
 * size and each pattern's own remaining smooth knobs). See each preset's
 * comment for the swing = depth × (max−min) arithmetic and why that number
 * was chosen — every route was eyeballed at its extreme via generate()
 * before being set (see scratch swing-check, not part of this commit).
 */
import { linefield } from '../patterns/linefield';
import { nodegarden } from '../patterns/nodegarden';
import { interference } from '../patterns/interference';
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
  for (const def of [linefield, nodegarden, interference]) {
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
  [linefield.id]: [
    // Vortex: swirl is the field's own macro-structure knob (range 0..2) —
    // bass deepens the same rotation the intrinsic field already draws.
    // Swing 0.30 (depth 0.15) moves the default (1) a third of the way to
    // either wall without ever reaching the ε-only degenerate corner at 0.
    // The grid is fixed (1706 strokes at 1920x1080, verified unchanged
    // across every route below) — only orientation and the |V|-driven
    // opacity move; opacity stayed within [0.22, 0.92] at every extreme
    // tested, never near-invisible, never clipped.
    { id: 'vortex', label: { en: 'Vortex', es: 'Vórtice' }, routes: [
      { feature: 'bass', param: 'swirl', depth: 0.15 },
      { feature: 'high', param: 'strokeWidth', depth: 0.12 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    // Ripple: waviness (curl-wave amplitude, 0..1) bends the field's broad
    // S-curves; warp (0..1) is the domain pre-distortion. Both default well
    // under half their range, so a 0.25-0.30 swing stays inside a single
    // wall without ever forcing the field back toward the compass-circle
    // look warp=0 would read as.
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'mid', param: 'waviness', depth: 0.30 },
      { feature: 'bass', param: 'warp', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
  ],
  [nodegarden.id]: [
    // Bloom: radius sits at 64.5 with cell=72 — right at the graph's own
    // percolation threshold (edges: 471 total children at default, jumping
    // past 1000 by swing ~13; even swing 1 moves it noticeably). A full
    // house-convention depth (0.15+) shreds the sparse-network character
    // the pattern is built on, so this route uses a deliberately tiny depth
    // (0.03, swing 3.78) — measured 471 -> 597 children (+27%) at the full
    // extreme, a visible "bloom" of new edges on a bass hit without ever
    // reaching the dense-mesh look. strokeWidth/size are ordinary swings on
    // axes with no such sensitivity.
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'radius', depth: 0.03 },
      { feature: 'high', param: 'strokeWidth', depth: 0.25 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ] },
    // Drift: drift (0..30) displaces points along the noise field, but the
    // overlap guard clamps jitter+drift to `maxDisp` (≈9px at defaults)
    // regardless of the nominal value, so this axis self-limits — swing 12
    // (depth 0.4) measured only 471 -> 453 children, well inside safe
    // territory. edgeFade softens the boundary fade on bright passages
    // (timbre, per the bass/mid/high/level/bright convention).
    { id: 'drift', label: { en: 'Drift', es: 'Deriva' }, routes: [
      { feature: 'mid', param: 'drift', depth: 0.40 },
      { feature: 'bright', param: 'edgeFade', depth: 0.30 },
      { feature: 'level', param: 'opacity', depth: 0.15 },
    ] },
  ],
  [interference.id]: [
    // Braid: amplitude (2..200) is the pattern's own drama knob — bass
    // deepens the same crossing/braiding the default register already
    // relies on (measured y-excursion grew from [-268,1331] to [-326,1386],
    // a ~7% wider bleed, not a blowout). frequency needs care: its full
    // 0.002..0.06 span risks the aliasing the SAMPLES=420 budget guards
    // against (see interference.ts's header), so this route uses a small
    // depth (0.05, swing 0.0029) — measured near-identical to the default
    // fringe geometry, a shimmer rather than a re-grating.
    { id: 'braid', label: { en: 'Braid', es: 'Trenza' }, routes: [
      { feature: 'bass', param: 'amplitude', depth: 0.15 },
      { feature: 'high', param: 'frequency', depth: 0.05 },
      { feature: 'level', param: 'strokeWidth', depth: 0.20 },
    ] },
    // Drift: separation (200..8000, sources off-canvas by design) nudges
    // the source geometry without ever bringing the sources into frame —
    // swing 468 keeps them well past the off-canvas floor the pattern's
    // "no bullseye" invariant depends on. detune is the fringe-drift-speed
    // axis (0..0.5); bass deepening it reads as the braid speeding up on
    // the beat.
    { id: 'drift', label: { en: 'Drift', es: 'Deriva' }, routes: [
      { feature: 'mid', param: 'separation', depth: 0.06 },
      { feature: 'bass', param: 'detune', depth: 0.30 },
      { feature: 'level', param: 'opacity', depth: 0.20 },
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
  // A fixed overlay chip, not a flex child: as a sibling inside the animate
  // view's flex row it became a narrow left column and shoved the stage off
  // centre (the bug Jossi screenshotted).
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;top:12px;left:16px;z-index:40;display:flex;gap:8px;align-items:center;' +
    'padding:6px 10px;font:12px/1.4 monospace;color:#8e8e90;background:rgba(16,16,18,0.88);' +
    'border:1px solid #2e2e33;';
  const note = document.createElement('span');
  note.textContent = 'DEV SPIKE · field patterns —';
  bar.append(note);

  const stage = document.createElement('div');
  // display:contents so mountAnimate's own wrapper is laid out as a direct
  // child of #app.view-animate — the extra div otherwise defeats the view's
  // flex/descendant rules.
  stage.style.display = 'contents';
  let cleanup: (() => void) | null = null;
  let active = linefield.id;

  const buttons = new Map<string, HTMLButtonElement>();
  function show(id: string): void {
    active = id;
    cleanup?.();
    stage.innerHTML = '';
    cleanup = mountAnimate(stage, { state: stateFor(id), presets: SPIKE_PRESETS[id]! });
    for (const [bid, b] of buttons) b.style.fontWeight = bid === active ? 'bold' : 'normal';
  }
  for (const id of [linefield.id, nodegarden.id, interference.id]) {
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
