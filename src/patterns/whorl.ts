import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

/**
 * Fingerprint ridge field — the Sherlock–Monro zero-pole model.
 *
 * A fingerprint is a field of *orientations*, not of vectors: a ridge has no
 * head or tail, so the direction at a point is an angle modulo π. Sherlock &
 * Monro (1993) showed that the whole topology of a print falls out of one
 * formula on the complex plane, with a core (the centre of a loop) as a zero
 * and a delta (the triradius where three ridge systems meet) as a pole:
 *
 *   θ(z) = θ₀ + ½ · [ Σᵢ arg(z − cᵢ) − Σⱼ arg(z − dⱼ) ]
 *
 * The ½ is the whole trick. Walking once around a core turns θ by π — half a
 * turn — which is exactly the half-index singularity that makes ridges loop
 * back on themselves instead of radiating like field lines from a charge.
 * Galton's classes are then just the counts: arch (0, 0), loop (1, 1), plain
 * whorl (2, 2) with the two cores close together.
 *
 * Ridges are streamlines of (cos θ, sin θ), traced both ways from a grid of
 * seeds and kept apart by the same occupancy grid `flowfield` and `coulomb`
 * use (a coarse version of Jobard–Lefer). Because the field is undirected the
 * tracer keeps a running sign and flips the step whenever it would reverse.
 *
 * Motion: with two or more cores the core constellation orbits its own centre
 * once per cycle, so the whorl visibly turns while the deltas hold; with one
 * core or none, θ₀ advances by π instead — the orientation field is π-periodic
 * so both loops are exact at phase 1, and `% 1` folds it onto phase 0.
 */

interface Pt { x: number; y: number }

