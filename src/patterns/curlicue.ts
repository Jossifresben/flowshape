import { el } from '../core/svg';
import { definePattern } from './registry';

/**
 * The curlicue fractal (Berry & Goldberg): a walk of unit steps whose
 * heading turns by 2π·α·n at step n — the partial sums of the theta sum
 * Σ e^{πiαn²}, joined by straight lines. Everything on screen is decided
 * by the continued-fraction personality of the single number α: rationals
 * close into crystals, √2−1 chains seahorse curls, the golden ratio lays
 * uniform lace, π−3 marches for thousands of steps before curling.
 */
export const curlicue = definePattern({
  id: 'curlicue',
  family: 'curves',
  phase: 1,
  heavy: false,
  usesSeed: false,
  anim: { continuous: ['curls', 'strokeWidth', 'opacity', 'size'], usesPhase: true },
  params: [
    { key: 'alpha', kind: 'float', min: 0.001, max: 0.06, step: 0.0005, default: 0.007, label: 'curlicue.alpha' },
    { key: 'curls', kind: 'int', min: 10, max: 120, step: 1, default: 42, label: 'curlicue.curls' },
    { key: 'strokeWidth', kind: 'float', min: 0.1, max: 2, step: 0.05, default: 0.55, label: 'curlicue.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.85, label: 'curlicue.opacity' },
  ],
  generate(p, _seed, size) {
    const alpha = p['alpha']!;
    // The walk only shows its spiral hierarchy while α·N stays in a narrow
    // band (roughly 30–100): far below, one bare arc; far above, the curls
    // shrink under a pixel and the figure reads as fuzz. So the second knob
    // is not a raw step count but the curl budget, and N adapts to α —
    // every combination the sliders (or Randomize) can produce is a walk
    // whose structure is actually visible.
    const N = Math.min(40000, Math.round(p['curls']! / alpha));
    const TWO_PI = 2 * Math.PI;
    // Accumulate the walk. The turning angle is built by recurrence with a
    // per-step wrap: computing sin(π·α·n²) directly loses float precision
    // once n² is large, but α·n stays exact to ~1e-12 over this range and
    // the wrap keeps the accumulator small.
    const xs = new Float64Array(N + 1);
    const ys = new Float64Array(N + 1);
    let ang = 0, x = 0, y = 0;
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let n = 1; n <= N; n++) {
      ang = (ang + TWO_PI * ((alpha * n) % 1)) % TWO_PI;
      x += Math.cos(ang);
      y += Math.sin(ang);
      xs[n] = x; ys[n] = y;
      if (x < minX) minX = x; else if (x > maxX) maxX = x;
      if (y < minY) minY = y; else if (y > maxY) maxY = y;
    }
    // Precession, as in maurer: the figure turns once per phase cycle, and
    // `% 1` closes the loop on the identity exactly. Rotate first, THEN
    // fit — the walk's extent is data-dependent and often anisotropic, so
    // fitting the rotated bounding box is what keeps every frame inside
    // the frame.
    const rot = ((p['phase'] ?? 0) % 1) * TWO_PI;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
    let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
    const rxs = new Float64Array(N + 1);
    const rys = new Float64Array(N + 1);
    for (let n = 0; n <= N; n++) {
      const dx = xs[n]! - mx, dy = ys[n]! - my;
      const rx = dx * cr - dy * sr, ry = dx * sr + dy * cr;
      rxs[n] = rx; rys[n] = ry;
      if (rx < rMinX) rMinX = rx; if (rx > rMaxX) rMaxX = rx;
      if (ry < rMinY) rMinY = ry; if (ry > rMaxY) rMaxY = ry;
    }
    const spanX = Math.max(rMaxX - rMinX, 1e-9);
    const spanY = Math.max(rMaxY - rMinY, 1e-9);
    const scale = Math.min((size.w * 0.88) / spanX, (size.h * 0.88) / spanY);
    const ox = size.w / 2 - ((rMinX + rMaxX) / 2) * scale;
    const oy = size.h / 2 - ((rMinY + rMaxY) / 2) * scale;
    let d = '';
    for (let n = 0; n <= N; n++) {
      d += `${n ? 'L' : 'M'}${(ox + rxs[n]! * scale).toFixed(2)} ${(oy + rys[n]! * scale).toFixed(2)}`;
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, [
      el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: p['opacity']!, 'stroke-linejoin': 'round' }),
    ]);
  },
});
