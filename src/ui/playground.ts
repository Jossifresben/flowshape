import { getPattern, defaultParams, clampParams, generateSafe, listPatterns, type PatternDef, type ParamDef } from '../patterns/registry';
import { randomParams } from '../patterns/randomize';
import { serialize, type SvgNode } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette, COLOR_DEFAULTS, type ColorState } from '../poster/palettes';
import { rememberState, forgetState } from '../core/persist';
import { PRESETS } from '../patterns/presets';
import { sliderRow, checkboxRow, selectRow } from './controls';
import { NAMES } from './gallery';

/** Synthetic ParamDefs so the four colour controls can reuse `sliderRow`.
 *  Their `label` has no '.' so `sliderRow`'s i18n-key splitting is a no-op
 *  and the text renders as-is. */
const COLOR_PARAM_DEFS: Record<keyof typeof COLOR_DEFAULTS, ParamDef> = {
  hue: { key: 'hue', kind: 'float', min: 0, max: 360, step: 1, default: COLOR_DEFAULTS.hue, label: 'HUE' },
  chroma: { key: 'chroma', kind: 'float', min: 0, max: 0.16, step: 0.005, default: COLOR_DEFAULTS.chroma, label: 'CHROMA' },
  paperL: { key: 'paperL', kind: 'float', min: 0.04, max: 0.96, step: 0.01, default: COLOR_DEFAULTS.paperL, label: 'PAPER' },
  accentShift: { key: 'accentShift', kind: 'float', min: 0, max: 180, step: 1, default: COLOR_DEFAULTS.accentShift, label: 'ACCENT SHIFT' },
};

const DEFAULT_STATE: AppState = {
  patternId: 'phyllotaxis',
  seed: 1,
  params: {},
  color: {},
  lang: 'en',
};

/** Mounts the playground into `root` and returns a cleanup function that
 * removes its listeners (used by the router when switching to another view). */
