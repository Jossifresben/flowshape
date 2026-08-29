import { getPattern, defaultParams, clampParams, generateSafe, listPatterns, type PatternDef, type ParamDef } from '../patterns/registry';
import { randomParams } from '../patterns/randomize';
import { serialize, type SvgNode } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette, COLOR_DEFAULTS, type ColorState } from '../poster/palettes';
import { rememberState, forgetState } from '../core/persist';
import { PRESETS } from '../patterns/presets';
import { sliderRow, checkboxRow, selectRow, chipRow, sectionRow } from './controls';
import { FORMATS, DEFAULT_FORMAT, renderSize, physicalSize, type Unit } from '../poster/formats';
import { toSvgString, toPngBlob, downloadBlob, exportFilename, pixelDimensions } from '../poster/export';
import { openModal } from './modal';
import { loadSource } from '../content/source';
import { loadExplain } from '../content/explain';
import { renderMarkdown, renderCitation } from './markdown';
import { t, patternName, currentLang, type Lang } from '../i18n';
import { panelNav } from './nav';
import { buildFooter, REPO_URL } from './footer';

/** Synthetic ParamDefs so the four colour controls can reuse `sliderRow`.
 *  Their labels are real i18n keys, like every other control's. */
const COLOR_PARAM_DEFS: Record<keyof typeof COLOR_DEFAULTS, ParamDef> = {
  hue: { key: 'hue', kind: 'float', min: 0, max: 360, step: 1, default: COLOR_DEFAULTS.hue, label: 'color.hue' },
  chroma: { key: 'chroma', kind: 'float', min: 0, max: 0.16, step: 0.005, default: COLOR_DEFAULTS.chroma, label: 'color.chroma' },
  paperL: { key: 'paperL', kind: 'float', min: 0.04, max: 0.96, step: 0.01, default: COLOR_DEFAULTS.paperL, label: 'color.paperL' },
  accentShift: { key: 'accentShift', kind: 'float', min: 0, max: 180, step: 1, default: COLOR_DEFAULTS.accentShift, label: 'color.accentShift' },
};

function placeholderTab(text: string): HTMLElement {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

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
async function renderCodeTab(id: string, lang: Lang): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const source = await loadSource(id);
  if (source === null) {
    wrap.append(placeholderTab(t('code.missing', lang)));
    return wrap;
  }

  const preamble = document.createElement('p');
  preamble.className = 'code-preamble';
  const repoLink = document.createElement('a');
  repoLink.href = REPO_URL;
  repoLink.target = '_blank';
  repoLink.rel = 'noopener noreferrer';
  repoLink.textContent = t('code.repo', lang);
  preamble.append(
    t('code.preambleA', lang),
    codeWord('el'), '/', codeWord('serialize'), t('code.preambleB', lang), codeWord('core/svg'),
    t('code.preambleC', lang),
    codeWord('mulberry32'), '/', codeWord('deriveSeed'), t('code.preambleB', lang), codeWord('core/prng'),
    t('code.preambleD', lang), repoLink, '.',
  );

  const pre = document.createElement('pre');
  pre.textContent = source;

  const copyRow = document.createElement('div');
  copyRow.className = 'ctl-row';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = t('code.copy', lang);
  let copyResetTimer = 0;
  copyBtn.addEventListener('click', async () => {
    const wroteToClipboard = await copyOrSelect(source, pre);
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyBtn.textContent = t(wroteToClipboard ? 'code.copied' : 'code.selected', lang);
    copyResetTimer = window.setTimeout(() => {
      copyBtn.textContent = t('code.copy', lang);
    }, 2000);
  });
  copyRow.append(copyBtn);

  wrap.append(preamble, copyRow, pre);
  return wrap;
}

/** Builds the Math tab: the pattern's explanation content (formula, plain-
 *  language meaning, per-parameter notes) rendered from markdown, plus its
 *  citation as a link, in the reader's language. */
async function renderMathTab(id: string, lang: Lang): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const doc = await loadExplain(id, lang);
  if (doc === null) {
    wrap.append(placeholderTab(t('math.missing', lang)));
    return wrap;
  }
  wrap.innerHTML = renderMarkdown(doc.body) + renderCitation(doc.source, doc.url);
  return wrap;
}

/** One button in the three-up action row: short visible label, full wording
 *  kept as the accessible name so nothing is lost to the abbreviation. */
