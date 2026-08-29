/** Pure DSP over Float32Array. No Web Audio types — identical results in
 *  node tests, the live loop, and the future offline exporter. */

/** In-place-free Hann window (input length must be ≥ 2). */
export function hannWindow(x: Float32Array): Float32Array {
  const n = x.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = x[i]! * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return out;
}

/** Magnitude spectrum (n/2 bins) of a real signal. n must be a power of two.
 *  Iterative radix-2 Cooley-Tukey; magnitudes normalized by n. */
export function fftMag(samples: Float32Array): Float32Array {
  const n = samples.length;
  if ((n & (n - 1)) !== 0) throw new Error(`fftMag: length ${n} is not a power of two`);
  const re = Float32Array.from(samples);
  const im = new Float32Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]!; re[i] = re[j]!; re[j] = tr;
      const ti = im[i]!; im[i] = im[j]!; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const vr = re[b]! * cr - im[b]! * ci;
        const vi = re[b]! * ci + im[b]! * cr;
        re[b] = re[a]! - vr; im[b] = im[a]! - vi;
        re[a] = re[a]! + vr; im[a] = im[a]! + vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i]!, im[i]!) / n;
  return mag;
}

export function rms(samples: Float32Array): number {
  let s = 0;
  for (let i = 0; i < samples.length; i++) s += samples[i]! * samples[i]!;
  return Math.sqrt(s / samples.length);
}

/** Mean magnitude across the bins covering [loHz, hiHz]. */
export function bandEnergy(mag: Float32Array, sampleRate: number, loHz: number, hiHz: number): number {
  const binHz = sampleRate / (mag.length * 2);
  const lo = Math.max(0, Math.floor(loHz / binHz));
  const hi = Math.min(mag.length - 1, Math.ceil(hiHz / binHz));
  if (hi < lo) return 0;
  let s = 0;
  for (let i = lo; i <= hi; i++) s += mag[i]!;
  return s / (hi - lo + 1);
}

/** Spectral centroid in Hz, normalized against 8 kHz and capped at 1.
 *  0 when the frame has no energy. */
export function spectralCentroid(mag: Float32Array, sampleRate: number): number {
  const binHz = sampleRate / (mag.length * 2);
  let num = 0, den = 0;
  for (let i = 0; i < mag.length; i++) { num += i * binHz * mag[i]!; den += mag[i]!; }
  if (den < 1e-9) return 0;
  return Math.min(1, num / den / 8000);
}

/** Mean positive spectral difference vs the previous frame; 0 without one. */
export function spectralFlux(mag: Float32Array, prev: Float32Array | null): number {
  if (!prev || prev.length !== mag.length) return 0;
  let s = 0;
  for (let i = 0; i < mag.length; i++) {
    const d = mag[i]! - prev[i]!;
    if (d > 0) s += d;
  }
  return s / mag.length;
}
