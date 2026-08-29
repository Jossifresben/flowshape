import { el, elText, resolveRoles, type SvgNode } from '../core/svg';
import { u, type Sheet } from './units';
import type { Skeleton } from './regions';
import { artworkPalette, resolvePresentation, type Colorway } from './colorways';
import type { PosterData } from './data';
import type { Measure } from './measure';
import { fitTitle, wrap, type Fit } from './text';
import { encodeQr, type QrSymbol } from './qr';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Size { w: number; h: number }

export interface RenderOptions {
  sheet: Sheet;
  skeleton: Skeleton;
  colorway: Colorway;
  data: PosterData;
  /** Generated at `artworkSize(sheet, skeleton)`, with role tokens intact. */
  artwork: SvgNode;
  measure: Measure;
  /** Drop the text, keep the layout.
   *
   *  The composition is exactly what it would be with type - same split, same
   *  grounds, same rules and crop marks - only nothing is written on it. An
   *  earlier version let the artwork absorb the empty type region; the layout
   *  the user browsed to and chose is the thing to preserve.
   *
   *  A layout that cannot fit its title is valid here, because there is none. */
  hideText?: boolean;
  onWarn?: (message: string) => void;
}

export type RenderResult =
  | { ok: true; node: SvgNode }
  | { ok: false; error: 'title-too-long' | 'title-needs-one-line' };

/** Section 7's floor, in reference px. Below this, fail rather than ellipse. */
const TITLE_FLOOR = 76;

/** What the poster's QR points at, and what is printed under it. */
export const QR_TARGET = 'https://flowshape.art';
const QR_WORDMARK = 'flowshape.art';
/** Reference px for the whole plate, quiet zone included. On A3 that is ~21mm,
 *  about 0.8mm per module at version 2 — comfortably above what a phone needs. */
const QR_BOX = 88;
/** Modules of quiet zone per side. The spec asks for four; three is the usual
 *  print compromise and still leaves the symbol isolated on its own plate. */
const QR_QUIET = 3;

// The target never changes, so the symbol is encoded once per process.
let qrSymbol: QrSymbol | null = null;
function wordmarkQr(): QrSymbol {
  qrSymbol ??= encodeQr(QR_TARGET);
  return qrSymbol;
}

/** The artwork region and the type region, from the skeleton's split. */
export function regions(sh: Sheet, s: Skeleton): { art: Rect; type: Rect } {
  const full: Rect = { x: 0, y: 0, w: sh.w, h: sh.h };
  if (s.artwork === 'full') return { art: full, type: { ...full } };
  if (s.axis === 'h') {
    const cut = sh.h * s.split;
    const lead: Rect = { x: 0, y: 0, w: sh.w, h: cut };
    const trail: Rect = { x: 0, y: cut, w: sh.w, h: sh.h - cut };
    return s.artworkFirst ? { art: lead, type: trail } : { art: trail, type: lead };
  }
  const cut = sh.w * s.split;
  const lead: Rect = { x: 0, y: 0, w: cut, h: sh.h };
  const trail: Rect = { x: cut, y: 0, w: sh.w - cut, h: sh.h };
  return s.artworkFirst ? { art: lead, type: trail } : { art: trail, type: lead };
}

/** The plate region is inset inside the artwork region by the skeleton margin. */
function plateRect(sh: Sheet, s: Skeleton, art: Rect): Rect {
  const m = s.margin;
  return {
    x: art.x + u(sh, m.l),
    y: art.y + u(sh, m.t),
    w: Math.max(1, art.w - u(sh, m.l + m.r)),
    h: Math.max(1, art.h - u(sh, m.t + m.b)),
  };
}

/**
 * The size the artwork should be generated at: the artwork region's aspect,
 * short edge 600, matching the convention `poster/formats.ts` already sets so
 * stroke weights read the same everywhere.
 */
export function artworkSize(sh: Sheet, s: Skeleton): Size {
  const { art } = regions(sh, s);
  const region = artworkBed(sh, s, art);
  return region.w <= region.h
    ? { w: 600, h: Math.round((600 * region.h) / region.w) }
    : { w: Math.round((600 * region.w) / region.h), h: 600 };
}

