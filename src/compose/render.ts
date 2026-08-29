import { el, elText, resolveRoles, type SvgNode } from '../core/svg';
import { u, type Sheet } from './units';
import type { Skeleton } from './regions';
import { artworkPalette, resolvePresentation, type Colorway } from './colorways';
import type { PosterData } from './data';
import type { Measure } from './measure';
import { fitTitle, wrap, type Fit } from './text';

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
  onWarn?: (message: string) => void;
}

export type RenderResult =
  | { ok: true; node: SvgNode }
  | { ok: false; error: 'title-too-long' | 'title-needs-one-line' };

/** Section 7's floor, in reference px. Below this, fail rather than ellipse. */
const TITLE_FLOOR = 76;

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
  const region = s.artwork === 'plate' ? plateRect(sh, s, art) : art;
  return region.w <= region.h
    ? { w: 600, h: Math.round((600 * region.h) / region.w) }
    : { w: Math.round((600 * region.w) / region.h), h: 600 };
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
 *  sits on, rather than authored per ground, so a new colorway needs no new hex. */
const BODY_ALPHA = 0.78;
const LABEL_ALPHA = 0.58;

interface TypeOpts {
  size: number;
  fill: string;
  mono?: boolean;
  weight?: number;
  tracking?: number;
  anchor?: 'start' | 'end';
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
  if (o.anchor === 'end') attrs['text-anchor'] = 'end';
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
  fill: string, measure: Measure, anchor?: 'start' | 'end',
) {
  const lines = wrap(text, width, size, measure);
  const lh = size * 1.55;
  const nodes = lines.map((line, i) =>
    tx(line, x, top + size + i * lh, { size, fill, opacity: BODY_ALPHA, anchor }));
  return { nodes, bottom: top + size + Math.max(0, lines.length - 1) * lh };
}

function monoLine(text: string, x: number, y: number, sh: Sheet, fill: string, anchor?: 'start' | 'end') {
  // Uppercase is applied here, never stored in the data.
  return tx(text.toUpperCase(), x, y, {
    size: u(sh, 21), fill, mono: true, tracking: 0.12, opacity: LABEL_ALPHA, anchor,
  });
}

interface Ctx {
  sh: Sheet;
  s: Skeleton;
  c: Colorway;
  d: PosterData;
  measure: Measure;
  content: Rect;
  fg: string;
  accent: string;
}

function buildTitle(ctx: Ctx): { nodes: SvgNode[]; bottom: number } | null {
  const { sh, s, d, content, measure } = ctx;
  const split = s.title === 'split';
  const titleW = split ? content.w * 0.55 : content.w;
  const descW = split ? content.w * 0.38 : Math.min(content.w, u(sh, 440));
  const maxLines = s.oneLineTitle ? 1 : 2;
  // The accent `title` mode is the only place the title takes the accent colour.
  const titleFill = s.accent === 'title' ? ctx.accent : ctx.fg;

  const fit = fitTitle(d.name, titleW, maxLines, u(sh, s.titleSize), u(sh, TITLE_FLOOR), measure);
  if (!fit) return null;

  // A banded title sits at the foot of its band, clearing the boundary.
  const top = s.title === 'banded' ? content.y + content.h - fit.size * 1.2 : content.y;
  const head = titleLines(fit, content.x, top, titleFill);
  const nodes = [...head.nodes];
  let bottom = head.bottom;

  // 4c drops body copy by design: on a tint it cannot clear 4.5:1.
  const showDesc = s.data !== 'ruled-boxes' && s.title !== 'banded' && s.present !== 'tinted';
  if (showDesc && d.description) {
    const size = u(sh, 25);
    const para = split
      ? paragraph(d.description, content.x + content.w, content.y, descW, size, ctx.fg, measure, 'end')
      : paragraph(d.description, content.x, bottom + u(sh, 44), descW, size, ctx.fg, measure);
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
      monoLine(`FORM: ${d.formLabel}`, content.x, y, sh, fg),
      monoLine(`MODE: ${d.modeLabel}`, content.x, y + u(sh, 34), sh, fg),
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
        size: u(sh, 19), fill: fg, mono: true, tracking: 0.12, opacity: LABEL_ALPHA,
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
    tx(d.formLabel, content.x + u(sh, 24), y + boxH * 0.62, {
      size: Math.min(u(sh, 120), boxH * 0.6), fill: fg, weight: 700, tracking: -0.045,
    }),
    monoLine(`FORM: ${d.formLabel}`, divider + u(sh, 24), y + boxH * 0.42, sh, fg),
    monoLine(`MODE: ${d.modeLabel}`, divider + u(sh, 24), y + boxH * 0.56, sh, fg),
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
 * Section 3d's scrim. Not optional where a layout puts type over artwork: the
 * stops keep light type clear of the artwork's own brightest bands.
 */
function buildScrim(sh: Sheet, c: Colorway, id: string): SvgNode[] {
  const stop = (offset: string, opacity: number) =>
    el('stop', { offset, 'stop-color': c.ink, 'stop-opacity': opacity });
  return [
    el('defs', {}, [
      el('linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' }, [
        stop('0%', 0.82), stop('34%', 0.10), stop('62%', 0.20), stop('100%', 0.90),
      ]),
    ]),
    el('rect', { x: 0, y: 0, width: sh.w, height: sh.h, fill: `url(#${id})` }),
  ];
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
  if (s.decoration.verticalCaption) {
    const x = content.x - u(sh, 22);
    const y = content.y + content.h;
    out.push(el('g', { transform: `rotate(-90 ${x} ${y})` }, [
      tx(`${d.formLabel} · SEED ${d.seed}`, x, y, {
        size: u(sh, 19), fill: fg, mono: true, tracking: 0.14, opacity: LABEL_ALPHA,
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

  const bed = s.artwork === 'plate' ? plateRect(sh, s, art) : art;
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
  const ctx: Ctx = { sh, s, c, d: o.data, measure: o.measure, content, fg, accent: c.accent };

  const title = buildTitle(ctx);
  if (!title) return { ok: false, error: s.oneLineTitle ? 'title-needs-one-line' : 'title-too-long' };
  children.push(
    ...buildData(ctx, title.bottom),
    ...title.nodes,
    ...buildAccent(ctx, title.bottom),
    ...buildDecoration(ctx),
  );

  return {
    ok: true,
    node: el('svg', { viewBox: `0 0 ${sh.w} ${sh.h}`, width: sh.w, height: sh.h }, children),
  };
}
