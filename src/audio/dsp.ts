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

/** One-pole attack/release smoother. Fast up, slow down — the compressor-style
 *  shaping that makes audio-driven motion feel musical instead of jittery. */
export class EnvelopeFollower {
  private y = 0;
  constructor(private attackMs: number, private releaseMs: number) {}
  /** Retune live without resetting the envelope state. */
  setTimes(attackMs: number, releaseMs: number): void {
    this.attackMs = attackMs;
    this.releaseMs = releaseMs;
  }
  process(x: number, dtMs: number): number {
    const tau = x > this.y ? this.attackMs : this.releaseMs;
    this.y += (x - this.y) * (1 - Math.exp(-dtMs / tau));
    return this.y;
  }
}

/**
 * Two-sided running-range normalizer: maps a value onto 0..1 against the range
 * it has actually occupied recently, both ends decaying back toward the
 * current value so the window follows the material.
 *
 * `AutoGain` below normalizes against a running MAX, which is right for
 * energy-like features that genuinely reach zero (level, the bands, flux).
 * The spectral centroid does not: it lives in a narrow band whose position
 * depends on the track's timbre, so max-only normalization leaves a bass-heavy
 * piece pinned near the bottom of the scale. Measured across the four shipped
 * demos, `bright` spans p10..p90 of 0.318-0.545 on one and 0.060-0.109 on
 * another — the second occupies 5% of the scale, so anything mapping it
 * linearly (the stage's hue route) barely moves. This class is what lets a
 * dark track sweep the same hue arc as a bright one.
 *
 * `MIN_SPAN` is the guard that stops a nearly-constant input from being
 * stretched into full-swing noise: below it, the output stays near the middle
 * rather than amplifying jitter.
 */
export class RangeGain {
  private lo = Number.NaN;
  private hi = Number.NaN;
  /** Narrowest range that will be stretched to the full 0..1 output.
   *  Deliberately well below a real instrument's band: the solo-piano demo
   *  occupies p10..p90 of only 0.049, so a guard set anywhere near that would
   *  flatten exactly the case this class exists to fix. 0.02 sits above frame
   *  to frame centroid jitter and below any musical variation. */
  static readonly MIN_SPAN = 0.02;
  constructor(private halfLifeSec: number) {}
  process(x: number, dtMs: number): number {
    if (Number.isNaN(this.lo)) { this.lo = x; this.hi = x; }
    // Each bound relaxes toward the current value, and jumps instantly to a
    // new extreme — the same asymmetry AutoGain uses, mirrored.
    const k = 1 - Math.pow(0.5, dtMs / 1000 / this.halfLifeSec);
    this.lo += (x - this.lo) * k;
    this.hi += (x - this.hi) * k;
    if (x < this.lo) this.lo = x;
    if (x > this.hi) this.hi = x;
    const span = this.hi - this.lo;
    if (span < RangeGain.MIN_SPAN) return 0.5;
    return Math.min(1, Math.max(0, (x - this.lo) / span));
  }
}

/** Running-max normalizer with exponential decay (half-life in seconds), so a
 *  quiet voice memo modulates as fully as a mastered track. `observe`/`norm`
 *  are split so the caller can combine per-value maxima with a shared floor
 *  (see FeaturePipeline's band normalization). */
export class AutoGain {
  private max = 1e-4;
  constructor(private halfLifeSec: number) {}
  /** Decay the running max and fold in a new observation. */
  observe(x: number, dtMs: number): void {
    this.max *= Math.pow(0.5, dtMs / 1000 / this.halfLifeSec);
    if (x > this.max) this.max = x;
    if (this.max < 1e-4) this.max = 1e-4;
  }
  /** Normalize a value against the current running max, capped at 1. An
   *  optional floor raises the denominator (used for per-band gains). */
  norm(x: number, floor = 0): number {
    return Math.min(1, x / Math.max(this.max, floor));
  }
  /** Current running max — lets callers derive a shared floor across gains. */
  get peak(): number {
    return this.max;
  }
  process(x: number, dtMs: number): number {
    this.observe(x, dtMs);
    return this.norm(x);
  }
}