/** The rectangle the artwork is placed into. With the text hidden, a bleed or
 *  column region takes the whole sheet rather than leaving the type region
 *  empty; a plate keeps its inset, since the plate *is* the composition. */
function artworkBed(sh: Sheet, s: Skeleton, art: Rect): Rect {
  return s.artwork === 'plate' ? plateRect(sh, s, art) : art;
}

let clipSeq = 0;

/**
 * Places `artwork` into `region`.
 *
 * Cover regions scale uniformly and crop; the handover's 4d asks for a
 * non-uniform 168% x 112%, which is deliberately not done here — stretching a
 * mathematical pattern misreports the maths, and a uniform scale with an
 * off-centre position achieves the same "mass inside the column" effect
 * honestly.
 */
function placeArtwork(
  region: Rect, art: SvgNode, size: Size, s: Skeleton, posX: number, posY: number,
): SvgNode {
  const fit = s.artwork === 'plate' ? Math.min : Math.max;
  const k = fit(region.w / size.w, region.h / size.h) * s.cover;
  const w = size.w * k;
  const h = size.h * k;
  const x = region.x + (region.w - w) * posX;
  const y = region.y + (region.h - h) * posY;
  const id = `clip${++clipSeq}`;
  return el('g', {}, [
    el('defs', {}, [
      el('clipPath', { id }, [
        el('rect', { x: region.x, y: region.y, width: region.w, height: region.h }),
      ]),
    ]),
    el('g', { 'clip-path': `url(#${id})` }, [
      el('g', { transform: `translate(${x} ${y}) scale(${k})` }, art.children),
    ]),
  ]);
}

/** Where the pattern's mass should sit inside a cover region. */
function artworkPosition(s: Skeleton): { x: number; y: number } {
  if (s.artwork === 'column') return { x: 0.38, y: 0.5 };
  if (s.artwork === 'bleed') return { x: 0.5, y: s.artworkFirst ? 0.5 : 0.42 };
  return { x: 0.5, y: 0.5 };
}


const UI_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO_FONT = "'IBM Plex Mono', Menlo, monospace";

/** Derived tints (handover section 2). Computed against whatever field the type
 *  sits on, rather than authored per ground, so a new colorway needs no new hex.
 *
 *  These are for type on a clean ground. Type sitting *on artwork* gets the
 *  `_ON_ART` pair instead: a scrim can only do so much against a busy lattice,
 *  and a 0.58-alpha mono label over one is unreadable however dark the scrim. */
const BODY_ALPHA = 0.78;
const LABEL_ALPHA = 0.58;
const BODY_ALPHA_ON_ART = 1;
const LABEL_ALPHA_ON_ART = 0.92;

interface TypeOpts {
  size: number;
  fill: string;
  mono?: boolean;
  weight?: number;
  tracking?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
}

function tx(text: string, x: number, y: number, o: TypeOpts): SvgNode {
  const attrs: Record<string, string | number> = {
    x, y,
    fill: o.fill,
    'font-family': o.mono ? MONO_FONT : UI_FONT,
    'font-size': o.size,
    // Values must not change width between seeds.
    'font-variant-numeric': 'tabular-nums',
  };
  if (o.weight !== undefined) attrs['font-weight'] = o.weight;
  if (o.tracking) attrs['letter-spacing'] = `${o.tracking}em`;
  if (o.anchor && o.anchor !== 'start') attrs['text-anchor'] = o.anchor;
  if (o.opacity !== undefined && o.opacity < 1) attrs['fill-opacity'] = o.opacity;
  return elText('text', attrs, text);
}

function contentRect(sh: Sheet, s: Skeleton, type: Rect): Rect {
  const m = s.margin;
  return {
    x: type.x + u(sh, m.l),
    y: type.y + u(sh, m.t),
    w: Math.max(1, type.w - u(sh, m.l + m.r)),
    h: Math.max(1, type.h - u(sh, m.t + m.b)),
  };
}

