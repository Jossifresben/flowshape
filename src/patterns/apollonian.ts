import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

/** Minimal complex-number helpers — no library, just what Descartes' theorem needs. */
interface Complex { re: number; im: number }

const C0: Complex = { re: 0, im: 0 };
const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cscale = (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s });
const cdiv = (a: Complex, s: number): Complex => cscale(a, 1 / s);

/** Principal complex square root, via polar form. */
function csqrt(z: Complex): Complex {
  const r = Math.hypot(z.re, z.im);
  if (r === 0) return C0;
  const theta = Math.atan2(z.im, z.re);
  const sr = Math.sqrt(r);
  const ht = theta / 2;
  return { re: sr * Math.cos(ht), im: sr * Math.sin(ht) };
}

interface Circle { k: number; z: Complex }

const EPS = 1e-9;

/** Descartes' Circle Theorem, complex form: the two circles tangent to all three of c1,c2,c3. */
function descartesRoots(c1: Circle, c2: Circle, c3: Circle): [Circle, Circle] {
  const kSum = c1.k + c2.k + c3.k;
  const kProdSum = c1.k * c2.k + c2.k * c3.k + c3.k * c1.k;
  const kRad = Math.sqrt(Math.max(0, kProdSum));

  const zWeighted = cadd(cadd(cscale(c1.z, c1.k), cscale(c2.z, c2.k)), cscale(c3.z, c3.k));
  const crossSum = cadd(
    cadd(cscale(cmul(c1.z, c2.z), c1.k * c2.k), cscale(cmul(c2.z, c3.z), c2.k * c3.k)),
    cscale(cmul(c3.z, c1.z), c3.k * c1.k),
  );
  const croot = csqrt(crossSum);

  const kA = kSum + 2 * kRad;
  const kB = kSum - 2 * kRad;
  const zA = Math.abs(kA) > EPS ? cdiv(cadd(zWeighted, cscale(croot, 2)), kA) : C0;
  const zB = Math.abs(kB) > EPS ? cdiv(csub(zWeighted, cscale(croot, 2)), kB) : C0;
  return [{ k: kA, z: zA }, { k: kB, z: zB }];
}

/** From a mutually-tangent triple that (together with `omitted`) forms a known
 *  Descartes quadruple, find the *other* circle tangent to all three. */
function otherTangentCircle(triple: [Circle, Circle, Circle], omitted: Circle): Circle | null {
  const [a, b] = descartesRoots(triple[0], triple[1], triple[2]);
  const dist = (c: Circle): number =>
    Math.abs(c.k - omitted.k) + Math.hypot(c.z.re - omitted.z.re, c.z.im - omitted.z.im);
  const cand = dist(a) < dist(b) ? b : a;
  if (!Number.isFinite(cand.k) || !Number.isFinite(cand.z.re) || !Number.isFinite(cand.z.im)) return null;
  if (Math.abs(cand.k) < EPS) return null;
  return cand;
}

const MAX_CIRCLES = 4000;

export const apollonian = definePattern({
  id: 'apollonian',
  family: 'points',
  phase: 1,
  heavy: false,
  usesSeed: false,
  params: [
    { key: 'maxDepth', kind: 'int', min: 2, max: 8, step: 1, default: 6, label: 'apollonian.maxDepth' },
    { key: 'minRadius', kind: 'float', min: 1, max: 30, step: 0.5, default: 3, label: 'apollonian.minRadius' },
    { key: 'strokeWidth', kind: 'float', min: 0.15, max: 1.5, step: 0.05, default: 0.5, label: 'apollonian.strokeWidth' },
    { key: 'fillAlternate', kind: 'bool', min: 0, max: 1, step: 1, default: 0, label: 'apollonian.fillAlternate' },
  ],
  generate(p, _seed, size) {
    const maxDepth = p['maxDepth']!;
    const minRadius = p['minRadius']!;
    const strokeWidth = p['strokeWidth']!;
    const fillAlternate = p['fillAlternate']! >= 0.5;

    const R = 0.46 * Math.min(size.w, size.h);
    const cx = size.w / 2, cy = size.h / 2;

    // Seed: an enclosing circle plus two equal inner circles tangent to each
    // other and to the enclosure; the fourth (the "asymmetric" third inner
    // circle from the brief) is generated from that triple via Descartes'
    // theorem itself, rather than derived by hand.
    const outer: Circle = { k: -1, z: C0 };
    const c1: Circle = { k: 2, z: { re: -0.5, im: 0 } };
    const c2: Circle = { k: 2, z: { re: 0.5, im: 0 } };
    const [seedPlus] = descartesRoots(outer, c1, c2);
    const c3: Circle = seedPlus;

    interface Emitted { k: number; z: Complex; depth: number }
    const seen = new Set<string>();
    const out: Emitted[] = [];

    const key = (c: Circle): string =>
      `${Math.round(c.k * 1000)},${Math.round(c.z.re * 1000)},${Math.round(c.z.im * 1000)}`;

    function tryEmit(c: Circle, depth: number): boolean {
      const kk = key(c);
      if (seen.has(kk)) return false;
      const r = R / Math.abs(c.k);
      if (r < minRadius) return false;
      if (out.length >= MAX_CIRCLES) return false;
      seen.add(kk);
      out.push({ k: c.k, z: c.z, depth });
      return true;
    }

    for (const c of [outer, c1, c2, c3]) tryEmit(c, 0);

    function recurse(triple: [Circle, Circle, Circle], omitted: Circle, depth: number): void {
      if (depth > maxDepth) return;
      if (out.length >= MAX_CIRCLES) return;
      const next = otherTangentCircle(triple, omitted);
      if (!next) return;
      if (!tryEmit(next, depth)) return;
      const [a, b, c] = triple;
      recurse([a, b, next], c, depth + 1);
      recurse([a, c, next], b, depth + 1);
      recurse([b, c, next], a, depth + 1);
    }

    recurse([outer, c1, c2], c3, 1);
    recurse([outer, c1, c3], c2, 1);
    recurse([outer, c2, c3], c1, 1);
    recurse([c1, c2, c3], outer, 1);

    const children: SvgNode[] = out.map(({ k, z, depth }) => {
      const shade = fillAlternate && depth % 2 === 0;
      return el('circle', {
        cx: cx + R * z.re,
        cy: cy + R * z.im,
        r: R / Math.abs(k),
        fill: shade ? 'ink' : 'none',
        ...(shade ? { 'fill-opacity': 0.12 } : {}),
        stroke: 'ink',
        'stroke-width': strokeWidth,
      });
    });

    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
