import { getPattern, defaultParams, clampParams, generateSafe, listPatterns, type PatternDef, type ParamDef } from '../patterns/registry';
import { randomParams } from '../patterns/randomize';
import { serialize, type SvgNode } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette, COLOR_DEFAULTS, type ColorState } from '../poster/palettes';
import { rememberState, forgetState } from '../core/persist';
import { PRESETS } from '../patterns/presets';
import { sliderRow, checkboxRow, selectRow, chipRow } from './controls';
import { NAMES } from './gallery';
import { FORMATS, DEFAULT_FORMAT, renderSize, physicalSize, type Unit } from '../poster/formats';
import { toSvgString, toPngBlob, downloadBlob, exportFilename, pixelDimensions } from '../poster/export';
import { openModal } from './modal';
import { loadSource } from '../content/source';
import { loadExplain } from '../content/explain';
import { renderMarkdown, renderCitation } from './markdown';

/** Synthetic ParamDefs so the four colour controls can reuse `sliderRow`.
 *  Their `label` has no '.' so `sliderRow`'s i18n-key splitting is a no-op
 *  and the text renders as-is. */
const COLOR_PARAM_DEFS: Record<keyof typeof COLOR_DEFAULTS, ParamDef> = {
  hue: { key: 'hue', kind: 'float', min: 0, max: 360, step: 1, default: COLOR_DEFAULTS.hue, label: 'HUE' },
  chroma: { key: 'chroma', kind: 'float', min: 0, max: 0.16, step: 0.005, default: COLOR_DEFAULTS.chroma, label: 'CHROMA' },
  paperL: { key: 'paperL', kind: 'float', min: 0.04, max: 0.96, step: 0.01, default: COLOR_DEFAULTS.paperL, label: 'PAPER' },
  accentShift: { key: 'accentShift', kind: 'float', min: 0, max: 180, step: 1, default: COLOR_DEFAULTS.accentShift, label: 'ACCENT SHIFT' },
};

function placeholderTab(text: string): HTMLElement {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

const REPO_URL = 'https://github.com/Jossifresben/flowshape';

function codeWord(text: string): HTMLElement {
  const c = document.createElement('code');
  c.textContent = text;
  return c;
}

/** Copies `text` to the clipboard; falls back to selecting `target`'s
 *  contents (so the user can copy manually) when the clipboard API is
 *  unavailable or the permission is denied. Returns whether the clipboard
 *  itself was written to. */
async function copyOrSelect(text: string, target: HTMLElement): Promise<boolean> {
  try {
    if (!navigator.clipboard) throw new Error('clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      // Nothing more we can do — the button label still tells the user what happened.
    }
    return false;
  }
}

/** Builds the Code tab: the pattern's real, un-rewritten source, a short
 *  preamble naming the helpers a reader needs, and a Copy button. */
async function renderCodeTab(id: string): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const source = await loadSource(id);
  if (source === null) {
    wrap.append(placeholderTab('Source not found for this pattern.'));
    return wrap;
  }

  const preamble = document.createElement('p');
  preamble.className = 'code-preamble';
  const repoLink = document.createElement('a');
  repoLink.href = REPO_URL;
  repoLink.target = '_blank';
  repoLink.rel = 'noopener noreferrer';
  repoLink.textContent = 'the flowshape repo';
  preamble.append(
    'This is the actual generator that renders this pattern — uses ',
    codeWord('el'), '/', codeWord('serialize'), ' from ', codeWord('core/svg'),
    ' and ', codeWord('mulberry32'), '/', codeWord('deriveSeed'), ' from ', codeWord('core/prng'),
    '. Full source: ', repoLink, '.',
  );

  const pre = document.createElement('pre');
  pre.textContent = source;

  const copyRow = document.createElement('div');
  copyRow.className = 'ctl-row';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = 'Copy';
  let copyResetTimer = 0;
  copyBtn.addEventListener('click', async () => {
    const wroteToClipboard = await copyOrSelect(source, pre);
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyBtn.textContent = wroteToClipboard ? 'Copied' : 'Selected — press ⌘/Ctrl+C';
    copyResetTimer = window.setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 2000);
  });
  copyRow.append(copyBtn);

  wrap.append(preamble, copyRow, pre);
  return wrap;
}