/** Title lines on their baselines. Returns the y the next block may start at. */
function titleLines(fit: Fit, x: number, top: number, fill: string, anchor?: 'start' | 'end') {
  const lh = fit.size * 0.94;
  const first = top + fit.size * 0.78;
  const nodes = fit.lines.map((line, i) =>
    tx(line, x, first + i * lh, { size: fit.size, fill, weight: 700, tracking: -0.045, anchor }));
  return { nodes, bottom: first + (fit.lines.length - 1) * lh + fit.size * 0.22 };
}

/** Wrapped body copy. Returns the y the next block may start at. */
function paragraph(
  text: string, x: number, top: number, width: number, size: number,
  fill: string, measure: Measure, opacity: number, anchor?: 'start' | 'end',
) {
  const lines = wrap(text, width, size, measure);
  const lh = size * 1.55;
  const nodes = lines.map((line, i) =>
    tx(line, x, top + size + i * lh, { size, fill, opacity, anchor }));
  return { nodes, bottom: top + size + Math.max(0, lines.length - 1) * lh };
}

function monoLine(
  text: string, x: number, y: number, sh: Sheet, fill: string,
  opacity: number, anchor?: 'start' | 'end',
) {
  // Uppercase is applied here, never stored in the data.
  return tx(text.toUpperCase(), x, y, {
    size: u(sh, 21), fill, mono: true, tracking: 0.12, opacity, anchor,
  });
}

interface Ctx {
  hideText: boolean;
  sh: Sheet;
  s: Skeleton;
  c: Colorway;
  d: PosterData;
  measure: Measure;
  content: Rect;
  artRect: Rect;
  fg: string;
  accent: string;
  bodyAlpha: number;
  labelAlpha: number;
}

function buildTitle(ctx: Ctx): { nodes: SvgNode[]; bottom: number } | null {
  const { sh, s, d, content, measure } = ctx;
  const split = s.title === 'split';
  const titleW = split ? content.w * 0.55 : content.w;
  const descW = split ? content.w * 0.38 : Math.min(content.w, u(sh, 440));
  const maxLines = s.oneLineTitle ? 1 : 2;
  // The accent `title` mode is the only place the title takes the accent colour.
  const titleFill = s.accent === 'title' ? ctx.accent : ctx.fg;

  // A banded title is set uppercase (handover 4b). Cased before measuring, or
  // the fit would be computed against a narrower string than the one drawn.
  const name = s.title === 'banded' ? d.name.toUpperCase() : d.name;
  const fit = fitTitle(name, titleW, maxLines, u(sh, s.titleSize), u(sh, TITLE_FLOOR), measure);
  if (!fit) return null;

  // The `code` mark owns the top-right corner of the content box, so the title
  // block - and in a split layout the right-aligned description with it - has
  // to start below the mark rather than underneath it.
  const codeInset = s.accent === 'code' ? u(sh, 76) : 0;
  // A banded title sits at the foot of its band, clearing the boundary.
  const top = s.title === 'banded' ? content.y + content.h - fit.size * 1.2 : content.y + codeInset;
  const head = titleLines(fit, content.x, top, titleFill);
  const nodes = [...head.nodes];
  let bottom = head.bottom;

  // 4c drops body copy by design: on a tint it cannot clear 4.5:1.
  const showDesc = s.data !== 'ruled-boxes' && s.title !== 'banded' && s.present !== 'tinted';
  if (showDesc && d.description) {
    const size = u(sh, 25);
    const para = split
      ? paragraph(d.description, content.x + content.w, content.y + codeInset, descW, size, ctx.fg, measure, ctx.bodyAlpha, 'end')
      : paragraph(d.description, content.x, bottom + u(sh, 44), descW, size, ctx.fg, measure, ctx.bodyAlpha);
    nodes.push(...para.nodes);
    bottom = Math.max(bottom, para.bottom);
  }
  return { nodes, bottom };
}

