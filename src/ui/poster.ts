import { getPattern, generateSafe } from '../patterns/registry';
import { decodeState, encodeState, type AppState } from '../core/url-state';
import { serialize, el, type Palette, type SvgNode } from '../core/svg';
import { sheet } from '../compose/units';
import { SKELETONS } from '../compose/skeletons';
import { variantsFor, findVariant, type Variant } from '../compose/variants';
import { colorwaysFor, type Colorway } from '../compose/colorways';
import { posterData } from '../compose/data';
import { renderPoster, artworkSize, type RenderResult } from '../compose/render';
import { approxMeasure, canvasMeasure, type Measure } from '../compose/measure';
import {
  toPngBlob, downloadBlob, pixelDimensions, posterFilename,
} from '../poster/export';
import { favouriteButton } from './star';
import { shareButton } from './share';

/** The tree already carries literal colours, so the palette is inert here. */
const BAKED: Palette = { paper: '#000000', ink: '#000000', accent: '#000000' };

const DISPLAY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface ComposerModel {
  state: AppState;
  variants: Variant[];
  colorways: Colorway[];
  variant: Variant;
  colorway: Colorway;
  renderVariant(v: Variant, c?: Colorway): RenderResult;
  toSvg(): string;
  /** The id of the layout `delta` steps away, wrapping at the ends. */
  stepLayout(delta: number): string;
  /** The index of the colorway `delta` steps away, wrapping at the ends. */
  stepColorway(delta: number): number;
}

function wrapIndex(n: number, len: number): number {
  return ((n % len) + len) % len;
}

export function composerModel(state: AppState, measure: Measure = approxMeasure()): ComposerModel | null {
  const def = getPattern(state.patternId);
  if (!def) return null;

  const sh = sheet(state);
  const colorways = colorwaysFor(state.color);
  const data = posterData(def, state);
  const hideText = state.notext === true;

  // Artwork is deterministic in (params, seed, size), so the same size never
  // needs generating twice — and the skeletons collapse to far fewer distinct
  // sizes than there are variants.
  const artCache = new Map<string, SvgNode>();
  const artFor = (v: Variant): SvgNode => {
    const size = artworkSize(sh, v.skeleton);
    const key = `${size.w}x${size.h}`;
    let node = artCache.get(key);
    if (!node) {
      node = generateSafe(def, state.params, state.seed, size);
      artCache.set(key, node);
    }
    return node;
  };

  const renderWith = (v: Variant, c: Colorway): RenderResult =>
    renderPoster({
      sheet: sh, skeleton: v.skeleton, colorway: c, data,
      artwork: artFor(v), measure, hideText,
    });

  // Offer only layouts that fit the sheet *and* can take this pattern's name,
  // so browsing never lands on a sheet that refuses to render.
  //
  // The probe uses an EMPTY artwork of the right size, never the real thing.
  // `renderPoster` only ever returns !ok for title fitting ('title-too-long' /
  // 'title-needs-one-line') and otherwise just places the artwork node into a
  // region, so its contents cannot change the verdict. Generating real artwork
  // once per variant made this loop O(variants) full pattern runs: for
  // diffgrowth — the one `heavy` pattern, a full simulation per call — that was
  // 68 runs and ~73 s of synchronous main-thread work, which presents as a
  // blank, frozen page rather than a slow one.
  const probe = (v: Variant): RenderResult => {
    const size = artworkSize(sh, v.skeleton);
    return renderPoster({
      sheet: sh, skeleton: v.skeleton, colorway: colorways[0]!, data,
      artwork: el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, []),
      measure, hideText,
    });
  };
  const variants = variantsFor(SKELETONS, sh.ratio).filter((v) => probe(v).ok);
  const variant = findVariant(variants, state.layout) ?? variants[0]!;
  const colorway = colorways[state.cway ?? 0] ?? colorways[0]!;

  return {
    state, variants, colorways, variant, colorway,
    renderVariant: (v, c = colorway) => renderWith(v, c),
    toSvg() {
      const r = renderWith(variant, colorway);
      if (!r.ok) throw new Error(`poster render failed: ${r.error}`);
      return serialize(r.node, BAKED);
    },
    stepLayout: (delta) => {
      const at = variants.findIndex((v) => v.id === variant.id);
      return variants[wrapIndex(at + delta, variants.length)]!.id;
    },
    stepColorway: (delta) => wrapIndex(colorway.index + delta, colorways.length),
  };
}

/**
 * One composed poster, for a saved-card thumbnail.
 *
 * Deliberately NOT `composerModel().toSvg()`: that renders every candidate
 * layout in order to filter the ones that fit, which is roughly ten full
 * pattern generations. A thumbnail needs exactly one. It also means a saved
 * poster shows the poster — layout, colourway and type block — rather than the
 * bare artwork, which is indistinguishable from the design it came from.
 */
export function composerThumb(state: AppState): string | null {
  const def = getPattern(state.patternId);
  if (!def) return null;
  const sh = sheet(state);
  const colorways = colorwaysFor(state.color);
  const colorway = colorways[state.cway ?? 0] ?? colorways[0];
  const variant = findVariant(variantsFor(SKELETONS, sh.ratio), state.layout)
    ?? variantsFor(SKELETONS, sh.ratio)[0];
  if (!variant || !colorway) return null;
  const artwork = generateSafe(def, state.params, state.seed, artworkSize(sh, variant.skeleton));
  const r = renderPoster({
    sheet: sh, skeleton: variant.skeleton, colorway, data: posterData(def, state),
    artwork, measure: approxMeasure(), hideText: state.notext === true,
  });
  return r.ok ? serialize(r.node, BAKED) : null;
}

