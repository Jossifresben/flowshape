import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

/**
 * Farris "mystery curves": z(t) = Σ Aₕ·e^{i(kₕt + φₕ)} where every
 * frequency satisfies kₕ ≡ 1 (mod m). That congruence is the whole
 * theorem — substituting t → t + 2π/m multiplies each term by e^{2πi/m},
 * so the curve maps onto itself rotated by exactly one m-th of a turn.
 * The symmetry is not tuned, it is forced; the phases φₕ are free, which
 * is why every seed is a different flourish with the same perfect order.
 */
export const mystery = definePattern({
  id: 'mystery',
  family: 'curves',
  phase: 1,
  heavy: false,
  usesSeed: true,
  anim: { continuous: ['falloff', 'strokeWidth', 'opacity', 'size'], usesPhase: true },
  params: [
    { key: 'symmetry', kind: 'int', min: 3, max: 12, step: 1, default: 7, label: 'mystery.symmetry' },
    { key: 'harmonics', kind: 'int', min: 2, max: 8, step: 1, default: 6, label: 'mystery.harmonics' },
    { key: 'falloff', kind: 'float', min: 0.6, max: 2.5, step: 0.05, default: 1.05, label: 'mystery.falloff' },
    { key: 'layers', kind: 'int', min: 1, max: 6, step: 1, default: 5, label: 'mystery.layers' },
    { key: 'strokeWidth', kind: 'float', min: 0.1, max: 2, step: 0.05, default: 0.5, label: 'mystery.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.65, label: 'mystery.opacity' },
  ],
  generate(p, seed, size) {
    const m = p['symmetry']!;
    const H = p['harmonics']!;
    const beta = p['falloff']!;
    const layers = p['layers']!;
    const rnd = mulberry32(deriveSeed(seed, 'mystery'));
    // Frequency plan: s = 0, 1, −1, 2, −2, … → k = 1 + m·s, all ≡ 1 (mod m).
    const svals: number[] = [];
    for (let h = 0; h < H; h++) svals.push(h === 0 ? 0 : (h % 2 === 1 ? (h + 1) / 2 : -h / 2));
    const freqs = svals.map((s) => 1 + m * s);
    const amps = svals.map((s) => 1 / Math.pow(1 + Math.abs(s), beta));
    const phis = svals.map(() => rnd() * 2 * Math.PI);
    const kMax = Math.max(...freqs.map((k) => Math.abs(k)));
    const N = Math.max(1024, 128 * kMax);
    const ph = (p['phase'] ?? 0) % 1;
    const cx = size.w / 2, cy = size.h / 2;

    const point = (t: number, tw: number): [number, number] => {
      let x = 0, y = 0;
      for (let h = 0; h < svals.length; h++) {
        // Phase spins each harmonic in proportion to its s-index: at
        // phase 1 every term has turned by a whole 2π·s, i.e. the
        // identity, so the loop closes exactly (`% 1` above makes phase 1
        // the literal phase-0 expression). Rotating phases never touches
        // the frequencies, so the m-fold symmetry survives every frame.
        const a = freqs[h]! * t + phis[h]! + 2 * Math.PI * svals[h]! * tw;
        x += amps[h]! * Math.cos(a);
        y += amps[h]! * Math.sin(a);
      }
      return [x, y];
    };

    // Normalize by the true extremal radius of the base curve so every
    // seed fills the frame equally.
    let maxR = 0;
    for (let i = 0; i < N; i++) {
      const [x, y] = point((2 * Math.PI * i) / N, ph);
      maxR = Math.max(maxR, Math.hypot(x, y));
    }
    const R = (Math.min(size.w, size.h) * 0.44) / (maxR || 1);

    const children: SvgNode[] = [];
    for (let L = layers - 1; L >= 0; L--) {
      // Each layer is the same curve a little further along the phase
      // flow — an engraved motion-trail of the morph itself.
      const tw = ph + L * 0.035;
      let d = '';
      for (let i = 0; i <= N; i++) {
        const [x, y] = point((2 * Math.PI * i) / N, tw);
        d += `${i ? 'L' : 'M'}${(cx + R * x).toFixed(2)} ${(cy + R * y).toFixed(2)}`;
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