function buildData(ctx: Ctx, top: number): SvgNode[] {
  const { sh, s, d, content, fg } = ctx;
  if (s.data === 'hidden') return [];

  if (s.data === 'label-pair') {
    const y = Math.min(top + u(sh, 44), content.y + content.h - u(sh, 24));
    return [
      monoLine(`FORM: ${d.formLabel}`, content.x, y, sh, fg, ctx.labelAlpha),
      monoLine(`MODE: ${d.modeLabel}`, content.x, y + u(sh, 34), sh, fg, ctx.labelAlpha),
    ];
  }

  if (s.data === 'grid-4') {
    const y = top + u(sh, 44);
    const nodes: SvgNode[] = [
      el('rect', {
        x: content.x, y, width: content.w, height: Math.max(0.5, u(sh, 1)),
        fill: fg, 'fill-opacity': 0.35,
      }),
    ];
    // Always four columns. Fewer params leave empty cells; the grid never
    // reflows to three (handover section 7).
    const col = content.w / 4;
    for (let i = 0; i < 4; i++) {
      const p = d.params[i];
      if (!p) continue;
      const x = content.x + col * i;
      nodes.push(tx(p.key.toUpperCase(), x, y + u(sh, 40), {
        size: u(sh, 19), fill: fg, mono: true, tracking: 0.12, opacity: ctx.labelAlpha,
      }));
      nodes.push(tx(p.value, x, y + u(sh, 76), {
        size: u(sh, 26), fill: fg, mono: true, weight: 500,
      }));
    }
    return nodes;
  }

  // ruled-boxes: 1.55fr / 1fr with a single internal divider.
  const boxH = Math.min(content.h * 0.62, u(sh, 340));
  const y = content.y;
  const divider = content.x + content.w * (1.55 / 2.55);
  const w = Math.max(0.5, u(sh, 1));
  return [
    el('rect', { x: content.x, y, width: content.w, height: boxH, fill: 'none', stroke: fg, 'stroke-width': w }),
    el('line', { x1: divider, y1: y, x2: divider, y2: y + boxH, stroke: fg, 'stroke-width': w }),
    // An identifier, not a second copy of the title: the handover's box held a
    // series code, and the seed is the honest equivalent.
    tx(String(d.seed), content.x + u(sh, 24), y + boxH * 0.62, {
      size: Math.min(u(sh, 120), boxH * 0.6), fill: fg, weight: 700, tracking: -0.045,
    }),
    monoLine(`FORM: ${d.formLabel}`, divider + u(sh, 24), y + boxH * 0.42, sh, fg, ctx.labelAlpha),
    monoLine(`MODE: ${d.modeLabel}`, divider + u(sh, 24), y + boxH * 0.56, sh, fg, ctx.labelAlpha),
  ];
}


/**
 * The single accent mark. Exactly one per sheet — 3c's note that the series
 * code is "the only accent mark on the sheet" generalises to every layout.
 *
 * `numeral` and `code` show real data: the seed, and the form label. The
 * handover's decorative edition index and invented series code are cut, so the
 * modes point at values that are actually true and reproducible.
 */
function buildAccent(ctx: Ctx, titleBottom: number): SvgNode[] {
  const { sh, s, d, content, accent } = ctx;
  // A rule is geometry and belongs to the layout, so it stays. A numeral and a
  // code are text by another name, so they go with the rest of the text.
  if (ctx.hideText && (s.accent === 'numeral' || s.accent === 'code')) return [];
  switch (s.accent) {
    case 'none':
    // `title` colours the title itself, in buildTitle. `ground` is a field,
    // painted in renderPoster. Neither adds a mark here.
    case 'title':
    case 'ground':
      return [];
    case 'rule':
      return [el('rect', {
        x: content.x,
        y: content.y + content.h - u(sh, 10),
        width: Math.min(content.w, u(sh, 264)),
        height: u(sh, 8),
        fill: accent,
      })];
    case 'numeral':
      return [tx(String(d.seed), content.x, Math.min(titleBottom + u(sh, 104), content.y + content.h), {
        size: u(sh, 104), fill: accent, weight: 700, tracking: -0.04,
      })];
    case 'code':
      return [tx(d.formLabel, content.x + content.w, content.y + u(sh, 40), {
        size: u(sh, 44), fill: accent, weight: 700, tracking: -0.035, anchor: 'end',
      })];
  }
}