export const whorl = definePattern({
  id: 'whorl',
  family: 'fields',
  phase: 1,
  heavy: false,
  usesSeed: true,
  anim: { continuous: ['separation', 'lean', 'steps', 'strokeWidth', 'size'], usesPhase: true },
  params: [
    { key: 'cores', kind: 'int', min: 0, max: 3, step: 1, default: 2, label: 'whorl.cores' },
    { key: 'deltas', kind: 'int', min: 0, max: 3, step: 1, default: 2, label: 'whorl.deltas' },
    { key: 'separation', kind: 'float', min: 0.04, max: 0.5, step: 0.01, default: 0.18, label: 'whorl.separation' },
    { key: 'lean', kind: 'float', min: 0, max: 180, step: 1, default: 0, label: 'whorl.lean' },
    { key: 'spacing', kind: 'int', min: 4, max: 16, step: 1, default: 7, label: 'whorl.spacing' },
    { key: 'steps', kind: 'int', min: 50, max: 600, step: 10, default: 400, label: 'whorl.steps' },
    { key: 'strokeWidth', kind: 'float', min: 0.15, max: 2.5, step: 0.05, default: 0.5, label: 'whorl.strokeWidth' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 40, step: 1, default: 0, label: 'whorl.accentEvery' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'whorl'));
    const cx = size.w / 2, cy = size.h / 2;
    const D = Math.min(size.w, size.h);
    const m = p['cores']!, n = p['deltas']!;
    const ph = (p['phase'] ?? 0) % 1;

    // Singularities. Jitter is drawn from the PRNG BEFORE phase is applied so
    // the seed decides the constellation and phase only moves it.
    const cores: Pt[] = [];
    const coreR = m >= 2 ? (p['separation']! * D) / 2 : 0;
    const coreBase = rnd() * Math.PI;
    for (let i = 0; i < m; i++) {
      const jitter = (rnd() - 0.5) * 0.5;
      const a = coreBase + (i / Math.max(m, 1)) * 2 * Math.PI + jitter + (m >= 2 ? 2 * Math.PI * ph : 0);
      cores.push({ x: cx + coreR * Math.cos(a), y: cy + coreR * Math.sin(a) });
    }
    const deltas: Pt[] = [];
    for (let j = 0; j < n; j++) {
      // Deltas sit below the cores, fanned across the lower half (SVG y is
      // down, so π/2 points at the bottom edge) — the print's own layout.
      const a = Math.PI / 2 + (j - (n - 1) / 2) * (Math.PI / n) + (rnd() - 0.5) * 0.4;
      const r = D * (0.3 + rnd() * 0.12);
      deltas.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    const lean = (p['lean']! / 180) * Math.PI + (m >= 2 ? 0 : Math.PI * ph);

    const orient = (x: number, y: number): number => {
      let t = lean;
      for (const c of cores) t += 0.5 * Math.atan2(y - c.y, x - c.x);
      for (const d of deltas) t -= 0.5 * Math.atan2(y - d.y, x - d.x);
      return t;
    };

    const spacing = p['spacing']!;
    const stopDist = Math.max(3, spacing * 0.6);
    const stop2 = stopDist * stopDist;
    const nearSingularity = (x: number, y: number): boolean => {
      for (const c of cores) { const dx = x - c.x, dy = y - c.y; if (dx * dx + dy * dy < stop2) return true; }
      for (const d of deltas) { const dx = x - d.x, dy = y - d.y; if (dx * dx + dy * dy < stop2) return true; }
      return false;
    };

    const margin = 20;
    const CELL = Math.max(2, Math.round(spacing * 0.5));
    const gw = Math.ceil(size.w / CELL), gh = Math.ceil(size.h / CELL);
    const occ = new Int16Array(gw * gh);
    const half = Math.max(5, Math.floor(p['steps']! / 2));
    const STEP = 2;

    // Trace one direction from (x0, y0), initial sign `sgn`, claiming cells
    // for line `id`. Returns the points walked (excluding the seed).
    const trace = (x0: number, y0: number, sgn: number, id: number): Pt[] => {
      const pts: Pt[] = [];
      let x = x0, y = y0;
      let px = Math.cos(orient(x, y)) * sgn, py = Math.sin(orient(x, y)) * sgn;
      for (let k = 0; k < half; k++) {
        const a = orient(x, y);
        let ux = Math.cos(a), uy = Math.sin(a);
        if (ux * px + uy * py < 0) { ux = -ux; uy = -uy; }
        x += ux * STEP;
        y += uy * STEP;
        px = ux; py = uy;
        if (x < margin || x > size.w - margin || y < margin || y > size.h - margin) break;
        if (nearSingularity(x, y)) break;
        const ci = Math.floor(x / CELL) + Math.floor(y / CELL) * gw;
        if (occ[ci] && occ[ci] !== id) break;
        occ[ci] = id;
        pts.push({ x, y });
      }
      return pts;
    };

    let id = 0;
    let drawn = 0;
    const children: SvgNode[] = [];
    const f = (v: number): string => v.toFixed(2);
    for (let gy = margin; gy < size.h - margin; gy += spacing) {
      for (let gx = margin; gx < size.w - margin; gx += spacing) {
        if (rnd() < 0.35) continue;
        const x = gx + rnd() * 4, y = gy + rnd() * 4;
        if (nearSingularity(x, y)) continue;
        const c0 = Math.floor(x / CELL) + Math.floor(y / CELL) * gw;
        if (occ[c0]) continue;
        id++;
        occ[c0] = id;
        const fwd = trace(x, y, 1, id);
        const back = trace(x, y, -1, id);
        // Stubs shorter than this read as stitching between neighbours, not as
        // ridge; dropping them costs a little coverage and buys a cleaner print.
        if (fwd.length + back.length < 10) continue;
        drawn++;
        let d = '';
        for (let i = back.length - 1; i >= 0; i--) d += (d ? 'L' : 'M') + f(back[i]!.x) + ' ' + f(back[i]!.y);
        d += (d ? 'L' : 'M') + f(x) + ' ' + f(y);
        for (const q of fwd) d += 'L' + f(q.x) + ' ' + f(q.y);
        const accent = p['accentEvery']! > 0 && drawn % p['accentEvery']! === 0;
        children.push(el('path', {
          d,
          fill: 'none',
          stroke: accent ? 'accent' : 'ink',
          'stroke-width': accent ? p['strokeWidth']! * 1.8 : p['strokeWidth']!,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          opacity: accent ? 1 : 0.85,
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