/** The composer route for a playground state. Layout, colorway and the text
 *  flag are deliberately dropped: opening the composer starts a fresh browse
 *  at variant 0 rather than restoring a stale pick. */
export function composerUrl(state: AppState): string {
  return encodeState({
    ...state, view: 'c', layout: undefined, cway: undefined, notext: undefined,
  });
}

const STR = {
  en: {
    back: '← Playground', layout: 'LAYOUT', colour: 'COLOUR', hideText: 'Hide text',
    svg: 'Export SVG', png: 'Export PNG', of: 'of', rendering: 'Rendering…',
    unknown: 'That pattern does not exist.', failed: 'PNG export failed.',
  },
  es: {
    back: '← Taller', layout: 'DISEÑO', colour: 'COLOR', hideText: 'Ocultar texto',
    svg: 'Exportar SVG', png: 'Exportar PNG', of: 'de', rendering: 'Renderizando…',
    unknown: 'Ese patrón no existe.', failed: 'La exportación PNG falló.',
  },
} as const;

function stepper(label: string, position: string, onStep: (d: number) => void): HTMLElement {
  const row = document.createElement('div');
  row.className = 'cmp-stepper';
  const name = document.createElement('span');
  name.className = 'ctl-label';
  name.textContent = label;
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'btn';
  prev.textContent = '←';
  prev.setAttribute('aria-label', `${label} previous`);
  prev.addEventListener('click', () => onStep(-1));
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'btn';
  next.textContent = '→';
  next.setAttribute('aria-label', `${label} next`);
  next.addEventListener('click', () => onStep(1));
  const pos = document.createElement('span');
  pos.className = 'ctl-value';
  pos.textContent = position;
  row.append(name, prev, pos, next);
  return row;
}

export function mountComposer(root: HTMLElement): () => void {
  const render = (): void => {
    const state = decodeState(location.hash);
    const model = state
      ? composerModel(state, canvasMeasure(DISPLAY_FONT, 700, -0.045))
      : null;
    root.innerHTML = '';
    if (!state || !model) {
      const p = document.createElement('p');
      p.textContent = STR.en.unknown;
      root.append(p);
      return;
    }
    const t = STR[state.lang];
    const go = (patch: Partial<AppState>): void => {
      location.hash = encodeState({ ...state, ...patch });
    };

    const bar = document.createElement('div');
    bar.className = 'cmp-bar';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn';
    back.textContent = t.back;
    back.addEventListener('click', () => {
      go({ view: 'p', layout: undefined, cway: undefined, notext: undefined });
    });

    const at = model.variants.findIndex((v) => v.id === model.variant.id) + 1;
    bar.append(
      back,
      stepper(t.layout, `${at} ${t.of} ${model.variants.length}`, (d) => go({ layout: model.stepLayout(d) })),
      stepper(t.colour, `${model.colorway.index + 1} ${t.of} ${model.colorways.length}`, (d) => go({ cway: model.stepColorway(d) })),
    );

    const hide = document.createElement('label');
    hide.className = 'cmp-check';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.notext === true;
    box.addEventListener('change', () => go({ notext: box.checked ? true : undefined }));
    const hideLabel = document.createElement('span');
    hideLabel.className = 'ctl-label';
    hideLabel.textContent = t.hideText;
    hide.append(box, hideLabel);
    bar.append(hide);

    const err = document.createElement('span');
    err.className = 'ctl-value export-error';

    const svgBtn = document.createElement('button');
    svgBtn.type = 'button';
    svgBtn.className = 'btn';
    svgBtn.textContent = t.svg;
    svgBtn.addEventListener('click', () => {
      const blob = new Blob([model.toSvg()], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, posterFilename(state.patternId, state.seed, model.variant.id, 'svg'));
    });

    const pngBtn = document.createElement('button');
    pngBtn.type = 'button';
    pngBtn.className = 'btn';
    pngBtn.textContent = t.png;
    pngBtn.addEventListener('click', () => {
      const sh = sheet(state);
      pngBtn.disabled = true;
      pngBtn.textContent = t.rendering;
      err.textContent = '';
      void toPngBlob(model.toSvg(), pixelDimensions({ wmm: sh.wmm, hmm: sh.hmm }, 300))
        .then((blob) => {
          downloadBlob(blob, posterFilename(state.patternId, state.seed, model.variant.id, 'png'));
        })
        .catch(() => { err.textContent = t.failed; })
        .finally(() => { pngBtn.disabled = false; pngBtn.textContent = t.png; });
    });

    bar.append(svgBtn, pngBtn, err);
    bar.append(favouriteButton(state.lang, () => location.hash).el, shareButton(state.lang));

    const stage = document.createElement('div');
    stage.className = 'cmp-stage';
    stage.innerHTML = model.toSvg();

    root.append(bar, stage);
  };

  render();
  window.addEventListener('hashchange', render);
  return () => window.removeEventListener('hashchange', render);
}