/**
 * Section 3d's scrim. Not optional where a layout puts type over artwork.
 *
 * The handover measures the artwork's mean luminance in the top 20% and bottom
 * 25% and raises the offending stop until type clears 4.5:1. That needs a
 * raster pass, which this pipeline does not have - the artwork is vector all
 * the way to the file, which is the whole reason the export is a clean SVG. So
 * the stops are fixed instead, and set for the worst case rather than the
 * average one: strong through the top quarter, where every layout that uses a
 * scrim puts its title, description and labels, and easing only below that so
 * the artwork still reads through the middle of the sheet.
 *
 * The first cut used the handover's own numbers (0.82 falling to 0.10 by 34%)
 * and left the description and mono labels sitting unreadably on the bright
 * mass of the pattern.
 */
function buildScrim(sh: Sheet, c: Colorway, id: string): SvgNode[] {
  const stop = (offset: string, opacity: number) =>
    el('stop', { offset, 'stop-color': c.ink, 'stop-opacity': opacity });
  return [
    el('defs', {}, [
      el('linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' }, [
        stop('0%', 0.90), stop('24%', 0.66), stop('46%', 0.12),
        stop('70%', 0.24), stop('100%', 0.92),
      ]),
    ]),
    el('rect', { x: 0, y: 0, width: sh.w, height: sh.h, fill: `url(#${id})` }),
  ];
}

/**
 * The wordmark QR and the URL beneath it.
 *
 * It always sits on its own plate in the sheet's paper colour. On a paper
 * ground that plate is invisible; over artwork or an accent field it reads as a
 * deliberate small card — and either way the symbol gets the uniform, high
 * contrast surround it needs to scan, which a QR laid straight onto a lattice
 * does not get.
 *
 * Goes with the text when the text is hidden: it is a caption, not artwork.
 */
function buildQr(ctx: Ctx): SvgNode[] {
  if (ctx.hideText) return [];
  const { sh, s, c, content } = ctx;
  const anchor = s.qr ?? { region: 'type' as const, corner: 'br' as const };
  const region = anchor.region === 'art' ? ctx.artRect : content;

  const sym = wordmarkQr();
  const box = u(sh, QR_BOX);
  const module = box / (sym.size + QR_QUIET * 2);
  const caption = u(sh, 20);
  const pad = u(sh, anchor.region === 'art' ? 24 : 0);

  const left = anchor.corner.endsWith('l');
  const top = anchor.corner.startsWith('t');
  const x = left ? region.x + pad : region.x + region.w - box - pad;
  const y = top ? region.y + pad : region.y + region.h - box - caption - pad;

  const nodes: SvgNode[] = [
    el('rect', { x, y, width: box, height: box + caption, fill: c.paper }),
  ];
  const origin = QR_QUIET * module;
  for (let r = 0; r < sym.size; r++) {
    for (let col = 0; col < sym.size; col++) {
      if (!sym.modules[r]![col]) continue;
      nodes.push(el('rect', {
        x: x + origin + col * module,
        y: y + origin + r * module,
        // A hair of overlap: adjacent modules must not show a seam when the
        // renderer rounds coordinates to two decimals.
        width: module + 0.02,
        height: module + 0.02,
        fill: c.ink,
      }));
    }
  }
  nodes.push(tx(QR_WORDMARK, x + box / 2, y + box + caption * 0.72, {
    size: u(sh, 17), fill: c.ink, mono: true, tracking: 0.06, anchor: 'middle',
  }));
  // Grouped and marked so a test can read the symbol back out of the rendered
  // sheet, rather than only trusting the encoder that produced it.
  return [el('g', { class: 'qr' }, nodes)];
}

/** The shared decoration layer: four corner crop marks and one vertical
 *  caption. Independent of layout, toggled per variant, never reimplemented. */