/** Builds the Math tab: the pattern's explanation content (formula, plain-
 *  language meaning, per-parameter notes) rendered from markdown, plus its
 *  citation as a link.
 *  TODO: hardcoded to 'en' — the Spanish files (`*.es.md`) already exist for
 *  every pattern, but the playground UI itself has no language toggle yet.
 *  Wire this to the user's chosen language once that control exists. */
async function renderMathTab(id: string): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const doc = await loadExplain(id, 'en');
  if (doc === null) {
    wrap.append(placeholderTab('No explanation found for this pattern.'));
    return wrap;
  }
  wrap.innerHTML = renderMarkdown(doc.body) + renderCitation(doc.source, doc.url);
  return wrap;
}

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
  // Set by render() whenever the export buttons are built while no node is
  // cached yet (a heavy pattern's first, still in-flight worker request).
  // Called once that node lands so the buttons re-enable without needing a
  // full panel rebuild.
  let onExportReady: (() => void) | null = null;
  function nodeKey(): string {
    return JSON.stringify([state.patternId, state.params, state.seed, renderSize(state)]);
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
      onExportReady?.();
      onExportReady = null;
    };
    worker!.postMessage({ id, patternId: state.patternId, params: state.params, seed: state.seed, size: renderSize(state) });
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
      const node = generateSafe(def, state.params, state.seed, renderSize(state));
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

    const animateBtn = document.createElement('button');
    animateBtn.className = 'anim-enter';
    animateBtn.textContent = state.lang === 'es' ? 'ANIMAR →' : 'ANIMATE →';
    animateBtn.addEventListener('click', () => {
      location.hash = encodeState({ ...state, view: 'a' });
    });

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

    const explainRow = document.createElement('div');
    explainRow.className = 'ctl-row';
    const explainBtn = document.createElement('button');
    explainBtn.className = 'btn';
    explainBtn.textContent = 'Explain the math';
    explainBtn.addEventListener('click', () => {
      openModal({
        title: NAMES[state.patternId] ?? state.patternId,
        tabs: [
          { id: 'math', label: 'Math', render: () => renderMathTab(state.patternId) },
          { id: 'code', label: 'Code', render: () => renderCodeTab(state.patternId) },
        ],
      });
    });
    explainRow.append(explainBtn);
    panel.append(explainRow);

    const orderedParams = [...def.params].sort((a, b) =>
      (a.key === 'size' ? -1 : 0) - (b.key === 'size' ? -1 : 0),
    );
    for (const pd of orderedParams) {
      if (pd.hidden) continue;
      const v = params[pd.key]!;
      if (pd.kind === 'bool') {
        panel.append(checkboxRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else if (pd.kind === 'enum') {
        panel.append(selectRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else {
        panel.append(sliderRow(pd, v, (nv) => setParam(pd.key, nv)));
      }
    }
    const formatHeading = document.createElement('div');
    formatHeading.className = 'ctl-section-heading';
    formatHeading.textContent = 'FORMAT';
    panel.append(formatHeading);

    const currentFormat = state.format ?? DEFAULT_FORMAT;
    for (const group of ['iso', 'us', 'other'] as const) {
      const items = FORMATS.filter((f) => f.group === group).map((f) => ({ id: f.id, label: f.label }));
      panel.append(chipRow(items, currentFormat, (id) => setState({ format: id })));
    }
    panel.append(
      chipRow([{ id: 'custom', label: 'Custom…' }], currentFormat, () => setState({ format: 'custom' })),
    );

    if (state.format === 'custom') {
      const customRow = document.createElement('div');
      customRow.className = 'custom-size';
      const wInput = document.createElement('input');
      wInput.type = 'number';
      wInput.min = '1';
      wInput.value = String(state.cw ?? 30);
      wInput.addEventListener('change', () => setState({ cw: Number(wInput.value) }));
      const xSpan = document.createElement('span');
      xSpan.textContent = '×';
      const hInput = document.createElement('input');
      hInput.type = 'number';
      hInput.min = '1';
      hInput.value = String(state.ch ?? 40);
      hInput.addEventListener('change', () => setState({ ch: Number(hInput.value) }));
      const unitSel = document.createElement('select');
      for (const u of ['mm', 'cm', 'in'] as Unit[]) {
        const o = document.createElement('option');
        o.value = u;
        o.textContent = u;
        if ((state.cu ?? 'mm') === u) o.selected = true;
        unitSel.append(o);
      }
      unitSel.addEventListener('change', () => setState({ cu: unitSel.value as Unit }));
      customRow.append(wInput, xSpan, hInput, unitSel);
      panel.append(customRow);
    }

    const phys = physicalSize(state);
    const physLabel = document.createElement('div');
    physLabel.className = 'ctl-value';
    physLabel.textContent = `${phys.wmm} × ${phys.hmm} mm`;
    panel.append(physLabel);

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

    panel.append(animateBtn);

    const exportHeading = document.createElement('div');
    exportHeading.className = 'ctl-section-heading';
    exportHeading.textContent = 'EXPORT';
    panel.append(exportHeading);

    const exportRow = document.createElement('div');
    exportRow.className = 'ctl-row';

    const svgBtn = document.createElement('button');
    svgBtn.className = 'btn';
    svgBtn.textContent = 'Export SVG';

    const dpiSel = document.createElement('select');
    dpiSel.className = 'ctl-select';
    for (const dpi of [150, 300]) {
      const px = pixelDimensions(phys, dpi);
      const o = document.createElement('option');
      o.value = String(dpi);
      o.textContent = `${dpi} dpi · ${px.w} × ${px.h}`;
      if (dpi === 300) o.selected = true;
      dpiSel.append(o);
    }

    const pngBtn = document.createElement('button');
    pngBtn.className = 'btn';
    pngBtn.textContent = 'Export PNG';

    const exportError = document.createElement('div');
    exportError.className = 'ctl-value export-error';
    exportError.textContent = '';

    if (!lastNode) {
      svgBtn.disabled = true;
      pngBtn.disabled = true;
      onExportReady = () => {
        svgBtn.disabled = false;
        pngBtn.disabled = false;
      };
    } else {
      onExportReady = null;
    }

    svgBtn.addEventListener('click', () => {
      if (!lastNode) return;
      const pal = resolvePalette(state.color);
      const svg = toSvgString(lastNode, pal, phys);
      const name = exportFilename(state.patternId, state.seed, state.format ?? DEFAULT_FORMAT, 'svg');
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), name);
    });

    pngBtn.addEventListener('click', async () => {
      if (!lastNode) return;
      const originalText = pngBtn.textContent;
      pngBtn.disabled = true;
      pngBtn.textContent = 'Rendering…';
      exportError.textContent = '';
      try {
        const pal = resolvePalette(state.color);
        const svg = toSvgString(lastNode, pal, phys);
        const dpi = Number(dpiSel.value);
        const px = pixelDimensions(phys, dpi);
        const blob = await toPngBlob(svg, px);
        const name = exportFilename(state.patternId, state.seed, state.format ?? DEFAULT_FORMAT, 'png');
        downloadBlob(blob, name);
      } catch (err) {
        exportError.textContent = err instanceof Error ? err.message : String(err);
      } finally {
        pngBtn.disabled = false;
        pngBtn.textContent = originalText;
      }
    });

    exportRow.append(svgBtn, dpiSel, pngBtn);
    panel.append(exportRow, exportError);

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
