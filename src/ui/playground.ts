import { getPattern, defaultParams, clampParams, generateSafe, listPatterns, type PatternDef } from '../patterns/registry';
import { randomParams } from '../patterns/randomize';
import { serialize, type SvgNode } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import { sliderRow, paletteRow, checkboxRow, selectRow } from './controls';

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

  function setState(next: Partial<AppState>): void {
    generation++;
    state = { ...state, ...next };
    render();
    history.replaceState(null, '', encodeState(state));
  }

  let worker: Worker | null = null;
  let workerReq = 0;
  function computeInWorker(onNode: (node: SvgNode) => void): void {
    if (!worker) {
      worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
      worker.onerror = () => {
        stage.classList.remove('computing');
        stage.innerHTML = '';
        stage.textContent = 'Could not render this pattern.';
      };
    }
    const myGeneration = generation;
    const target = stage;
    const id = ++workerReq;
    worker.onmessage = (e: MessageEvent<{ id: number; node: SvgNode | null; error?: string }>) => {
      if (e.data.id !== workerReq || myGeneration !== generation || target !== stage) return;
      target.classList.remove('computing');
      if (!e.data.node) {
        target.innerHTML = '';
        target.textContent = 'Could not render this pattern.';
        return;
      }
      onNode(e.data.node);
    };
    worker.postMessage({ id, patternId: state.patternId, params: state.params, seed: state.seed, size: { w: 600, h: 840 } });
  }

  function fillStage(def: PatternDef): void {
    const pal = resolvePalette(state.color);
    stage.style.background = pal.paper;
    if (def.heavy) {
      stage.classList.add('computing');
      computeInWorker((node) => {
        stage.innerHTML = serialize(node, resolvePalette(state.color));
      });
    } else {
      stage.innerHTML = serialize(generateSafe(def, state.params, state.seed, { w: 600, h: 840 }), pal);
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
    history.replaceState(null, '', encodeState(state));
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
      o.textContent = def2.id;
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

    for (const pd of def.params) {
      const v = params[pd.key]!;
      if (pd.kind === 'bool') {
        panel.append(checkboxRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else if (pd.kind === 'enum') {
        panel.append(selectRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else {
        panel.append(sliderRow(pd, v, (nv) => setParam(pd.key, nv)));
      }
    }
    panel.append(paletteRow(state.color, (c) => setState({ color: c })));

    root.append(stage, panel);
  }

  function onHashChange(): void {
    generation++;
    state = decodeState(location.hash) ?? DEFAULT_STATE;
    render();
    history.replaceState(null, '', encodeState(state));
  }
  window.addEventListener('hashchange', onHashChange);
  render();
  history.replaceState(null, '', encodeState(state));

  return () => {
    window.removeEventListener('hashchange', onHashChange);
  };
}