function buildDecoration(ctx: Ctx): SvgNode[] {
  const { sh, s, d, content, fg } = ctx;
  const out: SvgNode[] = [];
  if (s.decoration.cropMarks) {
    const len = u(sh, 11);
    const inset = u(sh, 60);
    const w = Math.max(0.5, u(sh, 1));
    for (const [cx, cy] of [
      [inset, inset], [sh.w - inset, inset],
      [inset, sh.h - inset], [sh.w - inset, sh.h - inset],
    ] as const) {
      out.push(el('g', { class: 'crop-mark' }, [
        el('line', { x1: cx - len, y1: cy, x2: cx + len, y2: cy, stroke: fg, 'stroke-width': w, 'stroke-opacity': 0.45 }),
        el('line', { x1: cx, y1: cy - len, x2: cx, y2: cy + len, stroke: fg, 'stroke-width': w, 'stroke-opacity': 0.45 }),
      ]));
    }
  }
  if (s.decoration.verticalCaption && !ctx.hideText) {
    const x = content.x - u(sh, 22);
    const y = content.y + content.h;
    out.push(el('g', { transform: `rotate(-90 ${x} ${y})` }, [
      tx(`${d.formLabel} · SEED ${d.seed}`, x, y, {
        size: u(sh, 19), fill: fg, mono: true, tracking: 0.14, opacity: ctx.labelAlpha,
      }),
    ]));
  }
  return out;
}

export function renderPoster(o: RenderOptions): RenderResult {
  const { sheet: sh, skeleton: s, colorway: c, artwork } = o;
  const { art } = regions(sh, s);
  const present = resolvePresentation(c, s.present);
  if (present !== s.present) {
    o.onWarn?.(
      `colorway ${c.index}: tinted falls back to inverted (ground luminance ${c.groundLum.toFixed(3)} < 0.45)`,
    );
  }

  const children: SvgNode[] = [
    el('rect', { x: 0, y: 0, width: sh.w, height: sh.h, fill: c.paper }),
  ];

  const hideText = o.hideText === true;
  const bed = artworkBed(sh, s, art);
  const pal = artworkPalette(c, present);
  // The bed under the artwork: `paper` in the artwork's own palette, which for
  // 'as-generated' is the dark ground and for 'tinted' is the accent field.
  children.push(el('rect', { x: bed.x, y: bed.y, width: bed.w, height: bed.h, fill: pal.paper }));
  const pos = artworkPosition(s);
  children.push(placeArtwork(bed, resolveRoles(artwork, pal), artworkSize(sh, s), s, pos.x, pos.y));

  if (s.scrim) children.push(...buildScrim(sh, c, `scrim${++clipSeq}`));

  const { type } = regions(sh, s);
  const content = contentRect(sh, s, type);
  const onGround = s.accent === 'ground' || s.title === 'banded';
  // 3b's ground covers the whole sheet behind the plate; 4b's band covers only
  // the type region. Both fall out of the modes — neither is an id branch.
  const groundIsSheet = s.accent === 'ground' && s.artwork === 'plate';
  if (groundIsSheet) {
    children[0] = el('rect', { x: 0, y: 0, width: sh.w, height: sh.h, fill: c.ground });
  } else if (onGround) {
    children.push(el('rect', { x: type.x, y: type.y, width: type.w, height: type.h, fill: c.ground }));
  }

  const fg = s.artwork === 'full' ? c.paper : onGround ? c.groundType : c.ink;
  const onArtwork = s.artwork === 'full';
  const ctx: Ctx = {
    hideText, sh, s, c, d: o.data, measure: o.measure, content, artRect: bed, fg, accent: c.accent,
    bodyAlpha: onArtwork ? BODY_ALPHA_ON_ART : BODY_ALPHA,
    labelAlpha: onArtwork ? LABEL_ALPHA_ON_ART : LABEL_ALPHA,
  };

  // With the text hidden there is no title to fit, so no layout can fail on
  // one; the composition, its grounds and its rules are all that remain.
  const title = hideText ? { nodes: [], bottom: content.y } : buildTitle(ctx);
  if (!title) return { ok: false, error: s.oneLineTitle ? 'title-needs-one-line' : 'title-too-long' };
  children.push(
    ...(hideText ? [] : buildData(ctx, title.bottom)),
    ...title.nodes,
    ...buildAccent(ctx, title.bottom),
    ...buildDecoration(ctx),
    ...buildQr(ctx),
  );

  return {
    ok: true,
    node: el('svg', { viewBox: `0 0 ${sh.w} ${sh.h}`, width: sh.w, height: sh.h }, children),
  };
}
