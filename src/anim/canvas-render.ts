import type { SvgNode, Palette } from '../core/svg';

/** The slice of CanvasRenderingContext2D the renderer needs — kept narrow so
 *  tests can drive it with a recording fake. The real 2d context satisfies it. */
export interface Ctx2D {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  rotate(rad: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(path?: Path2D, rule?: CanvasFillRule): void;
  stroke(path?: Path2D): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  globalAlpha: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
}

interface Style {
  fill: string; stroke: string; sw: number;
  alpha: number; fillAlpha: number; strokeAlpha: number;
  cap: CanvasLineCap; join: CanvasLineJoin;
}

/** SVG defaults — matching them is what makes canvas output equal SVG output. */
const ROOT_STYLE: Style = {
  fill: '#000000', stroke: 'none', sw: 1,
  alpha: 1, fillAlpha: 1, strokeAlpha: 1,
  cap: 'butt', join: 'miter',
};

const KNOWN_TAGS = new Set(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon']);
const KNOWN_ATTRS = new Set([
  'xmlns', 'viewBox', 'width', 'height',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'transform',
  'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'rx',
]);

function color(v: string | number, pal: Palette): string {
  const s = String(v);
  if (s === 'ink' || s === 'paper' || s === 'accent') return pal[s];
  return s;
}

function num(v: string | number | undefined): number {
  return v === undefined ? 0 : Number(v);
}

const TRANSFORM_RE = /(translate|scale|rotate)\(([^)]*)\)/g;

function applyTransform(ctx: Ctx2D, spec: string): void {
  TRANSFORM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TRANSFORM_RE.exec(spec)) !== null) {
    const args = m[2]!.split(/[\s,]+/).filter((s) => s.length).map(Number);
    const a0 = args[0] ?? 0;
    if (m[1] === 'translate') ctx.translate(a0, args[1] ?? 0);
    else if (m[1] === 'scale') ctx.scale(a0, args[1] ?? a0);
    else ctx.rotate((a0 * Math.PI) / 180);
  }
}

function paint(ctx: Ctx2D, path: Path2D | null, st: Style, fillRule?: string, strokeOnly = false): void {
  if (!strokeOnly && st.fill !== 'none') {
    ctx.fillStyle = st.fill;
    ctx.globalAlpha = st.alpha * st.fillAlpha;
    const rule = fillRule === 'evenodd' ? 'evenodd' : undefined;
    if (path) ctx.fill(path, rule);
    else ctx.fill(undefined, rule);
  }
  if (st.stroke !== 'none') {
    ctx.strokeStyle = st.stroke;
    ctx.lineWidth = st.sw;
    ctx.lineCap = st.cap;
    ctx.lineJoin = st.join;
    ctx.globalAlpha = st.alpha * st.strokeAlpha;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}

function walk(ctx: Ctx2D, node: SvgNode, pal: Palette, inherited: Style): void {
  if (!KNOWN_TAGS.has(node.tag)) throw new Error(`canvas-render: unsupported tag <${node.tag}>`);
  const a = node.attrs;
  for (const k of Object.keys(a)) {
    if (!KNOWN_ATTRS.has(k)) throw new Error(`canvas-render: unsupported attribute '${k}' on <${node.tag}>`);
  }
  const st: Style = { ...inherited };
  if (a['fill'] !== undefined) st.fill = color(a['fill'], pal);
  if (a['stroke'] !== undefined) st.stroke = color(a['stroke'], pal);
  if (a['stroke-width'] !== undefined) st.sw = num(a['stroke-width']);
  if (a['opacity'] !== undefined) st.alpha = inherited.alpha * num(a['opacity']);
  if (a['fill-opacity'] !== undefined) st.fillAlpha = num(a['fill-opacity']);
  if (a['stroke-opacity'] !== undefined) st.strokeAlpha = num(a['stroke-opacity']);
  if (a['stroke-linecap'] !== undefined) st.cap = String(a['stroke-linecap']) as CanvasLineCap;
  if (a['stroke-linejoin'] !== undefined) st.join = String(a['stroke-linejoin']) as CanvasLineJoin;

  const tf = a['transform'];
  if (tf !== undefined) { ctx.save(); applyTransform(ctx, String(tf)); }

  switch (node.tag) {
    case 'svg':
    case 'g':
      for (const c of node.children) walk(ctx, c, pal, st);
      break;
    case 'path':
      paint(ctx, new Path2D(String(a['d'] ?? '')), st, a['fill-rule'] === undefined ? undefined : String(a['fill-rule']));
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(num(a['cx']), num(a['cy']), num(a['r']), 0, 2 * Math.PI);
      paint(ctx, null, st);
      break;
    case 'rect':
      ctx.beginPath();
      ctx.rect(num(a['x']), num(a['y']), num(a['width']), num(a['height']));
      paint(ctx, null, st);
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(num(a['x1']), num(a['y1']));
      ctx.lineTo(num(a['x2']), num(a['y2']));
      paint(ctx, null, st, undefined, true);
      break;
    case 'polyline':
    case 'polygon': {
      const pts = String(a['points'] ?? '').split(/[\s,]+/).filter((s) => s.length).map(Number);
      ctx.beginPath();
      for (let i = 0; i + 1 < pts.length; i += 2) {
        if (i === 0) ctx.moveTo(pts[0]!, pts[1]!);
        else ctx.lineTo(pts[i]!, pts[i + 1]!);
      }
      if (node.tag === 'polygon') ctx.closePath();
      paint(ctx, null, st, undefined, node.tag === 'polyline' && st.fill === 'none');
      break;
    }
  }

  if (tf !== undefined) ctx.restore();
}

/** Draw a pattern's SvgNode tree onto a canvas 2d context, resolving role
 *  colors through the palette. Throws on any vocabulary it does not support —
 *  silent visual drift between SVG and canvas is the failure mode to fear. */
export function drawTree(ctx: Ctx2D, root: SvgNode, pal: Palette): void {
  walk(ctx, root, pal, ROOT_STYLE);
}
