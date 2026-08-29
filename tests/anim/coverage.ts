import type { SvgNode } from '../../src/core/svg';

/**
 * Three complementary measures of "is there still a picture here", used by the
 * route-swing guards to assert that no audio route or event window can drive a
 * pattern to a value where the figure falls apart. Not a rasterizer: every
 * primitive is walked and sampled along its own geometry — including
 * elliptical arcs, which is the whole point, because one of the degeneracies
 * this exists to catch is an arc that collapses to a point while the path data
 * still looks perfectly healthy.
 *
 * All three are needed, and each one alone misses a real case:
 *  - `coverage` (fraction of a coarse grid touched) catches a figure that has
 *    left the frame or shrunk to a corner. It does NOT catch thinning:
 *    apollonian at maxDepth 2 is 16 circles instead of 209 and still covers
 *    31% of the frame against 33%.
 *  - `ink` (stroke length x weight, fill area) catches thinning. maurer at
 *    d = 1 collapses from 47k to 4.8k while its coverage does not move at all.
 *  - `elements` catches a population collapse that the surviving elements'
 *    size disguises — apollonian's 16 circles are the big ones, so its ink
 *    only halves.
 */
const G = 48;

export interface Substance { coverage: number; ink: number; elements: number }

/** All three measures from one walk. */
export function substance(node: SvgNode, w: number, h: number): Substance {
  return { coverage: coverage(node, w, h), ink: inkOf(node), elements: countOf(node) };
}

const DRAWN = new Set(['path', 'circle', 'rect', 'polygon', 'polyline', 'line', 'ellipse']);

function countOf(n: SvgNode): number {
  let c = DRAWN.has(n.tag) && !(n.tag === 'rect' && n.attrs['fill'] === 'paper') ? 1 : 0;
  for (const k of n.children) c += countOf(k);
  return c;
}

/** Total drawn substance: stroke length x weight for strokes, area for fills. */
function inkOf(n: SvgNode, acc = { v: 0 }): number {
  const op = num(n.attrs['opacity'], 1) * num(n.attrs['fill-opacity'], 1);
  const sw = num(n.attrs['stroke-width'], 1);
  const filled = String(n.attrs['fill'] ?? 'none') !== 'none' && n.attrs['fill'] !== 'paper';
  if (n.tag === 'path') {
    let len = 0, px = NaN, py = NaN;
    samplePath(String(n.attrs['d'] ?? ''), (x, y) => {
      if (Number.isFinite(px)) len += Math.hypot(x - px, y - py);
      px = x; py = y;
    });
    acc.v += len * sw * op;
  } else if (n.tag === 'circle') {
    const r = num(n.attrs['r']);
    acc.v += (filled ? Math.PI * r * r : 2 * Math.PI * r * sw) * op;
  } else if (n.tag === 'rect' && n.attrs['fill'] !== 'paper') {
    acc.v += num(n.attrs['width']) * num(n.attrs['height']) * op;
  } else if (n.tag === 'polygon' || n.tag === 'polyline') {
    const pts = String(n.attrs['points'] ?? '').trim().split(/\s+/).map((t) => t.split(',').map(Number));
    let per = 0;
    for (let i = 1; i < pts.length; i++) per += Math.hypot((pts[i]![0] ?? 0) - (pts[i - 1]![0] ?? 0), (pts[i]![1] ?? 0) - (pts[i - 1]![1] ?? 0));
    acc.v += (filled ? per * per * 0.05 : per * sw) * op;
  } else if (n.tag === 'line') {
    acc.v += Math.hypot(num(n.attrs['x2']) - num(n.attrs['x1']), num(n.attrs['y2']) - num(n.attrs['y1'])) * sw * op;
  }
  for (const k of n.children) inkOf(k, acc);
  return acc.v;
}

function num(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }

export function coverage(node: SvgNode, w: number, h: number): number {
  const hit = new Uint8Array(G * G);
  const put = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const gx = Math.min(G - 1, Math.max(0, Math.floor((x / w) * G)));
    const gy = Math.min(G - 1, Math.max(0, Math.floor((y / h) * G)));
    hit[gy * G + gx] = 1;
  };
  const walk = (n: SvgNode, tx: number, ty: number, sc: number) => {
    let ntx = tx, nty = ty, nsc = sc;
    const m = String(n.attrs['transform'] ?? '').match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.eE]+)\) translate/);
    if (m) {
      const cx = Number(m[1]), cy = Number(m[2]), s = Number(m[3]);
      nsc = sc * s; ntx = tx + sc * (cx - s * cx); nty = ty + sc * (cy - s * cy);
    }
    const X = (x: number) => ntx + nsc * x;
    const Y = (y: number) => nty + nsc * y;
    if (n.tag === 'path') samplePath(String(n.attrs['d'] ?? ''), (x, y) => put(X(x), Y(y)));
    else if (n.tag === 'circle') {
      const r = num(n.attrs['r']), cx = num(n.attrs['cx']), cy = num(n.attrs['cy']);
      for (let i = 0; i < 16; i++) put(X(cx + r * Math.cos((i / 16) * 2 * Math.PI)), Y(cy + r * Math.sin((i / 16) * 2 * Math.PI)));
    } else if (n.tag === 'rect' && n.attrs['fill'] !== 'paper') {
      const x = num(n.attrs['x']), y = num(n.attrs['y']), rw = num(n.attrs['width']), rh = num(n.attrs['height']);
      for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) put(X(x + (i * rw) / 2), Y(y + (j * rh) / 2));
    } else if (n.tag === 'polygon' || n.tag === 'polyline') {
      for (const pt of String(n.attrs['points'] ?? '').trim().split(/\s+/)) {
        const [a, b] = pt.split(',').map(Number);
        put(X(a ?? 0), Y(b ?? 0));
      }
    } else if (n.tag === 'line') {
      const x1 = num(n.attrs['x1']), y1 = num(n.attrs['y1']), x2 = num(n.attrs['x2']), y2 = num(n.attrs['y2']);
      const steps = Math.max(1, Math.min(64, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4)));
      for (let i = 0; i <= steps; i++) put(X(x1 + ((x2 - x1) * i) / steps), Y(y1 + ((y2 - y1) * i) / steps));
    }
    for (const c of n.children) walk(c, ntx, nty, nsc);
  };
  walk(node, 0, 0, 1);
  let on = 0;
  for (const v of hit) on += v;
  return on / hit.length;
}

function samplePath(d: string, put: (x: number, y: number) => void): void {
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const seg = (nx: number, ny: number) => {
    const steps = Math.max(1, Math.min(96, Math.ceil(Math.hypot(nx - cx, ny - cy) / 4)));
    for (let i = 1; i <= steps; i++) put(cx + ((nx - cx) * i) / steps, cy + ((ny - cy) * i) / steps);
    cx = nx; cy = ny;
  };
  const arc = (rx0: number, ry0: number, rot: number, laf: boolean, sf: boolean, ex: number, ey: number) => {
    let rx = Math.abs(rx0), ry = Math.abs(ry0);
    if (rx === 0 || ry === 0) { seg(ex, ey); return; }
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const dx2 = (cx - ex) / 2, dy2 = (cy - ey) / 2;
    const x1p = cr * dx2 + sr * dy2, y1p = -sr * dx2 + cr * dy2;
    const l = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (l > 1) { const k = Math.sqrt(l); rx *= k; ry *= k; }
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const numr = Math.max(0, rx * rx * ry * ry - den);
    const co = (laf !== sf ? 1 : -1) * Math.sqrt(den === 0 ? 0 : numr / den);
    const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
    const ccx = cr * cxp - sr * cyp + (cx + ex) / 2;
    const ccy = sr * cxp + cr * cyp + (cy + ey) / 2;
    const ang = (ux: number, uy: number, vx: number, vy: number) => {
      const s = Math.sign(ux * vy - uy * vx) || 1;
      const c = Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))));
      return s * Math.acos(c);
    };
    const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sf && dt > 0) dt -= 2 * Math.PI;
    if (sf && dt < 0) dt += 2 * Math.PI;
    const n = Math.max(4, Math.ceil((Math.abs(dt) * Math.max(rx, ry)) / 4));
    for (let i = 1; i <= n; i++) {
      const t = t1 + (dt * i) / n;
      seg(ccx + cr * rx * Math.cos(t) - sr * ry * Math.sin(t), ccy + sr * rx * Math.cos(t) + cr * ry * Math.sin(t));
    }
  };
  const re = /([MLVHAZmlvhaz])((?:\s*,?\s*-?[\d.]+(?:e-?\d+)?)*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const c = m[1]!;
    const a = (m[2] ?? '').trim().split(/[\s,]+/).filter((t) => t.length).map(Number);
    const rel = c === c.toLowerCase();
    switch (c.toUpperCase()) {
      case 'M':
        for (let i = 0; i + 1 < a.length; i += 2) {
          const nx = rel ? cx + a[i]! : a[i]!, ny = rel ? cy + a[i + 1]! : a[i + 1]!;
          if (i === 0) { cx = nx; cy = ny; sx = nx; sy = ny; put(cx, cy); } else seg(nx, ny);
        }
        break;
      case 'L':
        for (let i = 0; i + 1 < a.length; i += 2) seg(rel ? cx + a[i]! : a[i]!, rel ? cy + a[i + 1]! : a[i + 1]!);
        break;
      case 'V': for (const v of a) seg(cx, rel ? cy + v : v); break;
      case 'H': for (const v of a) seg(rel ? cx + v : v, cy); break;
      case 'A':
        for (let i = 0; i + 6 < a.length; i += 7) {
          arc(a[i]!, a[i + 1]!, (a[i + 2]! * Math.PI) / 180, a[i + 3]! !== 0, a[i + 4]! !== 0,
            rel ? cx + a[i + 5]! : a[i + 5]!, rel ? cy + a[i + 6]! : a[i + 6]!);
        }
        break;
      case 'Z': seg(sx, sy); break;
    }
  }
}