function actionButton(short: string, full: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = short;
  b.title = full;
  b.setAttribute('aria-label', full);
  return b;
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
/** The state in the URL, with its language resolved the way every other view
 *  resolves it: an explicit `?lang=` wins (a shared link carries its own
 *  language), then the reader's stored choice, then the browser's. Without
 *  this the sidebar would ignore a preference the gallery and about page both
 *  honour — `decodeState` only ever sees the URL. */
function readState(): AppState {
  const state = decodeState(location.hash) ?? DEFAULT_STATE;
  return { ...state, lang: currentLang() };
}

export function mountPlayground(root: HTMLElement): () => void {
  let state = readState();
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
        target.textContent = t('pg.renderFailed', state.lang);
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
        stage.textContent = t('pg.renderFailed', state.lang);
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
    const lang = state.lang;
    document.documentElement.lang = lang;
    const def = getPattern(state.patternId);
    if (!def) {
      root.textContent = t('pg.unknownPattern', lang);
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

    panel.append(panelNav(lang));

    const patternSel = document.createElement('select');
    patternSel.className = 'ctl-select';
    for (const def2 of listPatterns().filter((x) => x.phase === 1).sort((a, b) => a.id.localeCompare(b.id))) {
      const o = document.createElement('option');
      o.value = def2.id;
      o.textContent = patternName(def2.id, lang);
      if (def2.id === state.patternId) o.selected = true;
      patternSel.append(o);
    }
    patternSel.addEventListener('change', () =>
      setState({ patternId: patternSel.value, params: {} }),
    );
    panel.append(patternSel);

    // The three things a visitor reaches for constantly, side by side above
    // the fold instead of three stacked full-width buttons.
    const actions = document.createElement('div');
    actions.className = 'panel-actions';

    const rand = actionButton(t('pg.randomizeShort', lang), t('pg.randomize', lang));
    rand.addEventListener('click', () => {
      if (def.usesSeed) {
        setState({ seed: 1 + Math.floor(Math.random() * 99999) });
      } else {
        setState({ params: randomParams(def, Math.random, state.params) });
      }
    });

    const explainBtn = actionButton(t('pg.explainShort', lang), t('pg.explain', lang));
    explainBtn.addEventListener('click', () => {
      openModal({
        title: patternName(state.patternId, lang),
        tabs: [
          { id: 'math', label: t('modal.math', lang), render: () => renderMathTab(state.patternId, lang) },
          { id: 'code', label: t('modal.code', lang), render: () => renderCodeTab(state.patternId, lang) },
        ],
      });
    });

    const animateBtn = actionButton(t('pg.animateShort', lang), t('pg.animate', lang));
    animateBtn.addEventListener('click', () => {
      location.hash = encodeState({ ...state, view: 'a' });
    });

    actions.append(rand, explainBtn, animateBtn);
    panel.append(actions);

    if (def.usesSeed) {
      const seedVal = document.createElement('div');
      seedVal.className = 'ctl-label panel-seed';
      seedVal.textContent = `${t('pg.seed', lang)} ${state.seed}`;
      panel.append(seedVal);
    }

    // --- parameters -------------------------------------------------------
    const orderedParams = [...def.params].sort((a, b) =>
      (a.key === 'size' ? -1 : 0) - (b.key === 'size' ? -1 : 0),
    );
    const paramRows: HTMLElement[] = [];
    for (const pd of orderedParams) {
      if (pd.hidden) continue;
      const v = params[pd.key]!;
      if (pd.kind === 'bool') {
        paramRows.push(checkboxRow(pd, v, lang, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else if (pd.kind === 'enum') {
        paramRows.push(selectRow(pd, v, lang, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else {
        paramRows.push(sliderRow(pd, v, lang, (nv) => setParam(pd.key, nv)));
      }
    }
    // A pattern with nothing but hidden params gets no empty disclosure.
    if (paramRows.length > 0) {
      const paramsSec = sectionRow('params', t('pg.parameters', lang), true);
      paramsSec.body.append(...paramRows);
      panel.append(paramsSec.el);
    }

    // --- colour (deliberately after the parameters: colour follows shape) ---
    const colourSec = sectionRow('colour', t('pg.colour', lang), true);
    for (const key of ['hue', 'chroma', 'paperL', 'accentShift'] as const) {
      const def2 = COLOR_PARAM_DEFS[key];
      const v = state.color[key] ?? COLOR_DEFAULTS[key];
      colourSec.body.append(sliderRow(def2, v, lang, (nv) => setColor(key, nv)));
    }
    panel.append(colourSec.el);

    // --- format -----------------------------------------------------------
    const formatSec = sectionRow('format', t('pg.format', lang), false);

    const currentFormat = state.format ?? DEFAULT_FORMAT;
    for (const group of ['iso', 'us', 'other'] as const) {
      const items = FORMATS.filter((f) => f.group === group).map((f) => ({ id: f.id, label: f.label }));
      formatSec.body.append(chipRow(items, currentFormat, (id) => setState({ format: id })));
    }
    formatSec.body.append(
      chipRow([{ id: 'custom', label: t('pg.custom', lang) }], currentFormat, () => setState({ format: 'custom' })),
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
      formatSec.body.append(customRow);
    }

    const phys = physicalSize(state);
    const physLabel = document.createElement('div');
    physLabel.className = 'ctl-value';
    physLabel.textContent = `${phys.wmm} × ${phys.hmm} mm`;
    formatSec.body.append(physLabel);
    panel.append(formatSec.el);

    // --- export -----------------------------------------------------------
    const exportSec = sectionRow('export', t('pg.export', lang), false);

    const exportRow = document.createElement('div');
    exportRow.className = 'ctl-row';

    const svgBtn = document.createElement('button');
    svgBtn.className = 'btn';
    svgBtn.textContent = t('pg.exportSvg', lang);

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
    pngBtn.textContent = t('pg.exportPng', lang);

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
      pngBtn.textContent = t('pg.rendering', lang);
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
    exportSec.body.append(exportRow, exportError);
    panel.append(exportSec.el);

    // Once a pattern's state has been remembered (any change), the gallery
    // card for it points at that remembered state instead of the curated
    // preset — so give a way back for patterns that have one. Stays outside
    // every disclosure: it resets seed, params AND colour, so it belongs to
    // none of them.
    const preset = PRESETS[state.patternId];
    if (preset) {
      const resetRow = document.createElement('div');
      resetRow.className = 'ctl-row';
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn';
      resetBtn.textContent = t('pg.reset', lang);
      resetBtn.addEventListener('click', () => {
        forgetState(state.patternId);
        setState({ seed: preset.seed ?? 1, params: preset.params ?? {}, color: preset.color ?? {} });
      });
      resetRow.append(resetBtn);
      panel.append(resetRow);
    }

    panel.append(buildFooter(lang, { compact: true }));

    root.append(stage, panel);
  }

  function onHashChange(): void {
    generation++;
    state = readState();
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
