import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

/**
 * SPIKE (spike/next-curve) — not registered in patterns/index.ts.
 *
 * Hyperbolic weave: a single closed walk of hyperbolic geodesics in the
 * Poincaré disk. B = m·grain points sit on the boundary circle; the walk
 * visits them by a fixed step δ and joins consecutive points with the
 * geodesic between them — the circular arc through both points orthogonal
 * to the boundary (closed form: for unit vectors u, v the orthogonal
 * circle has centre (u+v)/(1+u·v) and radius √((1−u·v)/(1+u·v))). The
 * rim-orthogonality is the signature: arcs hug the boundary, so density
 * piles up near the rim like an engraving.
 *
 * The theorem doing mystery's job: δ is coerced to the nearest integer
 * coprime with B, so the walk is a single closed cycle through *all* B
 * points (one continuous line, forced), and its edge set {(x, x+δ)} is
 * the full orbit of one edge under rotation by 2π/B — invariant under
 * every rotation x → x+1 by construction. The seed's ripple perturbs the
 * point angles by a wave that is exactly (B/m)-periodic in the point
 * index, which cuts the forced symmetry down to exactly m-fold — still a
 * theorem (the perturbed edge set is carried onto itself by the 2π/m
 * rotation, point j landing on point j + B/m), never a tuning.
 *
 * Three exactly 1-periodic motions ride the phase (fold through `% 1`,
 * integer/symmetry-step rates only, so phase 1 is literally the phase-0
 * expression):
 *  - precess: the whole figure turns by exactly one symmetry step, 2π/m,
 *    per cycle — the m-fold symmetry makes that the identity at the wrap.
 *  - ripple: the seed's perturbation wave travels once around its sector
 *    per cycle (a +2π·tw term inside the wave) — the rim shimmers as the
 *    ripple runs, and the wrap is the identity again.
 *  - fan (mystery's trail): layers spread apart in the phase flow
 *    mid-cycle and close at the wrap.
 */

function gcd(a: number, b: number): number {
  while (b) { const t = a % b; a = b; b = t; }
  return a;
}

/** Nearest integer to `target` in [2, B−2] that is coprime with B. */
function coprimeStep(target: number, B: number): number {
  const t0 = Math.min(Math.max(2, target), Math.max(2, Math.floor(B / 2)));
  for (let d = 0; d < B; d++) {
    for (const c of d === 0 ? [t0] : [t0 - d, t0 + d]) {
      if (c >= 2 && c <= B - 2 && gcd(c, B) === 1) return c;
    }
  }
  return 1; // unreachable: every B ≥ 9 has a coprime in [2, B−2]
}

export const hyperweave = definePattern({
  id: 'hyperweave',
  family: 'curves',
  phase: 1,
  heavy: false,
  usesSeed: true,
  anim: { continuous: ['wobble', 'strokeWidth', 'opacity', 'size'], usesPhase: true },
  params: [
    { key: 'symmetry', kind: 'int', min: 3, max: 12, step: 1, default: 7, label: 'hyperweave.symmetry' },
    { key: 'grain', kind: 'int', min: 3, max: 9, step: 1, default: 5, label: 'hyperweave.grain' },
    { key: 'wind', kind: 'int', min: 2, max: 40, step: 1, default: 9, label: 'hyperweave.wind' },
    { key: 'wobble', kind: 'float', min: 0, max: 0.5, step: 0.02, default: 0.22, label: 'hyperweave.wobble' },
    { key: 'layers', kind: 'int', min: 1, max: 6, step: 1, default: 4, label: 'hyperweave.layers' },
    { key: 'strokeWidth', kind: 'float', min: 0.1, max: 2, step: 0.05, default: 0.5, label: 'hyperweave.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.6, label: 'hyperweave.opacity' },
  ],
  generate(p, seed, size) {
    const m = p['symmetry']!;
    const g = p['grain']!;
    const B = m * g;
    const delta = coprimeStep(p['wind']!, B);
    const rnd = mulberry32(deriveSeed(seed, 'hyperweave'));
    const phiSeed = rnd() * 2 * Math.PI;
    // The ripple's wavenumber around one sector: 1 … g−1 keeps the wave
    // (B/m)-periodic in j whatever it is, so any seed keeps the theorem.
    const wnum = 1 + Math.floor(rnd() * (g - 1));
    // Amplitude in radians, capped at 0.45 of the point spacing so walk
    // points can never collide (walk-adjacent points are δ ≥ 2 slots apart).
    const wobAmp = p['wobble']! * (2 * Math.PI / B) * 0.9;
    const ph = (p['phase'] ?? 0) % 1;
    const layers = p['layers']!;
    const cx = size.w / 2, cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.46;

    const fan = 0.02 + 0.03 * ((1 - Math.cos(2 * Math.PI * ph)) / 2);

    const angle = (j: number, tw: number): number =>
      (2 * Math.PI * j) / B
      + (2 * Math.PI / m) * tw
      + wobAmp * Math.sin((2 * Math.PI * wnum * j) / g + phiSeed + 2 * Math.PI * tw);

    const children: SvgNode[] = [];
    for (let L = layers - 1; L >= 0; L--) {
      const tw = ph + L * fan;
      // Precompute the B boundary points of this layer's moment.
      const px: number[] = [], py: number[] = [];
      for (let j = 0; j < B; j++) {
        const a = angle(j, tw);
        px.push(Math.cos(a)); py.push(Math.sin(a));
      }
      let d = '';
      let jx = 0;
      d += `M${(cx + R * px[0]!).toFixed(2)} ${(cy + R * py[0]!).toFixed(2)}`;
      for (let k = 1; k <= B; k++) {
        const jn = (jx + delta) % B;
        const ux = px[jx]!, uy = py[jx]!, vx = px[jn]!, vy = py[jn]!;
        const dot = ux * vx + uy * vy;
        const ex = (cx + R * vx).toFixed(2), ey = (cy + R * vy).toFixed(2);
        if (1 + dot < 1e-4) {
          // Near-diametral pair: the geodesic degenerates to a straight
          // line through the centre — draw exactly that.
          d += `L${ex} ${ey}`;
        } else {
          const ccx = (ux + vx) / (1 + dot), ccy = (uy + vy) / (1 + dot);
          const r = Math.sqrt((1 - dot) / (1 + dot));
          const cross = (ux - ccx) * (vy - ccy) - (uy - ccy) * (vx - ccx);
          const rr = (r * R).toFixed(2);
          d += `A${rr} ${rr} 0 0 ${cross > 0 ? 1 : 0} ${ex} ${ey}`;
        }
        jx = jn;
      }
      const op = p['opacity']! * (L === 0 ? 1 : Math.max(0.15, 1 - L / layers));
      children.push(el('path', {
        d, fill: 'none', stroke: 'ink',
        'stroke-width': p['strokeWidth']! * (L === 0 ? 1 : 0.8),
        opacity: Math.round(op * 1000) / 1000,
      }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