export function mountPlayground(root: HTMLElement): () => void {
  let state = decodeState(location.hash) ?? DEFAULT_STATE;
  let stage!: HTMLDivElement;
  let generation = 0;

  // Cache of the last generated (pre-colour) node tree, keyed on everything
  // that affects *geometry* (pattern, params, seed) but deliberately NOT
  // colour: colour is applied at serialize time, so a colour-only change can
  // re-serialize the cached tree instead of re-running generation (and, for
  // heavy patterns, the worker) from scratch.
  let lastNode: SvgNode | null = null;
  let lastKey = '';
  function nodeKey(): string {
    return JSON.stringify([state.patternId, state.params, state.seed]);
  }

  /** Writes the current state to the URL bar (without a history entry) and
   *  remembers it as this pattern's last-touched state for the gallery. */
  function syncUrl(): void {
    const hash = encodeState(state);
    history.replaceState(null, '', hash);
    rememberState(state.patternId, hash);
  }

  function setState(next: Partial<AppState>): void {
    generation++;
    state = { ...state, ...next };
    render();
    syncUrl();
  }

  let worker: Worker | null = null;
  let workerReq = 0;
  // At most one request in flight plus one pending: while the worker is busy,
  // a new request overwrites `pendingRequest` instead of queuing behind it,
  // so a drag can never build an unbounded backlog. On response, the pending
  // request (the LAST one the user made) is dispatched immediately.
  let workerBusy = false;
  let pendingRequest: (() => void) | null = null;

  function dispatchPending(): void {
    if (!pendingRequest) return;
    const next = pendingRequest;
    pendingRequest = null;
    next();
  }

  function dispatchToWorker(onNode: (node: SvgNode) => void): void {
    workerBusy = true;
    const myGeneration = generation;
    const myKey = nodeKey();
    const target = stage;
    const id = ++workerReq;
    worker!.onmessage = (e: MessageEvent<{ id: number; node: SvgNode | null; error?: string }>) => {
      // Always free the worker (and dispatch whatever is pending) first, so a
      // stale/discarded response or a failure can never wedge the queue.
      workerBusy = false;
      dispatchPending();
      if (e.data.id !== workerReq || myGeneration !== generation || target !== stage) return;
      target.classList.remove('computing');
      if (!e.data.node) {
        target.innerHTML = '';
        target.textContent = 'Could not render this pattern.';
        return;
      }
      lastNode = e.data.node;
      lastKey = myKey;
      onNode(e.data.node);
    };
    worker!.postMessage({ id, patternId: state.patternId, params: state.params, seed: state.seed, size: { w: 600, h: 840 } });
  }

  function computeInWorker(onNode: (node: SvgNode) => void): void {
    if (!worker) {
      worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
      worker.onerror = () => {
        workerBusy = false;
        stage.classList.remove('computing');
        stage.innerHTML = '';
        stage.textContent = 'Could not render this pattern.';
        dispatchPending();
      };
    }
    if (workerBusy) {
      pendingRequest = () => dispatchToWorker(onNode);
      return;
    }
    dispatchToWorker(onNode);
  }

  function fillStage(def: PatternDef): void {
    const pal = resolvePalette(state.color);
    const key = nodeKey();
    if (lastNode && key === lastKey) {
      // Geometry is unchanged (only colour differs) — skip generation
      // entirely (worker included) and just re-serialize the cached tree.
      stage.classList.remove('computing');
      stage.innerHTML = serialize(lastNode, pal);
      return;
    }
    if (def.heavy) {
      stage.classList.add('computing');
      computeInWorker((node) => {
        stage.innerHTML = serialize(node, resolvePalette(state.color));
      });
    } else {
      const node = generateSafe(def, state.params, state.seed, { w: 600, h: 840 });
      lastNode = node;
      lastKey = key;
      stage.innerHTML = serialize(node, pal);
    }
  }

  let rafId = 0;
  function renderStage(): void {
    const def = getPattern(state.patternId);
    if (!def) return;
    fillStage(def);
  }
  function setParam(key: string, v: number): void {
    generation++;
    state = { ...state, params: { ...state.params, [key]: v } };
    syncUrl();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { rafId = 0; renderStage(); });
  }
  function setColor(key: keyof ColorState, v: number): void {
    generation++;
    state = { ...state, color: { ...state.color, [key]: v } };
    syncUrl();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { rafId = 0; renderStage(); });
  }

  function render(): void {
    const def = getPattern(state.patternId);
    if (!def) {
      root.textContent = 'Unknown pattern';
      return;
    }
    const params = clampParams(def, { ...defaultParams(def), ...state.params });
    state = { ...state, params };
    root.innerHTML = '';

    stage = document.createElement('div');
    stage.className = 'stage';
    fillStage(def);

    const panel = document.createElement('div');
    panel.className = 'panel';

    const backLink = document.createElement('a');
    backLink.className = 'gal-back-link';
    backLink.href = '#/';
    backLink.textContent = '← All patterns';
    panel.append(backLink);

    const patternSel = document.createElement('select');
    patternSel.className = 'ctl-select';
    for (const def2 of listPatterns().filter((x) => x.phase === 1).sort((a, b) => a.id.localeCompare(b.id))) {
      const o = document.createElement('option');
      o.value = def2.id;
      o.textContent = NAMES[def2.id] ?? def2.id;
      if (def2.id === state.patternId) o.selected = true;
      patternSel.append(o);
    }
    patternSel.addEventListener('change', () =>
      setState({ patternId: patternSel.value, params: {} }),
    );
    panel.append(patternSel);

    const seedRow = document.createElement('div');
    seedRow.className = 'ctl-row';
    if (def.usesSeed) {
      const seedVal = document.createElement('span');
      seedVal.className = 'ctl-value';
      seedVal.textContent = `SEED ${state.seed}`;
      seedRow.append(seedVal);
    }
    const rand = document.createElement('button');
    rand.className = 'btn';
    rand.textContent = 'Randomize';
    rand.addEventListener('click', () => {
      if (def.usesSeed) {
        setState({ seed: 1 + Math.floor(Math.random() * 99999) });
      } else {
        setState({ params: randomParams(def, Math.random, state.params) });
      }
    });
    seedRow.append(rand);
    panel.append(seedRow);

    const orderedParams = [...def.params].sort((a, b) =>
      (a.key === 'size' ? -1 : 0) - (b.key === 'size' ? -1 : 0),
    );
    for (const pd of orderedParams) {
      const v = params[pd.key]!;
      if (pd.kind === 'bool') {
        panel.append(checkboxRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else if (pd.kind === 'enum') {
        panel.append(selectRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else {
        panel.append(sliderRow(pd, v, (nv) => setParam(pd.key, nv)));
      }
    }
    const colorHeading = document.createElement('div');
    colorHeading.className = 'ctl-section-heading';
    colorHeading.textContent = 'COLOUR';
    panel.append(colorHeading);

    for (const key of ['hue', 'chroma', 'paperL', 'accentShift'] as const) {
      const def2 = COLOR_PARAM_DEFS[key];
      const v = state.color[key] ?? COLOR_DEFAULTS[key];
      panel.append(sliderRow(def2, v, (nv) => setColor(key, nv)));
    }

    // Once a pattern's state has been remembered (any change), the gallery
    // card for it points at that remembered state instead of the curated
    // preset — so give a way back for patterns that have one.
    const preset = PRESETS[state.patternId];
    if (preset) {
      const resetRow = document.createElement('div');
      resetRow.className = 'ctl-row';
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn';
      resetBtn.textContent = 'Reset to sample';
      resetBtn.addEventListener('click', () => {
        forgetState(state.patternId);
        setState({ seed: preset.seed ?? 1, params: preset.params ?? {}, color: preset.color ?? {} });
      });
      resetRow.append(resetBtn);
      panel.append(resetRow);
    }

    root.append(stage, panel);
  }

  function onHashChange(): void {
    generation++;
    state = decodeState(location.hash) ?? DEFAULT_STATE;
    render();
    syncUrl();
  }
  window.addEventListener('hashchange', onHashChange);
  render();
  syncUrl();

  return () => {
    window.removeEventListener('hashchange', onHashChange);
  };
}
