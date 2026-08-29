# flowshape Part 4 — Audio Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A live audio-reactive animation mode: the user's pattern moves with an uploaded audio file or the mic, on a 16:9 / 9:16 / 1:1 canvas stage, with MediaRecorder movie capture.

**Architecture:** Pure DSP layer (own FFT, node-testable) → feature frames through auto-gain + envelope followers → a generic mapping layer that modulates existing `ParamDef` ranges → per-frame `generateSafe` → an `SvgNode`→canvas2d interpreter. Discrete patterns animate via beat-quantized events (reseed/flip/step); only `heavy` patterns use the worker with a beat-ahead double buffer. Spec: `docs/superpowers/specs/2026-08-29-flowshape-part4-audio-visualizer-design.md`.

**Tech Stack:** Vanilla TS + Vite + vitest (node env — no DOM/WebAudio in unit tests; browser glue is typechecked + manually verified). No new dependencies.

**Preconditions:** Part 3 merged to `main`. Work happens on a fresh worktree branch `feat/part4-audio-visualizer` off `main`. Codebase facts this plan relies on: `strict` + `noUncheckedIndexedAccess` are on (index with `!`); patterns are pure `generate(params, seed, size) → SvgNode`; `generateSafe` clamps params, injects the paper rect and `size` scale group; roles `ink|paper|accent` resolve via `Palette`; render size uses 600 user units on the short edge.

**Spec deviations (deliberate, agreed rationale):**
- Event kind `regen` from spec §4 is dropped: patterns are pure, so re-running with identical inputs is a no-op. `reseed`/`flip`/`step` remain.
- `phase` adoption in Phase A is harmonograph, phyllotaxis, helix only (all 2π-periodic, so the 1→0 wrap is seamless). Moiré is deferred: its `offset`/angle drift is not wrap-safe in circles mode.
- The `mode=animate` URL key is realized as the codebase-idiomatic path prefix `#/a/<pattern>?…` (the router is path-based), so nothing reads `?mode=`; `mode` is deliberately left unreserved because `delaunay`, `fabric`, and `moire` already ship a `mode` param and reserving it would break every shared link that uses it.

---

## File map

| File | Responsibility |
|---|---|
| Create `src/audio/dsp.ts` | Pure DSP: FFT, Hann, RMS, band energy, centroid, flux, `EnvelopeFollower`, `AutoGain` |
| Create `src/audio/features.ts` | `FeatureKey`/`FeatureFrame`, `FeaturePipeline` (raw → AGC → envelope) |
| Create `src/audio/onsets.ts` | Offline onset detection, tempo estimate, beat grid; `LiveOnsetDetector` for mic |
| Create `src/audio/sources.ts` | Browser glue: `AudioRig` for file + mic (AudioContext graph, transport) |
| Create `src/anim/mapping.ts` | `ModRoute`, `applyRoutes` over `ParamDef` ranges |
| Create `src/anim/presets.ts` | `AnimPreset`/`EventSpec` types + curated preset table for all 25 patterns (incl. the four isometric newcomers: tumbling, nested, interlace, isoweave — all discrete/tiling family, so beat-event presets, `reseed` where `usesSeed`, else `step` on the most structural int param) |
| Create `src/anim/canvas-render.ts` | `drawTree(ctx, node, palette)` — SvgNode→canvas2d, throws on unknown vocabulary |
| Create `src/anim/engine.ts` | Pure frame logic: `BeatClock`, `phaseAt`, `eventState`, `frameParams` |
| Create `src/anim/recorder.ts` | `pickMimeType`, `StageRecorder` (MediaRecorder) |
| Create `src/anim/worker-client.ts` | Promise wrapper over the existing compute worker protocol |
| Create `src/ui/animate.ts` | The stage view: DOM, transport, rAF loop, fps governor, heavy double-buffer |
| Create `src/ui/fidelity.ts` | DEV-only SVG-vs-canvas side-by-side route |
| Modify `src/patterns/registry.ts` | `anim` metadata on `PatternDef`, `hidden` on `ParamDef`, `PHASE_PARAM` injection, validation |
| Modify `src/core/reserved.ts` | Add `stage`, `apre`, `aint`, `phase` |
| Modify `src/core/url-state.ts` | `view`/`stage`/`apre`/`aint` on `AppState`, `#/a/` encode/decode |
| Modify `src/patterns/harmonograph.ts`, `phyllotaxis.ts`, `helix.ts` | consume `phase` (identical output at `phase = 0`) |
| Modify `src/main.ts` | Route `#/a/` → animate view; DEV route `#/dev/fidelity` |
| Modify `src/ui/playground.ts` | Skip `hidden` params in controls; ANIMATE button |
| Modify `src/style.css` | Stage + animate-panel styles |
| Tests | `tests/audio/*.test.ts`, `tests/anim/*.test.ts`, additions to `tests/core/url-state.test.ts` |

---

### Task 1: DSP spectral core

**Files:**
- Create: `src/audio/dsp.ts`
- Test: `tests/audio/dsp.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/audio/dsp.test.ts
import { describe, it, expect } from 'vitest';
import { fftMag, hannWindow, rms, bandEnergy, spectralCentroid, spectralFlux } from '../../src/audio/dsp';

const SR = 44100;

function sine(freq: number, n = 2048, amp = 1): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  return out;
}

describe('fftMag', () => {
  it('concentrates a sine into its frequency bin', () => {
    const mag = fftMag(hannWindow(sine(1000)));
    expect(mag.length).toBe(1024);
    const binHz = SR / 2048;
    const peak = mag.indexOf(Math.max(...mag));
    expect(Math.abs(peak * binHz - 1000)).toBeLessThan(2 * binHz);
  });
  it('returns near-zero for silence', () => {
    const mag = fftMag(new Float32Array(2048));
    expect(Math.max(...mag)).toBeLessThan(1e-6);
  });
});

describe('rms', () => {
  it('is 1 for a unit square wave and 0 for silence', () => {
    const sq = new Float32Array(1024).fill(1);
    for (let i = 0; i < 512; i++) sq[i] = -1;
    expect(rms(sq)).toBeCloseTo(1, 5);
    expect(rms(new Float32Array(1024))).toBe(0);
  });
});

describe('bandEnergy', () => {
  it('a 100 Hz sine lives in the bass band only', () => {
    const mag = fftMag(hannWindow(sine(100)));
    const bass = bandEnergy(mag, SR, 20, 250);
    const mid = bandEnergy(mag, SR, 250, 2000);
    const high = bandEnergy(mag, SR, 2000, 8000);
    expect(bass).toBeGreaterThan(mid * 5);
    expect(bass).toBeGreaterThan(high * 5);
  });
});

describe('spectralCentroid', () => {
  it('is higher for a high sine than a low one, and 0 for silence', () => {
    const lo = spectralCentroid(fftMag(hannWindow(sine(200))), SR);
    const hi = spectralCentroid(fftMag(hannWindow(sine(4000))), SR);
    expect(hi).toBeGreaterThan(lo * 3);
    expect(spectralCentroid(fftMag(new Float32Array(2048)), SR)).toBe(0);
  });
});

describe('spectralFlux', () => {
  it('is 0 with no previous frame and for identical frames, positive on change', () => {
    const a = fftMag(hannWindow(sine(200)));
    const b = fftMag(hannWindow(sine(4000)));
    expect(spectralFlux(a, null)).toBe(0);
    expect(spectralFlux(a, a)).toBe(0);
    expect(spectralFlux(b, a)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/dsp.test.ts`
Expected: FAIL — cannot resolve `../../src/audio/dsp`

- [ ] **Step 3: Implement `src/audio/dsp.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/dsp.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/audio/dsp.ts tests/audio/dsp.test.ts
git commit -m "feat(anim): pure DSP core — FFT, bands, centroid, flux"
```

---

### Task 2: Envelope follower and auto-gain

**Files:**
- Modify: `src/audio/dsp.ts` (append)
- Test: `tests/audio/dsp.test.ts` (append)

- [ ] **Step 1: Append the failing tests**

```ts
// append to tests/audio/dsp.test.ts
import { EnvelopeFollower, AutoGain } from '../../src/audio/dsp';

describe('EnvelopeFollower', () => {
  it('reaches ~63% of a step after one attack constant, decays after release', () => {
    const env = new EnvelopeFollower(50, 400);
    let y = 0;
    for (let t = 0; t < 50; t += 10) y = env.process(1, 10);
    expect(y).toBeGreaterThan(0.55);
    expect(y).toBeLessThan(0.75);
    for (let t = 0; t < 400; t += 10) y = env.process(0, 10);
    expect(y).toBeLessThan(0.45);
    expect(y).toBeGreaterThan(0.15);
  });
});

describe('AutoGain', () => {
  it('normalizes a steady input toward 1 and re-opens after the peak decays', () => {
    const agc = new AutoGain(5);
    let y = 0;
    for (let i = 0; i < 20; i++) y = agc.process(0.2, 16);
    expect(y).toBeCloseTo(1, 2);
    y = agc.process(0.1, 16);
    expect(y).toBeCloseTo(0.5, 1);
    for (let i = 0; i < 700; i++) y = agc.process(0.1, 16); // ~11 s: max halves ~2×
    expect(y).toBeGreaterThan(0.9);
  });
  it('never exceeds 1 and survives silence', () => {
    const agc = new AutoGain(5);
    expect(agc.process(3, 16)).toBeLessThanOrEqual(1);
    expect(agc.process(0, 16)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/audio/dsp.test.ts`
Expected: FAIL — `EnvelopeFollower` not exported

- [ ] **Step 3: Append implementation to `src/audio/dsp.ts`**

```ts
/** One-pole attack/release smoother. Fast up, slow down — the compressor-style
 *  shaping that makes audio-driven motion feel musical instead of jittery. */
export class EnvelopeFollower {
  private y = 0;
  constructor(private attackMs: number, private releaseMs: number) {}
  process(x: number, dtMs: number): number {
    const tau = x > this.y ? this.attackMs : this.releaseMs;
    this.y += (x - this.y) * (1 - Math.exp(-dtMs / tau));
    return this.y;
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/audio/dsp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/audio/dsp.ts tests/audio/dsp.test.ts
git commit -m "feat(anim): envelope follower and auto-gain"
```

---

### Task 3: Feature pipeline

**Files:**
- Create: `src/audio/features.ts`
- Test: `tests/audio/features.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/audio/features.test.ts
import { describe, it, expect } from 'vitest';
import { FeaturePipeline, FEATURE_KEYS, ZERO_FRAME } from '../../src/audio/features';

const SR = 44100;

function sineWindow(freq: number, amp = 0.8): Float32Array {
  const out = new Float32Array(2048);
  for (let i = 0; i < 2048; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  return out;
}

describe('FeaturePipeline', () => {
  it('a bass burst raises bass, then release decays it in silence', () => {
    const p = new FeaturePipeline(SR);
    let f = ZERO_FRAME;
    for (let i = 0; i < 30; i++) f = p.process(sineWindow(100), 16);
    const peak = f.bass;
    expect(peak).toBeGreaterThan(0.5);
    expect(f.mid).toBeLessThan(peak / 2);
    for (let i = 0; i < 10; i++) f = p.process(new Float32Array(2048), 16);
    expect(f.bass).toBeLessThan(peak);
    expect(f.bass).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) f = p.process(new Float32Array(2048), 16);
    expect(f.bass).toBeLessThan(0.05);
  });
  it('every feature stays within [0, 1]', () => {
    const p = new FeaturePipeline(SR);
    for (let i = 0; i < 50; i++) {
      const f = p.process(sineWindow(3000, 2.5), 16);
      for (const k of FEATURE_KEYS) {
        expect(f[k]).toBeGreaterThanOrEqual(0);
        expect(f[k]).toBeLessThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/audio/features.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/audio/features.ts`**

```ts
import {
  fftMag, hannWindow, rms, bandEnergy, spectralCentroid, spectralFlux,
  EnvelopeFollower, AutoGain,
} from './dsp';

export const FEATURE_KEYS = ['bass', 'mid', 'high', 'level', 'bright', 'flux'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type FeatureFrame = Record<FeatureKey, number>;

export const ZERO_FRAME: FeatureFrame = { bass: 0, mid: 0, high: 0, level: 0, bright: 0, flux: 0 };

/** Time-domain window (2048 samples) → smoothed feature frame in [0,1] each.
 *  Band normalization is per-band with a shared floor — spike-verified both
 *  ways: ONE shared gain starves mid/high in real music (bass dominates, so
 *  mid/high idle at 0.1–0.3 and their routes barely move), while naive
 *  per-band gains blow leakage in an empty band up to 1. Each band therefore
 *  normalizes against its OWN running max, floored at 10% of the global max.
 *  `level` and `flux` get their own gains; `bright` (centroid) is already
 *  scale-invariant and skips AGC entirely. */
export class FeaturePipeline {
  /** AGC-normalized flux from the latest process(), BEFORE the envelope.
   *  Onset detection must consume this, not the enveloped feature — verified
   *  in the audio spike: the envelope smears transients and the detector's
   *  adaptive baseline then locks above every spike (detection stalls). */
  rawFlux = 0;
  private prevMag: Float32Array | null = null;
  private bassAgc = new AutoGain(5);
  private midAgc = new AutoGain(5);
  private highAgc = new AutoGain(5);
  private levelAgc = new AutoGain(5);
  private fluxAgc = new AutoGain(5);
  private env: Record<FeatureKey, EnvelopeFollower>;

  constructor(private sampleRate: number) {
    this.env = {} as Record<FeatureKey, EnvelopeFollower>;
    for (const k of FEATURE_KEYS) this.env[k] = new EnvelopeFollower(50, 400);
  }

  process(timeDomain: Float32Array, dtMs: number): FeatureFrame {
    const mag = fftMag(hannWindow(timeDomain));
    const raw: FeatureFrame = {
      bass: bandEnergy(mag, this.sampleRate, 20, 250),
      mid: bandEnergy(mag, this.sampleRate, 250, 2000),
      high: bandEnergy(mag, this.sampleRate, 2000, 8000),
      level: rms(timeDomain),
      bright: spectralCentroid(mag, this.sampleRate),
      flux: spectralFlux(mag, this.prevMag),
    };
    this.prevMag = mag;
    this.bassAgc.observe(raw.bass, dtMs);
    this.midAgc.observe(raw.mid, dtMs);
    this.highAgc.observe(raw.high, dtMs);
    const floor = 0.1 * Math.max(this.bassAgc.peak, this.midAgc.peak, this.highAgc.peak);
    const gained: FeatureFrame = {
      bass: this.bassAgc.norm(raw.bass, floor),
      mid: this.midAgc.norm(raw.mid, floor),
      high: this.highAgc.norm(raw.high, floor),
      level: this.levelAgc.process(raw.level, dtMs),
      bright: raw.bright,
      flux: this.fluxAgc.process(raw.flux, dtMs),
    };
    this.rawFlux = gained.flux;
    const out = { ...ZERO_FRAME };
    for (const k of FEATURE_KEYS) out[k] = this.env[k].process(gained[k], dtMs);
    return out;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/audio/features.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/audio/features.ts tests/audio/features.test.ts
git commit -m "feat(anim): feature pipeline — six smoothed features per frame"
```

---

### Task 4: Onsets, tempo, beat grid, live onset detector

**Files:**
- Create: `src/audio/onsets.ts`
- Test: `tests/audio/onsets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/audio/onsets.test.ts
import { describe, it, expect } from 'vitest';
import { detectOnsets, estimateTempo, beatGrid, LiveOnsetDetector } from '../../src/audio/onsets';

const SR = 44100;

/** 10 s click train at 120 BPM: a short decaying burst every 0.5 s. */
function clickTrain(): Float32Array {
  const out = new Float32Array(SR * 10);
  for (let t = 0; t < 10; t += 0.5) {
    const start = Math.round(t * SR);
    for (let i = 0; i < 200; i++) {
      out[start + i] = Math.sin(i * 0.9) * Math.exp(-i / 40);
    }
  }
  return out;
}

describe('detectOnsets', () => {
  it('finds every click of a 120 BPM train within 20 ms', () => {
    const { onsets } = detectOnsets(clickTrain(), SR);
    expect(onsets.length).toBeGreaterThanOrEqual(18);
    expect(onsets.length).toBeLessThanOrEqual(22);
    for (const t of onsets) {
      const nearest = Math.round(t / 0.5) * 0.5;
      expect(Math.abs(t - nearest)).toBeLessThan(0.02);
    }
  });
  it('finds nothing in silence', () => {
    expect(detectOnsets(new Float32Array(SR * 2), SR).onsets.length).toBe(0);
  });
});

describe('estimateTempo', () => {
  it('recovers ~120 BPM from the click train flux', () => {
    const { flux, hopSec } = detectOnsets(clickTrain(), SR);
    const bpm = estimateTempo(flux, hopSec);
    expect(bpm).not.toBeNull();
    expect(Math.abs(bpm! - 120)).toBeLessThan(3);
  });
});

describe('beatGrid', () => {
  it('lays a regular grid near the detected onsets', () => {
    const { onsets, flux, hopSec } = detectOnsets(clickTrain(), SR);
    const bpm = estimateTempo(flux, hopSec)!;
    const grid = beatGrid(onsets, bpm, 10);
    expect(grid.length).toBeGreaterThanOrEqual(18);
    for (const t of grid.slice(0, 18)) {
      const nearest = Math.round(t / 0.5) * 0.5;
      expect(Math.abs(t - nearest)).toBeLessThan(0.05);
    }
  });
  it('falls back to raw onsets without a tempo', () => {
    expect(beatGrid([1, 2], null, 10)).toEqual([1, 2]);
  });
});

describe('LiveOnsetDetector', () => {
  it('fires once per spike with a refractory period', () => {
    const det = new LiveOnsetDetector();
    let fires = 0;
    for (let i = 0; i < 200; i++) {
      const spike = i % 30 === 0 ? 0.8 : 0.02;
      if (det.process(spike, 16)) fires++;
    }
    expect(fires).toBeGreaterThanOrEqual(5);
    expect(fires).toBeLessThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/audio/onsets.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/audio/onsets.ts`**

```ts
import { fftMag, hannWindow } from './dsp';

export interface OnsetAnalysis { onsets: number[]; flux: Float32Array; hopSec: number }

/** Offline onset detection over a full decoded channel: spectral flux at
 *  hop 512 / window 1024, adaptive median threshold, 80 ms peak separation. */
export function detectOnsets(samples: Float32Array, sampleRate: number): OnsetAnalysis {
  const win = 1024, hop = 512;
  const frames = Math.max(0, Math.floor((samples.length - win) / hop));
  const flux = new Float32Array(frames);
  let prev: Float32Array | null = null;
  const buf = new Float32Array(win);
  for (let fi = 0; fi < frames; fi++) {
    for (let i = 0; i < win; i++) buf[i] = samples[fi * hop + i]!;
    const mag = fftMag(hannWindow(buf));
    if (prev) {
      let s = 0;
      for (let i = 0; i < mag.length; i++) {
        const d = mag[i]! - prev[i]!;
        if (d > 0) s += d;
      }
      flux[fi] = s;
    }
    prev = mag;
  }
  const hopSec = hop / sampleRate;
  const onsets: number[] = [];
  let lastPeak = -Infinity;
  for (let i = 0; i < frames; i++) {
    const lo = Math.max(0, i - 10), hi = Math.min(frames, i + 11);
    const local = Array.from(flux.subarray(lo, hi)).sort((a, b) => a - b);
    const med = local[Math.floor(local.length / 2)]!;
    const isPeak =
      flux[i]! > med * 1.5 + 1e-6 &&
      flux[i]! >= (i > 0 ? flux[i - 1]! : 0) &&
      flux[i]! >= (i + 1 < frames ? flux[i + 1]! : 0);
    if (isPeak && (i - lastPeak) * hopSec >= 0.08) {
      onsets.push(i * hopSec);
      lastPeak = i;
    }
  }
  return { onsets, flux, hopSec };
}

/** Tempo in BPM (60–200) via autocorrelation of the flux envelope; null when
 *  there is nothing periodic to lock onto. */
export function estimateTempo(flux: Float32Array, hopSec: number): number | null {
  const minLag = Math.max(1, Math.round(60 / 200 / hopSec));
  const maxLag = Math.min(flux.length - 1, Math.round(60 / 60 / hopSec));
  if (maxLag <= minLag) return null;
  let best = 0, bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = lag; i < flux.length; i++) s += flux[i]! * flux[i - lag]!;
    if (s > best) { best = s; bestLag = lag; }
  }
  if (bestLag === 0 || best < 1e-9) return null;
  return 60 / (bestLag * hopSec);
}

/** Regular beat grid phase-aligned to the onsets; raw onsets when tempo is unknown. */
export function beatGrid(onsets: number[], bpm: number | null, durationSec: number): number[] {
  if (bpm === null || onsets.length < 4) return onsets;
  const period = 60 / bpm;
  const BINS = 16;
  const hist = new Array<number>(BINS).fill(0);
  for (const t of onsets) hist[Math.floor(((t % period) / period) * BINS) % BINS]!++;
  let bestBin = 0;
  for (let b = 1; b < BINS; b++) if (hist[b]! > hist[bestBin]!) bestBin = b;
  const phase = ((bestBin + 0.5) / BINS) * period;
  const grid: number[] = [];
  for (let t = phase; t < durationSec; t += period) grid.push(t);
  return grid;
}

/** Realtime onset detection for mic mode: adaptive threshold over an EMA of
 *  flux, with a refractory period so one hit fires once.
 *  MUST be fed UN-enveloped flux (FeaturePipeline.rawFlux) — spike-verified:
 *  enveloped flux stalls detection. The slow EMA (2%/frame) keeps single
 *  spikes from inflating their own baseline. */
export class LiveOnsetDetector {
  private avg = 0;
  private sinceMs = 1e9;
  constructor(private multiplier = 2.2, private refractoryMs = 180) {}
  process(rawFlux: number, dtMs: number): boolean {
    this.sinceMs += dtMs;
    const fire = this.sinceMs >= this.refractoryMs && rawFlux > Math.max(0.05, this.avg * this.multiplier);
    this.avg = this.avg * 0.98 + rawFlux * 0.02;
    if (fire) this.sinceMs = 0;
    return fire;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/audio/onsets.test.ts`
Expected: PASS. If the click-count assertion is off by one or two, adjust the burst length in the fixture (not the detector) — the detector's thresholds are the deliverable.

- [ ] **Step 5: Commit**

```bash
git add src/audio/onsets.ts tests/audio/onsets.test.ts
git commit -m "feat(anim): offline onsets/tempo/beat grid and live onset detector"
```

---

### Task 5: Registry — `anim` metadata, `phase` param, `hidden` flag, reserved keys

**Files:**
- Modify: `src/patterns/registry.ts`
- Modify: `src/core/reserved.ts`
- Modify: `src/ui/playground.ts` (skip hidden params in controls)
- Test: `tests/anim/registry-anim.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/anim/registry-anim.test.ts
import { describe, it, expect } from 'vitest';
import { definePattern, defaultParams, generateSafe, PHASE_PARAM } from '../../src/patterns/registry';
import { RESERVED } from '../../src/core/reserved';
import { el } from '../../src/core/svg';

function probe(id: string, anim?: { continuous?: string[]; usesPhase?: boolean }) {
  return definePattern({
    id, family: 'curves', phase: 1, heavy: false, anim,
    params: [{ key: 'amp', kind: 'float', min: 0, max: 10, step: 0.1, default: 5, label: 'x.amp' }],
    generate(p) {
      return el('svg', { viewBox: '0 0 10 10' }, [el('circle', { cx: p['phase'] ?? -1, cy: 0, r: 1, fill: 'ink' })]);
    },
  });
}

describe('anim registry metadata', () => {
  it('reserves the animate keys', () => {
    for (const k of ['stage', 'apre', 'aint', 'phase']) expect(RESERVED.has(k)).toBe(true);
  });
  it('injects PHASE_PARAM only for usesPhase patterns, hidden and defaulting to 0', () => {
    const withPhase = probe('t-phase', { usesPhase: true });
    const without = probe('t-nophase');
    expect(withPhase.params.some((p) => p.key === 'phase' && p.hidden === true)).toBe(true);
    expect(without.params.some((p) => p.key === 'phase')).toBe(false);
    expect(defaultParams(withPhase)['phase']).toBe(0);
    expect(PHASE_PARAM.default).toBe(0);
  });
  it('delivers a clamped phase through generateSafe', () => {
    const def = probe('t-phase2', { usesPhase: true });
    const svg = generateSafe(def, { phase: 0.25 }, 1, { w: 10, h: 10 });
    const circle = svg.children[1]!;
    expect(circle.attrs['cx']).toBe(0.25);
  });
  it('rejects anim.continuous keys that are not numeric params', () => {
    expect(() => probe('t-bad', { continuous: ['nope'] })).toThrow(/continuous/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/registry-anim.test.ts`
Expected: FAIL — `PHASE_PARAM` not exported / `anim` not a known property

- [ ] **Step 3: Implement**

In `src/core/reserved.ts`, extend the set (append inside the existing literal):

```ts
  'cw', 'ch', 'cu',
  // 'mode' is deliberately NOT reserved — delaunay, fabric and moire already
  // ship a 'mode' param, and the animate route is path-based (#/a/<pattern>),
  // so nothing reads ?mode=.
  'stage', 'apre', 'aint', 'phase',
```

In `src/patterns/registry.ts`:

Add to `ParamDef`:

```ts
  /** Not shown in the playground controls (engine-owned params like `phase`). */
  hidden?: boolean;
```

Add to `PatternDef` (after `usesSeed`):

```ts
  /** Animation metadata (Part 4). `continuous` lists param keys whose visual
   *  effect varies continuously — safe for per-frame audio modulation.
   *  `usesPhase` opts into the injected `phase` param for intrinsic motion. */
  anim?: { continuous?: string[]; usesPhase?: boolean };
```

Add next to `SIZE_PARAM`:

```ts
/** Injected for `anim.usesPhase` patterns: engine-owned time axis in [0,1). */
export const PHASE_PARAM: ParamDef = {
  key: 'phase', kind: 'float', min: 0, max: 1, step: 0.0001, default: 0, label: 'common.phase', hidden: true,
};
```

In `definePattern`, after the existing reserved-key loop, add validation and injection (replace the `withSize` construction):

```ts
  if (def.anim?.continuous) {
    for (const key of def.anim.continuous) {
      const pd = def.params.find((p) => p.key === key) ?? (key === SIZE_PARAM.key ? SIZE_PARAM : undefined);
      if (!pd || (pd.kind !== 'float' && pd.kind !== 'int')) {
        throw new Error(`anim.continuous key '${key}' is not a numeric param (pattern ${def.id})`);
      }
    }
  }
  const extra: ParamDef[] = [{ ...SIZE_PARAM }];
  if (def.anim?.usesPhase) extra.push({ ...PHASE_PARAM });
  const withSize: PatternDef = { ...def, params: [...def.params, ...extra] };
```

In `src/ui/playground.ts`, find the loop that builds param controls (it iterates `def.params` calling `sliderRow`/`checkboxRow`/`selectRow`) and skip hidden defs — add as the first line inside that loop:

```ts
      if (p.hidden) continue;
```

(The loop variable may be named differently — match the local name in place.)

- [ ] **Step 4: Run tests — new and full suite (registry is load-bearing)**

Run: `npx vitest run`
Expected: ALL PASS — pattern snapshots must be untouched (no existing pattern sets `anim` yet).

- [ ] **Step 5: Commit**

```bash
git add src/patterns/registry.ts src/core/reserved.ts src/ui/playground.ts tests/anim/registry-anim.test.ts
git commit -m "feat(anim): anim metadata, injected phase param, hidden flag, reserved keys"
```

---

### Task 6: `phase` adoption — harmonograph, phyllotaxis, helix

**Files:**
- Modify: `src/patterns/harmonograph.ts`, `src/patterns/phyllotaxis.ts`, `src/patterns/helix.ts`
- Test: `tests/anim/phase-adoption.test.ts`

The invariant: **at `phase = 0` the output is byte-identical to today** — every existing snapshot stays green. All three motions are 2π-periodic so the 1→0 wrap is seamless.

- [ ] **Step 1: Write the failing test**

```ts
// tests/anim/phase-adoption.test.ts
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams, generateSafe } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };
const ADOPTERS = ['harmonograph', 'phyllotaxis', 'helix'];

describe.each(ADOPTERS)('%s phase', (id) => {
  it('declares usesPhase', () => {
    expect(getPattern(id)!.anim?.usesPhase).toBe(true);
  });
  it('phase=0 matches the no-phase render exactly', () => {
    const def = getPattern(id)!;
    const a = serialize(generateSafe(def, defaultParams(def), 7, SIZE), PAL);
    const b = serialize(generateSafe(def, { ...defaultParams(def), phase: 0 }, 7, SIZE), PAL);
    expect(b).toBe(a);
  });
  it('phase=0.3 changes the geometry', () => {
    const def = getPattern(id)!;
    const a = serialize(generateSafe(def, defaultParams(def), 7, SIZE), PAL);
    const b = serialize(generateSafe(def, { ...defaultParams(def), phase: 0.3 }, 7, SIZE), PAL);
    expect(b).not.toBe(a);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/phase-adoption.test.ts`
Expected: FAIL — `usesPhase` undefined

- [ ] **Step 3: Implement the three edits**

`src/patterns/harmonograph.ts` — add to the `definePattern` object (after `usesSeed: true`):

```ts
  anim: { continuous: ['detune', 'damping', 'strokeWidth', 'opacity'], usesPhase: true },
```

and in `generate`, right after the `ph` array is built:

```ts
    const off = (p['phase'] ?? 0) * 2 * Math.PI;
```

then use the offset on the two primary oscillators — in the `x` expression replace `ph[0]` with `ph[0] + off`, and in the `y` expression replace `ph[2]` with `ph[2] + off` (the figure precesses; at `off = 0` nothing changes).

`src/patterns/phyllotaxis.ts` — add:

```ts
  anim: { continuous: ['radialExp', 'dotMin', 'dotGrow'], usesPhase: true },
```

and in `generate` replace `const a = n * angleRad;` with:

```ts
      const a = n * angleRad + (p['phase'] ?? 0) * 2 * Math.PI;
```

(global rotation of the spiral).

`src/patterns/helix.ts` — add:

```ts
  anim: { continuous: ['turns', 'radiusFraction', 'depthFade', 'strokeWidth'], usesPhase: true },
```

and in `generate` add after the param reads:

```ts
    const spin = (p['phase'] ?? 0) * 2 * Math.PI;
```

then rotate every strand/rung phase: the rung loop's `sample(0, k)` / `sample(Math.PI, k)` become `sample(spin, k)` / `sample(Math.PI + spin, k)`, and the strand loop `for (const phase of [0, Math.PI])` becomes `for (const phase of [spin, Math.PI + spin])`.

- [ ] **Step 4: Run the new test AND the full pattern suite**

Run: `npx vitest run tests/anim/phase-adoption.test.ts tests/patterns`
Expected: ALL PASS — snapshots unchanged proves the `phase = 0` identity.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/harmonograph.ts src/patterns/phyllotaxis.ts src/patterns/helix.ts tests/anim/phase-adoption.test.ts
git commit -m "feat(anim): harmonograph, phyllotaxis, helix consume phase"
```

---

### Task 7: Mapping layer

**Files:**
- Create: `src/anim/mapping.ts`
- Test: `tests/anim/mapping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/anim/mapping.test.ts
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams } from '../../src/patterns/registry';
import { applyRoutes } from '../../src/anim/mapping';
import { ZERO_FRAME } from '../../src/audio/features';

const def = getPattern('flowfield')!; // curl: float 0.5..3 default 1.9
const base = defaultParams(def);

describe('applyRoutes', () => {
  it('zero features / zero depth leave the base params intact', () => {
    const out = applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 1 }], ZERO_FRAME, 1);
    expect(out['curl']).toBe(base['curl']);
  });
  it('full feature at depth 1 clamps to max; negative depth clamps to min', () => {
    const loud = { ...ZERO_FRAME, bass: 1 };
    expect(applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 1 }], loud, 1)['curl']).toBe(3);
    expect(applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: -1 }], loud, 1)['curl']).toBe(0.5);
  });
  it('intensity scales depth; int params round', () => {
    const half = { ...ZERO_FRAME, bass: 0.5 };
    const out = applyRoutes(def, base, [{ feature: 'bass', param: 'curl', depth: 0.4 }], half, 0.5);
    // 1.9 + 0.4*0.5*0.5*(3-0.5) = 2.15
    expect(out['curl']).toBeCloseTo(2.15, 5);
    const spaced = applyRoutes(def, base, [{ feature: 'bass', param: 'spacing', depth: 0.33 }], half, 1);
    expect(Number.isInteger(spaced['spacing'])).toBe(true);
  });
  it('is deterministic and ignores unknown params', () => {
    const f = { ...ZERO_FRAME, mid: 0.7 };
    const r = [{ feature: 'mid' as const, param: 'curl', depth: 0.5 }, { feature: 'mid' as const, param: 'ghost', depth: 1 }];
    expect(applyRoutes(def, base, r, f, 1)).toEqual(applyRoutes(def, base, r, f, 1));
    expect('ghost' in applyRoutes(def, base, r, f, 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/mapping.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/anim/mapping.ts`**

```ts
import { clampParams, defaultParams, type PatternDef, type Params } from '../patterns/registry';
import type { FeatureFrame, FeatureKey } from '../audio/features';

/** One modulation route: `param += depth · intensity · feature · (max − min)`,
 *  clamped back into the param's declared range. */
export interface ModRoute { feature: FeatureKey; param: string; depth: number }

export function applyRoutes(
  def: PatternDef,
  base: Params,
  routes: ModRoute[],
  f: FeatureFrame,
  intensity: number,
): Params {
  const out: Params = { ...base };
  for (const r of routes) {
    const pd = def.params.find((p) => p.key === r.param);
    if (!pd) continue; // presets are validated at build time; stay defensive at runtime
    const cur = out[r.param] ?? pd.default;
    out[r.param] = cur + r.depth * intensity * f[r.feature] * (pd.max - pd.min);
  }
  return clampParams(def, { ...defaultParams(def), ...out });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/anim/mapping.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/anim/mapping.ts tests/anim/mapping.test.ts
git commit -m "feat(anim): mapping layer over ParamDef ranges"
```

---

### Task 8: `anim` blocks on all patterns + curated presets

**Files:**
- Modify: every file in `src/patterns/` listed below (add an `anim` block after `usesSeed`/`heavy`)
- Create: `src/anim/presets.ts`
- Test: `tests/anim/presets.test.ts`

- [ ] **Step 1: Write the failing validation test**

```ts
// tests/anim/presets.test.ts
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns } from '../../src/patterns/registry';
import { PRESETS_BY_PATTERN } from '../../src/anim/presets';

describe('anim presets', () => {
  it('every registered pattern has at least one preset', () => {
    for (const def of listPatterns()) {
      expect(PRESETS_BY_PATTERN[def.id]?.length, def.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every preset references only real params with legal shapes', () => {
    for (const [pid, presets] of Object.entries(PRESETS_BY_PATTERN)) {
      const def = getPattern(pid);
      expect(def, pid).toBeDefined();
      for (const pre of presets) {
        expect(pre.label.en.length).toBeGreaterThan(0);
        expect(pre.label.es.length).toBeGreaterThan(0);
        for (const r of pre.routes) {
          const pd = def!.params.find((p) => p.key === r.param);
          expect(pd, `${pid}/${pre.id}: ${r.param}`).toBeDefined();
          expect(['float', 'int']).toContain(pd!.kind);
          expect(Math.abs(r.depth)).toBeLessThanOrEqual(1);
        }
        if (def!.heavy) expect(pre.routes.length, `${pid} is heavy`).toBe(0);
        const ev = pre.event;
        if (ev) {
          expect(ev.everyBeats).toBeGreaterThanOrEqual(1);
          if (ev.kind === 'flip') expect(def!.params.find((p) => p.key === ev.param)?.kind).toBe('bool');
          if (ev.kind === 'step') {
            const pd = def!.params.find((p) => p.key === ev.param);
            expect(pd, `${pid}/${pre.id}: step ${ev.param}`).toBeDefined();
            expect(['int', 'float', 'enum']).toContain(pd!.kind);
          }
          if (ev.kind === 'reseed') expect(def!.usesSeed, `${pid}: reseed needs usesSeed`).toBe(true);
        }
      }
    }
  });
  it('heavy patterns always carry an event (their only animation channel)', () => {
    for (const def of listPatterns().filter((d) => d.heavy)) {
      for (const pre of PRESETS_BY_PATTERN[def.id]!) expect(pre.event, def.id).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/presets.test.ts`
Expected: FAIL — cannot resolve `../../src/anim/presets`

- [ ] **Step 3a: Add `anim` blocks to the pattern files**

Add the line after each pattern's `heavy:`/`usesSeed:` line. (`size` is a legal continuous key — it is injected for every pattern.)

| File | `anim` block to add |
|---|---|
| `chirp.ts` | `anim: { continuous: ['amplitude', 'freqEnd', 'phaseStep', 'strokeWidth', 'size'] },` |
| `timestable.ts` | `anim: { continuous: ['multiplier', 'opacity', 'strokeWidth', 'size'] },` |
| `moire.ts` | `anim: { continuous: ['angleB', 'spacingB', 'offset', 'strokeWidth', 'size'] },` |
| `maurer.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `roselattice.ts` | `anim: { continuous: ['petalDepth', 'innerFraction', 'strokeWidth', 'size'] },` |
| `flowfield.ts` | `anim: { continuous: ['curl', 'strokeWidth', 'size'] },` |
| `fabric.ts` | `anim: { continuous: ['warpAmount', 'dotSize', 'noiseScale', 'size'] },` |
| `bands.ts` | `anim: { continuous: ['sweepAngle', 'growthExponent', 'gap', 'size'] },` |
| `coulomb.ts` | `anim: { continuous: ['coreRadius', 'strokeWidth', 'size'] },` |
| `hitomezashi.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `truchet.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `delaunay.ts` | `anim: { continuous: ['vertexSize', 'strokeWidth', 'size'] },` |
| `voronoi.ts` | `anim: { continuous: ['inset', 'strokeWidth', 'size'] },` |
| `stipple.ts` | `anim: { continuous: ['dotSize', 'contrast', 'size'] },` |
| `girih.ts` | `anim: { continuous: ['contactAngle', 'ribbonWidth', 'strokeWidth', 'size'] },` |
| `apollonian.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `voxel.ts` | `anim: { continuous: ['gap', 'faceShading', 'depthShading', 'size'] },` |
| `tumbling.ts` | `anim: { continuous: ['flipChance', 'coherence', 'voidChance', 'faceShading', 'size'] },` |
| `nested.ts` | `anim: { continuous: ['faceShading', 'strokeWidth', 'size'] },` |
| `interlace.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `isoweave.ts` | `anim: { continuous: ['strokeWidth', 'size'] },` |
| `diffgrowth.ts` | `anim: {},` |

(harmonograph, phyllotaxis, helix already got theirs in Task 6.)

- [ ] **Step 3b: Create `src/anim/presets.ts`**

```ts
import type { ModRoute } from './mapping';

export interface EventSpec {
  kind: 'reseed' | 'flip' | 'step';
  /** flip/step: the target param key. */
  param?: string;
  /** Beats between events (1 = every beat). */
  everyBeats: number;
  /** step: positions the param cycles through across its range. */
  steps?: number;
}

export interface AnimPreset {
  id: string;
  label: { en: string; es: string };
  routes: ModRoute[];
  event?: EventSpec;
}

/** Curated audio mappings, tuned by eye against music and voice. Convention:
 *  bass → macro structure, mid → shape character, high → fine detail,
 *  level → scale/presence, bright → timbre (the voice feature). */
export const PRESETS_BY_PATTERN: Record<string, AnimPreset[]> = {
  harmonograph: [
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'bass', param: 'opacity', depth: 0.5 },
      { feature: 'mid', param: 'detune', depth: 0.35 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'size', depth: 0.18 },
      { feature: 'bass', param: 'damping', depth: -0.3 },
      { feature: 'bright', param: 'detune', depth: 0.3 },
    ] },
  ],
  phyllotaxis: [
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'dotMin', depth: 0.55 },
      { feature: 'high', param: 'dotGrow', depth: 0.4 },
      { feature: 'level', param: 'size', depth: 0.1 },
    ] },
    { id: 'spiral', label: { en: 'Spiral', es: 'Espiral' }, routes: [
      { feature: 'level', param: 'radialExp', depth: 0.2 },
      { feature: 'bright', param: 'dotGrow', depth: 0.5 },
      { feature: 'bass', param: 'size', depth: 0.15 },
    ] },
  ],
  helix: [
    { id: 'spin', label: { en: 'Spin', es: 'Gira' }, routes: [
      { feature: 'bass', param: 'radiusFraction', depth: 0.3 },
      { feature: 'mid', param: 'turns', depth: 0.15 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'coil', label: { en: 'Coil', es: 'Serpentea' }, routes: [
      { feature: 'level', param: 'turns', depth: 0.3 },
      { feature: 'bright', param: 'depthFade', depth: 0.4 },
    ] },
  ],
  timestable: [
    { id: 'sweep', label: { en: 'Sweep', es: 'Barrido' }, routes: [
      { feature: 'mid', param: 'multiplier', depth: 0.22 },
      { feature: 'bass', param: 'opacity', depth: 0.4 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'morph', label: { en: 'Morph', es: 'Muta' }, routes: [
      { feature: 'bright', param: 'multiplier', depth: 0.45 },
      { feature: 'level', param: 'opacity', depth: 0.5 },
    ] },
  ],
  moire: [
    { id: 'drift', label: { en: 'Drift', es: 'Deriva' }, routes: [
      { feature: 'bass', param: 'angleB', depth: 0.12 },
      { feature: 'mid', param: 'spacingB', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.25 },
    ] },
    { id: 'shimmer', label: { en: 'Shimmer', es: 'Destella' }, routes: [
      { feature: 'bright', param: 'angleB', depth: 0.25 },
      { feature: 'bass', param: 'offset', depth: 0.35 },
    ] },
  ],
  maurer: [
    { id: 'star', label: { en: 'Star', es: 'Estrella' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.5 },
      { feature: 'level', param: 'size', depth: 0.12 },
    ], event: { kind: 'step', param: 'd', everyBeats: 1, steps: 12 } },
    { id: 'web', label: { en: 'Web', es: 'Telaraña' }, routes: [
      { feature: 'mid', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'step', param: 'n', everyBeats: 2, steps: 6 } },
  ],
  chirp: [
    { id: 'wave', label: { en: 'Wave', es: 'Onda' }, routes: [
      { feature: 'bass', param: 'amplitude', depth: 0.65 },
      { feature: 'mid', param: 'freqEnd', depth: 0.2 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'voice', label: { en: 'Voice', es: 'Voz' }, routes: [
      { feature: 'bright', param: 'freqEnd', depth: 0.45 },
      { feature: 'level', param: 'amplitude', depth: 0.5 },
      { feature: 'high', param: 'phaseStep', depth: 0.25 },
    ] },
  ],
  roselattice: [
    { id: 'bloom', label: { en: 'Bloom', es: 'Florece' }, routes: [
      { feature: 'bass', param: 'petalDepth', depth: 0.45 },
      { feature: 'mid', param: 'innerFraction', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'pulse', label: { en: 'Pulse', es: 'Pulso' }, routes: [
      { feature: 'level', param: 'petalDepth', depth: 0.55 },
      { feature: 'bright', param: 'innerFraction', depth: 0.4 },
    ] },
  ],
  flowfield: [
    { id: 'current', label: { en: 'Current', es: 'Corriente' }, routes: [
      { feature: 'bass', param: 'curl', depth: 0.3 },
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'storm', label: { en: 'Storm', es: 'Tormenta' }, routes: [
      { feature: 'level', param: 'curl', depth: 0.45 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  fabric: [
    { id: 'weave', label: { en: 'Weave', es: 'Trama' }, routes: [
      { feature: 'bass', param: 'warpAmount', depth: 0.45 },
      { feature: 'high', param: 'dotSize', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'ripple', label: { en: 'Ripple', es: 'Ondula' }, routes: [
      { feature: 'level', param: 'warpAmount', depth: 0.55 },
      { feature: 'bright', param: 'dotSize', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  bands: [
    { id: 'fan', label: { en: 'Fan', es: 'Abanico' }, routes: [
      { feature: 'bass', param: 'sweepAngle', depth: 0.35 },
      { feature: 'mid', param: 'growthExponent', depth: 0.25 },
    ], event: { kind: 'step', param: 'startAngle', everyBeats: 2, steps: 8 } },
    { id: 'swing', label: { en: 'Swing', es: 'Vaivén' }, routes: [
      { feature: 'level', param: 'sweepAngle', depth: 0.45 },
      { feature: 'bright', param: 'gap', depth: 0.35 },
    ] },
  ],
  coulomb: [
    { id: 'field', label: { en: 'Field', es: 'Campo' }, routes: [
      { feature: 'bass', param: 'coreRadius', depth: 0.45 },
      { feature: 'high', param: 'strokeWidth', depth: 0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
    { id: 'arc', label: { en: 'Arc', es: 'Arco' }, routes: [
      { feature: 'level', param: 'coreRadius', depth: 0.55 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
  ],
  hitomezashi: [
    { id: 'stitch', label: { en: 'Stitch', es: 'Puntada' }, routes: [
      { feature: 'high', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'parity', label: { en: 'Parity', es: 'Paridad' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.45 },
    ], event: { kind: 'flip', param: 'fillParity', everyBeats: 1 } },
  ],
  truchet: [
    { id: 'tiles', label: { en: 'Tiles', es: 'Teselas' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'maze', label: { en: 'Maze', es: 'Laberinto' }, routes: [
      { feature: 'level', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 1 } },
  ],
  delaunay: [
    { id: 'mesh', label: { en: 'Mesh', es: 'Malla' }, routes: [
      { feature: 'bass', param: 'vertexSize', depth: 0.5 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'scatter', label: { en: 'Scatter', es: 'Dispersa' }, routes: [
      { feature: 'level', param: 'vertexSize', depth: 0.55 },
      { feature: 'flux', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
  ],
  voronoi: [
    { id: 'cells', label: { en: 'Cells', es: 'Células' }, routes: [
      { feature: 'bass', param: 'inset', depth: -0.25 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'breathe', label: { en: 'Breathe', es: 'Respira' }, routes: [
      { feature: 'level', param: 'inset', depth: -0.35 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  stipple: [
    { id: 'grain', label: { en: 'Grain', es: 'Grano' }, routes: [
      { feature: 'bass', param: 'dotSize', depth: 0.5 },
      { feature: 'mid', param: 'contrast', depth: 0.4 },
    ], event: { kind: 'reseed', everyBeats: 4 } },
    { id: 'dust', label: { en: 'Dust', es: 'Polvo' }, routes: [
      { feature: 'level', param: 'dotSize', depth: 0.55 },
      { feature: 'bright', param: 'contrast', depth: 0.45 },
    ], event: { kind: 'reseed', everyBeats: 8 } },
  ],
  girih: [
    { id: 'lattice', label: { en: 'Lattice', es: 'Celosía' }, routes: [
      { feature: 'bass', param: 'ribbonWidth', depth: 0.4 },
      { feature: 'mid', param: 'contactAngle', depth: 0.18 },
      { feature: 'high', param: 'strokeWidth', depth: 0.3 },
    ] },
    { id: 'knot', label: { en: 'Knot', es: 'Nudo' }, routes: [
      { feature: 'level', param: 'contactAngle', depth: 0.3 },
      { feature: 'bright', param: 'ribbonWidth', depth: 0.4 },
    ] },
  ],
  apollonian: [
    { id: 'gasket', label: { en: 'Gasket', es: 'Empaque' }, routes: [
      { feature: 'bass', param: 'strokeWidth', depth: 0.5 },
      { feature: 'level', param: 'size', depth: 0.08 },
    ], event: { kind: 'step', param: 'maxDepth', everyBeats: 2, steps: 7 } },
    { id: 'depth', label: { en: 'Depth', es: 'Fondo' }, routes: [
      { feature: 'level', param: 'strokeWidth', depth: 0.4 },
    ], event: { kind: 'step', param: 'minRadius', everyBeats: 1, steps: 6 } },
  ],
  voxel: [
    { id: 'blocks', label: { en: 'Blocks', es: 'Bloques' }, routes: [
      { feature: 'bass', param: 'gap', depth: 0.4 },
      { feature: 'mid', param: 'depthShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'shatter', label: { en: 'Shatter', es: 'Estalla' }, routes: [
      { feature: 'level', param: 'gap', depth: 0.55 },
      { feature: 'flux', param: 'faceShading', depth: 0.3 },
    ], event: { kind: 'reseed', everyBeats: 1 } },
  ],
  diffgrowth: [
    { id: 'coral', label: { en: 'Coral', es: 'Coral' }, routes: [], event: { kind: 'reseed', everyBeats: 2 } },
    { id: 'grow', label: { en: 'Grow', es: 'Crece' }, routes: [], event: { kind: 'reseed', everyBeats: 4 } },
  ],
};

export function presetsFor(patternId: string): AnimPreset[] {
  return PRESETS_BY_PATTERN[patternId] ?? [];
}
```

- [ ] **Step 4: Run — new test AND full suite**

Run: `npx vitest run`
Expected: ALL PASS. If any `reseed` event trips the `usesSeed` assertion (a pattern I assumed seeded is not), change that preset's event to `step` on its most structural int param — do not touch the pattern.

- [ ] **Step 5: Commit**

```bash
git add src/patterns src/anim/presets.ts tests/anim/presets.test.ts
git commit -m "feat(anim): anim metadata on all 25 patterns + curated presets"
```

---

### Task 9: Canvas renderer

**Files:**
- Create: `src/anim/canvas-render.ts`
- Test: `tests/anim/canvas-render.test.ts`

- [ ] **Step 1: Write the failing test (recording fake ctx + Path2D stub)**

```ts
// tests/anim/canvas-render.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { el, type Palette } from '../../src/core/svg';
import { drawTree, type Ctx2D } from '../../src/anim/canvas-render';

const PAL: Palette = { paper: '#ffffff', ink: '#111111', accent: '#e3261a' };

class StubPath2D { constructor(public d = '') {} }
beforeAll(() => { (globalThis as { Path2D?: unknown }).Path2D = StubPath2D; });

/** Records every method call and property write, in order. */
function recorder(): { ctx: Ctx2D; log: string[] } {
  const log: string[] = [];
  const target: Record<string, unknown> = {};
  const ctx = new Proxy(target, {
    get(_t, prop: string) {
      return (...args: unknown[]) => {
        const a = args.map((x) => (x instanceof StubPath2D ? `d:${x.d}` : String(x))).join(',');
        log.push(`${prop}(${a})`);
      };
    },
    set(_t, prop: string, v: unknown) { log.push(`${prop}=${String(v)}`); return true; },
  }) as unknown as Ctx2D;
  return { ctx, log };
}

describe('drawTree', () => {
  it('fills a role-colored circle with the palette color', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [el('circle', { cx: 5, cy: 6, r: 2, fill: 'ink' })]), PAL);
    expect(log).toContain('arc(5,6,2,0,6.283185307179586)');
    expect(log).toContain('fillStyle=#111111');
    expect(log.some((l) => l.startsWith('fill('))).toBe(true);
    expect(log.some((l) => l.startsWith('stroke('))).toBe(false); // default stroke is none
  });
  it('strokes a path via Path2D and honors stroke-width', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [el('path', { d: 'M0 0L10 10', fill: 'none', stroke: 'accent', 'stroke-width': 0.5 })]), PAL);
    expect(log).toContain('strokeStyle=#e3261a');
    expect(log).toContain('lineWidth=0.5');
    expect(log).toContain('stroke(d:M0 0L10 10)');
    expect(log.some((l) => l.startsWith('fill('))).toBe(false);
  });
  it('inherits group style and multiplies opacity down the tree', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('g', { fill: 'ink', opacity: 0.5 }, [el('rect', { x: 0, y: 0, width: 4, height: 4, opacity: 0.5 })]),
    ]), PAL);
    expect(log).toContain('fillStyle=#111111');
    expect(log).toContain('globalAlpha=0.25');
  });
  it('applies transforms inside save/restore', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('g', { transform: 'translate(300 420) scale(1.2) translate(-300 -420)' }, [
        el('circle', { cx: 1, cy: 1, r: 1, fill: 'ink' }),
      ]),
    ]), PAL);
    const i = (s: string) => log.indexOf(s);
    expect(i('save()')).toBeGreaterThanOrEqual(0);
    expect(i('translate(300,420)')).toBeLessThan(i('scale(1.2,1.2)'));
    expect(i('scale(1.2,1.2)')).toBeLessThan(i('translate(-300,-420)'));
    expect(i('restore()')).toBeGreaterThan(i('arc(1,1,1,0,6.283185307179586)'));
  });
  it('draws line and polyline as stroke-only', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('line', { x1: 0, y1: 0, x2: 5, y2: 5, stroke: 'ink' }),
      el('polyline', { points: '0,0 2,3 4,0', stroke: 'ink', fill: 'none' }),
    ]), PAL);
    expect(log.filter((l) => l.startsWith('stroke(')).length).toBe(2);
    expect(log).toContain('moveTo(0,0)');
    expect(log).toContain('lineTo(2,3)');
  });
  it('throws on unsupported tags and attributes', () => {
    const { ctx } = recorder();
    expect(() => drawTree(ctx, el('svg', {}, [el('text', { x: 0, y: 0 })]), PAL)).toThrow(/unsupported tag/);
    expect(() => drawTree(ctx, el('svg', {}, [el('circle', { cx: 0, cy: 0, r: 1, filter: 'blur(2)' })]), PAL)).toThrow(/unsupported attribute/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/canvas-render.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/anim/canvas-render.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/anim/canvas-render.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/anim/canvas-render.ts tests/anim/canvas-render.test.ts
git commit -m "feat(anim): SvgNode-to-canvas renderer with strict vocabulary"
```

---

### Task 10: Vocabulary audit across all 25 patterns

The audit IS executing `drawTree` on every pattern's real output — anything the renderer can't draw throws with the tag/attr name.

**Files:**
- Test: `tests/anim/vocabulary-audit.test.ts`

- [ ] **Step 1: Write the audit test**

```ts
// tests/anim/vocabulary-audit.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import '../../src/patterns/index';
import { listPatterns, defaultParams, generateSafe } from '../../src/patterns/registry';
import { drawTree, type Ctx2D } from '../../src/anim/canvas-render';
import type { Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 1066.67, h: 600 }; // the 16:9 stage in user units

class StubPath2D { constructor(public d = '') {} }
beforeAll(() => { (globalThis as { Path2D?: unknown }).Path2D = StubPath2D; });

/** Accepts everything silently — the audit only cares whether drawTree throws. */
function nullCtx(): Ctx2D {
  return new Proxy({}, {
    get: () => () => undefined,
    set: () => true,
  }) as unknown as Ctx2D;
}

describe('every pattern renders through the canvas adapter', () => {
  for (const def of listPatterns()) {
    it(`${def.id} at defaults and at every enum/bool variant`, { timeout: 60_000 }, () => {
      const base = defaultParams(def);
      const variants: Record<string, number>[] = [base];
      for (const p of def.params) {
        if (p.kind === 'enum' || p.kind === 'bool') {
          for (let v = p.min; v <= p.max; v++) variants.push({ ...base, [p.key]: v });
        }
      }
      for (const params of variants) {
        expect(() => drawTree(nullCtx(), generateSafe(def, params, 3, SIZE), PAL)).not.toThrow();
      }
    });
  }
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/anim/vocabulary-audit.test.ts`
Expected: likely a few FAILs naming unsupported attrs (e.g. `stroke-dasharray`) or tags. That is the audit doing its job.

- [ ] **Step 3: Extend the renderer for every violation**

For each named attr/tag, add support to `src/anim/canvas-render.ts` **and its KNOWN sets** — e.g. for `stroke-dasharray`: add to `KNOWN_ATTRS`, add `setLineDash(segments: number[]): void` to `Ctx2D`, add `dash: number[]` to `Style` (default `[]`), set it in `paint` before stroking. Never silently ignore an attribute — either render it or keep it a thrown error.

- [ ] **Step 4: Run — audit AND renderer unit tests**

Run: `npx vitest run tests/anim`
Expected: ALL PASS (19 audit cases green)

- [ ] **Step 5: Commit**

```bash
git add src/anim/canvas-render.ts tests/anim/vocabulary-audit.test.ts
git commit -m "test(anim): all 25 patterns render clean through the canvas adapter"
```

---

### Task 11: Engine pure core — beat clock, phase, events, frame params

**Files:**
- Create: `src/anim/engine.ts`
- Test: `tests/anim/engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/anim/engine.test.ts
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams } from '../../src/patterns/registry';
import { BeatClock, phaseAt, frameParams } from '../../src/anim/engine';
import { PRESETS_BY_PATTERN } from '../../src/anim/presets';
import { ZERO_FRAME } from '../../src/audio/features';

describe('BeatClock', () => {
  const clock = new BeatClock([0.5, 1.0, 1.5, 2.0]);
  it('counts beats at or before t', () => {
    expect(clock.beatIndex(0.1)).toBe(-1);
    expect(clock.beatIndex(0.5)).toBe(0);
    expect(clock.beatIndex(1.49)).toBe(1);
    expect(clock.beatIndex(99)).toBe(3);
  });
  it('reports the next beat or null', () => {
    expect(clock.nextBeat(0.6)).toBe(1.0);
    expect(clock.nextBeat(2.0)).toBeNull();
  });
});

describe('phaseAt', () => {
  it('wraps in [0,1) and follows tempo when known', () => {
    expect(phaseAt(0, null)).toBe(0);
    expect(phaseAt(10, null)).toBeCloseTo(0.5, 5); // 0.05 cps free-run
    expect(phaseAt(8, 120)).toBeCloseTo(0, 5);     // 120bpm → 1 cycle per 16 beats = 8 s
    expect(phaseAt(12, 120)).toBeCloseTo(0.5, 5);
  });
});

describe('frameParams', () => {
  const def = getPattern('flowfield')!;
  const preset = PRESETS_BY_PATTERN['flowfield']![0]!; // reseed every 8 beats
  const base = { def, baseParams: defaultParams(def), baseSeed: 5, preset, intensity: 1 };

  it('is deterministic', () => {
    const f = { ...ZERO_FRAME, bass: 0.6 };
    const a = frameParams({ ...base, features: f, phase: 0.2, beatIndex: 3 });
    expect(a).toEqual(frameParams({ ...base, features: f, phase: 0.2, beatIndex: 3 }));
  });
  it('keeps the seed within an event window and changes it across windows', () => {
    const at = (beat: number) => frameParams({ ...base, features: ZERO_FRAME, phase: 0, beatIndex: beat }).seed;
    expect(at(-1)).toBe(5);
    expect(at(0)).toBe(5);
    expect(at(7)).toBe(at(0));
    expect(at(8)).not.toBe(at(7));
    expect(at(15)).toBe(at(8));
  });
  it('step events cycle a param through its range', () => {
    const mdef = getPattern('maurer')!;
    const mpreset = PRESETS_BY_PATTERN['maurer']![0]!; // step d, 12 steps, every beat
    const at = (beat: number) =>
      frameParams({ def: mdef, baseParams: defaultParams(mdef), baseSeed: 1, preset: mpreset, intensity: 1, features: ZERO_FRAME, phase: 0, beatIndex: beat }).params['d'];
    expect(at(0)).not.toBe(at(1));
    expect(at(0)).toBe(at(12)); // wraps after `steps` events
  });
  it('injects phase for usesPhase patterns and omits it otherwise', () => {
    const h = getPattern('harmonograph')!;
    const hp = PRESETS_BY_PATTERN['harmonograph']![0]!;
    const out = frameParams({ def: h, baseParams: defaultParams(h), baseSeed: 1, preset: hp, intensity: 1, features: ZERO_FRAME, phase: 0.4, beatIndex: 0 });
    expect(out.params['phase']).toBe(0.4);
    const ff = frameParams({ ...base, features: ZERO_FRAME, phase: 0.4, beatIndex: 0 });
    expect('phase' in ff.params).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/engine.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement `src/anim/engine.ts`**

```ts
import { deriveSeed } from '../core/prng';
import type { PatternDef, Params } from '../patterns/registry';
import type { FeatureFrame } from '../audio/features';
import type { AnimPreset } from './presets';
import { applyRoutes } from './mapping';

/** Beat lookup over a precomputed grid (file mode). Mic mode counts beats
 *  externally via LiveOnsetDetector and passes the index straight in. */
export class BeatClock {
  constructor(private grid: number[]) {}
  /** Index of the last beat at or before t; −1 before the first beat. */
  beatIndex(t: number): number {
    let lo = 0, hi = this.grid.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.grid[mid]! <= t) lo = mid + 1;
      else hi = mid;
    }
    return lo - 1;
  }
  nextBeat(t: number): number | null {
    const i = this.beatIndex(t) + 1;
    return i < this.grid.length ? this.grid[i]! : null;
  }
}

/** Engine time axis in [0,1): one cycle per 16 beats when tempo is known,
 *  a slow 20 s free-run otherwise — motion never fully stops. */
export function phaseAt(tSec: number, bpm: number | null): number {
  const cps = bpm !== null ? bpm / 60 / 16 : 0.05;
  const p = (tSec * cps) % 1;
  return p < 0 ? p + 1 : p;
}

export interface FrameInput {
  def: PatternDef;
  baseParams: Params;
  baseSeed: number;
  preset: AnimPreset;
  intensity: number;
  features: FeatureFrame;
  phase: number;
  beatIndex: number;
}

/** Deterministic per-frame inputs for generateSafe: continuous routes applied
 *  over the base params, plus the event state for the current beat window. */
export function frameParams(inp: FrameInput): { params: Params; seed: number } {
  const { def, preset } = inp;
  let seed = inp.baseSeed;
  const overrides: Params = {};
  const ev = preset.event;
  if (ev && inp.beatIndex >= 0) {
    // Event window index, derived purely from beatIndex so scrubbing
    // re-derives identical frames. reseed keeps the base seed in window 0;
    // flip is at base on even windows; step cycles from window 0.
    const k = Math.floor(inp.beatIndex / ev.everyBeats);
    if (ev.kind === 'reseed') {
      if (k > 0) seed = deriveSeed(inp.baseSeed, `beat-${k}`);
    } else if (ev.kind === 'flip') {
      const pd = def.params.find((p) => p.key === ev.param);
      if (pd) {
        const cur = inp.baseParams[ev.param!] ?? pd.default;
        overrides[ev.param!] = k % 2 === 0 ? cur : cur >= 0.5 ? 0 : 1;
      }
    } else {
      const pd = def.params.find((p) => p.key === ev.param);
      if (pd) {
        const steps = Math.max(2, ev.steps ?? 8);
        overrides[ev.param!] = pd.min + ((pd.max - pd.min) * (k % steps)) / (steps - 1);
      }
    }
  }
  const params = applyRoutes(def, { ...inp.baseParams, ...overrides }, preset.routes, inp.features, inp.intensity);
  if (def.anim?.usesPhase) params['phase'] = inp.phase;
  return { params, seed };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/anim/engine.test.ts`
Expected: PASS. (Note: `flip`'s alternation depends on the beat window `k`, matching the test; `frameParams` output feeds `generateSafe`, which re-clamps — double clamping is harmless.)

- [ ] **Step 5: Commit**

```bash
git add src/anim/engine.ts tests/anim/engine.test.ts
git commit -m "feat(anim): pure frame engine — beat clock, phase, events"
```

---

### Task 12: URL state — `view`, `stage`, `apre`, `aint`

**Files:**
- Modify: `src/core/url-state.ts`
- Test: append to `tests/core/url-state.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
// append to tests/core/url-state.test.ts (match the file's existing import style)
describe('animate view state', () => {
  it('round-trips an animate URL', () => {
    const s = decodeState(encodeState({
      patternId: 'harmonograph', seed: 9, params: { detune: 0.01 }, color: {}, lang: 'en',
      view: 'a', stage: '916', apre: 'pulse', aint: 0.7,
    }))!;
    expect(s.view).toBe('a');
    expect(s.stage).toBe('916');
    expect(s.apre).toBe('pulse');
    expect(s.aint).toBeCloseTo(0.7);
    expect(s.params['detune']).toBeCloseTo(0.01);
  });
  it('leaves poster URLs byte-identical to before', () => {
    const hash = encodeState({ patternId: 'moire', seed: 2, params: {}, color: {}, lang: 'en' });
    expect(hash.startsWith('#/p/moire?')).toBe(true);
    expect(hash).not.toContain('stage');
    const s = decodeState(hash)!;
    expect(s.view).toBeUndefined();
  });
  it('rejects garbage stage/aint values', () => {
    const s = decodeState('#/a/moire?v=1&seed=1&stage=4x3&aint=7')!;
    expect(s.view).toBe('a');
    expect(s.stage).toBeUndefined();
    expect(s.aint).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/core/url-state.test.ts`
Expected: FAIL — `view` not part of `AppState` / regex misses `#/a/`

- [ ] **Step 3: Implement in `src/core/url-state.ts`**

Add to `AppState`:

```ts
  /** 'a' = animate stage; undefined/'p' = poster playground. */
  view?: 'p' | 'a';
  stage?: '169' | '916' | '11';
  apre?: string;
  aint?: number;
```

In `encodeState`, change the return line and add the animate keys before the params loop:

```ts
  if (s.view === 'a') {
    if (s.stage !== undefined && s.stage !== '169') q.set('stage', s.stage);
    if (s.apre !== undefined) q.set('apre', s.apre);
    if (s.aint !== undefined && s.aint !== 1) q.set('aint', String(Math.round(s.aint * 100) / 100));
  }
```

```ts
  return `#/${s.view === 'a' ? 'a' : 'p'}/${encodeURIComponent(s.patternId)}?${q.toString()}`;
```

In `decodeState`, change the regex and group indices:

```ts
  const m = /^#\/(p|a)\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  const q = new URLSearchParams(m[3] ?? '');
```

and inside the existing `try` block change the pattern id to the shifted group:

```ts
    patternId = decodeURIComponent(m[2]!);
```

Before the `return state;` add:

```ts
  if (m[1] === 'a') {
    state.view = 'a';
    const stage = q.get('stage');
    if (stage === '169' || stage === '916' || stage === '11') state.stage = stage;
    const apre = q.get('apre');
    if (apre) state.apre = apre;
    const aintRaw = q.get('aint');
    if (aintRaw !== null) {
      const n = Number(aintRaw);
      state.aint = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
    }
  }
```

- [ ] **Step 4: Run full core suite**

Run: `npx vitest run tests/core`
Expected: ALL PASS — existing url-state tests prove poster URLs are unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/core/url-state.ts tests/core/url-state.test.ts
git commit -m "feat(anim): animate view keys in URL state"
```

---

### Task 13: Recorder and audio sources (browser glue)

**Files:**
- Create: `src/anim/recorder.ts`
- Create: `src/audio/sources.ts`
- Create: `src/anim/worker-client.ts`
- Test: `tests/anim/recorder.test.ts` (the pure part only)

- [ ] **Step 1: Write the failing test for the codec chain**

```ts
// tests/anim/recorder.test.ts
import { describe, it, expect } from 'vitest';
import { pickMimeType } from '../../src/anim/recorder';

describe('pickMimeType', () => {
  it('prefers mp4, falls back through vp9 to vp8 webm', () => {
    expect(pickMimeType(() => true)!.ext).toBe('mp4');
    expect(pickMimeType((m) => m.startsWith('video/webm'))!.mime).toContain('vp9');
    expect(pickMimeType((m) => m.includes('vp8'))!.ext).toBe('webm');
    expect(pickMimeType(() => false)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/anim/recorder.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3a: Implement `src/anim/recorder.ts`**

```ts
/** Codec preference: honest MP4 first (Safari), then WebM tiers (Chrome/Firefox). */
const CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
  { mime: 'video/mp4', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
] as const;

export function pickMimeType(
  isSupported: (mime: string) => boolean,
): { mime: string; ext: string } | null {
  const hit = CANDIDATES.find((c) => isSupported(c.mime));
  return hit ? { mime: hit.mime, ext: hit.ext } : null;
}

/** Captures the stage canvas + the audio tap into one file via MediaRecorder.
 *  Realtime by design (Phase A); the deterministic exporter is Phase B. */
export class StageRecorder {
  private rec: MediaRecorder;
  private chunks: Blob[] = [];

  constructor(canvas: HTMLCanvasElement, audio: MediaStream, mime: string) {
    const stream = new MediaStream([
      ...canvas.captureStream(60).getVideoTracks(),
      ...audio.getAudioTracks(),
    ]);
    this.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    this.rec.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
  }

  start(): void { this.rec.start(250); }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.rec.onstop = () => resolve(new Blob(this.chunks, { type: this.rec.mimeType }));
      this.rec.stop();
    });
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
```

- [ ] **Step 3b: Implement `src/audio/sources.ts`**

```ts
/** Browser-only audio graph glue. Everything testable lives in dsp/features/
 *  onsets; this file is deliberately thin and is verified manually. */

export interface AudioRig {
  mode: 'file' | 'mic';
  analyser: AnalyserNode;
  sampleRate: number;
  /** Seconds; null for mic. */
  duration: number | null;
  playing: boolean;
  play(): void;
  pause(): void;
  seek(sec: number): void;
  /** Current position in the file, or seconds since mic start. */
  position(): number;
  /** Audio-only stream for MediaRecorder capture. */
  recordingStream(): MediaStream;
  dispose(): void;
}

export async function fileRig(file: File): Promise<{ rig: AudioRig; buffer: AudioBuffer }> {
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const tap = ctx.createMediaStreamDestination();
  analyser.connect(ctx.destination);
  analyser.connect(tap);

  let src: AudioBufferSourceNode | null = null;
  let startedAt = 0;
  let offset = 0;

  const rig: AudioRig = {
    mode: 'file',
    analyser,
    sampleRate: ctx.sampleRate,
    duration: buffer.duration,
    playing: false,
    play() {
      if (this.playing) return;
      if (offset >= buffer.duration) offset = 0;
      void ctx.resume();
      src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(analyser);
      src.onended = () => {
        if (rig.playing) { rig.playing = false; offset = buffer.duration; }
      };
      src.start(0, offset);
      startedAt = ctx.currentTime;
      this.playing = true;
    },
    pause() {
      if (!this.playing || !src) return;
      offset = Math.min(buffer.duration, offset + (ctx.currentTime - startedAt));
      this.playing = false;
      src.onended = null;
      src.stop();
      src.disconnect();
      src = null;
    },
    seek(sec: number) {
      const wasPlaying = this.playing;
      if (wasPlaying) this.pause();
      offset = Math.min(buffer.duration, Math.max(0, sec));
      if (wasPlaying) this.play();
    },
    position() {
      return this.playing ? Math.min(buffer.duration, offset + (ctx.currentTime - startedAt)) : offset;
    },
    recordingStream() { return tap.stream; },
    dispose() {
      this.pause();
      void ctx.close();
    },
  };
  return { rig, buffer };
}

export async function micRig(): Promise<AudioRig> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const tap = ctx.createMediaStreamDestination();
  // Mic goes to the analyser and the recording tap, never to the speakers —
  // routing it to ctx.destination would feed back.
  ctx.createMediaStreamSource(stream).connect(analyser);
  analyser.connect(tap);
  const t0 = ctx.currentTime;
  return {
    mode: 'mic',
    analyser,
    sampleRate: ctx.sampleRate,
    duration: null,
    playing: true,
    play() { this.playing = true; },
    pause() { this.playing = false; },
    seek() { /* no-op for mic */ },
    position() { return ctx.currentTime - t0; },
    recordingStream() { return tap.stream; },
    dispose() {
      for (const t of stream.getTracks()) t.stop();
      void ctx.close();
    },
  };
}
```

- [ ] **Step 3c: Implement `src/anim/worker-client.ts`**

```ts
import type { SvgNode } from '../core/svg';
import type { Params, Size } from '../patterns/registry';

interface Resp { id: number; node: SvgNode | null; error?: string }

/** Promise wrapper over the existing compute worker protocol. Later requests
 *  supersede earlier ones only at the call site — this client just correlates ids. */
export class AnimWorkerClient {
  private worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
  private nextId = 1;
  private pending = new Map<number, (node: SvgNode | null) => void>();

  constructor() {
    this.worker.onmessage = (e: MessageEvent<Resp>) => {
      const resolve = this.pending.get(e.data.id);
      if (resolve) {
        this.pending.delete(e.data.id);
        resolve(e.data.error ? null : e.data.node);
      }
    };
  }

  request(patternId: string, params: Params, seed: number, size: Size): Promise<SvgNode | null> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ id, patternId, params, seed, size });
    });
  }

  dispose(): void { this.worker.terminate(); }
}
```

- [ ] **Step 4: Run recorder test + typecheck everything**

Run: `npx vitest run tests/anim/recorder.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors

- [ ] **Step 5: Commit**

```bash
git add src/anim/recorder.ts src/audio/sources.ts src/anim/worker-client.ts tests/anim/recorder.test.ts
git commit -m "feat(anim): recorder, audio rigs, worker client"
```

---

### Task 14: Animate view, router, playground entry, styles

**Files:**
- Create: `src/ui/animate.ts`
- Modify: `src/main.ts`, `src/ui/playground.ts`, `src/style.css`

No unit tests — this is DOM + rAF + WebAudio glue over already-tested logic. Verification is `tsc` + the manual checklist (Task 15). Keep every decision in the tested layers: if you find yourself writing logic here (math, thresholds, state machines), move it into `engine.ts`/`mapping.ts` and test it there.

- [ ] **Step 1: Implement `src/ui/animate.ts`**

```ts
import { getPattern, defaultParams, clampParams, generateSafe, type PatternDef } from '../patterns/registry';
import { decodeState, encodeState, type AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import type { SvgNode } from '../core/svg';
import { FeaturePipeline, ZERO_FRAME, type FeatureFrame } from '../audio/features';
import { detectOnsets, estimateTempo, beatGrid, LiveOnsetDetector } from '../audio/onsets';
import { fileRig, micRig, type AudioRig } from '../audio/sources';
import { BeatClock, phaseAt, frameParams } from '../anim/engine';
import { drawTree } from '../anim/canvas-render';
import { presetsFor, type AnimPreset } from '../anim/presets';
import { pickMimeType, StageRecorder, downloadBlob } from '../anim/recorder';
import { AnimWorkerClient } from '../anim/worker-client';
import { chipRow } from './controls';
import { NAMES } from './gallery';

/** Stage geometry: fixed internal pixel resolution per aspect; patterns keep
 *  composing in user units (600 on the short edge), scaled up 1.8× to pixels. */
const SCALE = 1.8;
const STAGES: Record<'169' | '916' | '11', { cw: number; ch: number }> = {
  '169': { cw: 1920, ch: 1080 },
  '916': { cw: 1080, ch: 1920 },
  '11': { cw: 1080, ch: 1080 },
};

const STR = {
  en: {
    back: '← POSTER', play: 'PLAY', pause: 'PAUSE', record: 'REC', stop: 'STOP',
    fullscreen: 'FULLSCREEN', mic: 'MIC', dropHint: 'DROP AUDIO / CLICK TO CHOOSE',
    privacy: 'Audio is processed in your browser and never uploaded.',
    intensity: 'INTENSITY', preset: 'PRESET', aspect: 'ASPECT',
    decodeError: 'Could not decode this audio file.',
    micError: 'Microphone unavailable or permission denied.',
    recError: 'Recording is not supported in this browser.',
  },
  es: {
    back: '← PÓSTER', play: 'REPRODUCIR', pause: 'PAUSA', record: 'REC', stop: 'PARAR',
    fullscreen: 'PANTALLA COMPLETA', mic: 'MIC', dropHint: 'ARRASTRA AUDIO / CLIC PARA ELEGIR',
    privacy: 'El audio se procesa en tu navegador y nunca se sube.',
    intensity: 'INTENSIDAD', preset: 'PRESET', aspect: 'ASPECTO',
    decodeError: 'No se pudo decodificar este archivo de audio.',
    micError: 'Micrófono no disponible o permiso denegado.',
    recError: 'Este navegador no permite grabar.',
  },
} as const;

export function mountAnimate(root: HTMLElement): () => void {
  const state: AppState = decodeState(location.hash)!;
  const def: PatternDef | undefined = getPattern(state.patternId);
  if (!def) { location.hash = '#/'; return () => undefined; }

  const t = STR[state.lang];
  const presets = presetsFor(def.id);
  let preset: AnimPreset = presets.find((p) => p.id === state.apre) ?? presets[0]!;
  let intensity = state.aint ?? 1;
  let stageId: '169' | '916' | '11' = state.stage ?? '169';
  const baseParams = clampParams(def, { ...defaultParams(def), ...state.params });
  const pal = resolvePalette(state.color);

  // --- audio state ---
  let rig: AudioRig | null = null;
  let pipeline: FeaturePipeline | null = null;
  let clock: BeatClock | null = null;
  let bpm: number | null = null;
  const liveDet = new LiveOnsetDetector();
  let liveBeats = -1;
  const timeBuf = new Float32Array(2048);

  // --- heavy double buffer ---
  const workerClient = def.heavy ? new AnimWorkerClient() : null;
  let heavyTree: SvgNode | null = null;
  let heavyPendingIdx = -1;
  let heavyReady: { idx: number; node: SvgNode } | null = null;

  // --- recording ---
  let recorder: StageRecorder | null = null;

  // --- DOM ---
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'anim-wrap';

  const stage = document.createElement('div');
  stage.className = 'anim-stage';
  const canvas = document.createElement('canvas');
  stage.append(canvas);

  const panel = document.createElement('div');
  panel.className = 'anim-panel';

  const back = document.createElement('a');
  back.textContent = t.back;
  back.className = 'anim-back';
  back.href = encodeState({ ...state, view: undefined, stage: undefined, apre: undefined, aint: undefined });

  const title = document.createElement('h1');
  title.textContent = (NAMES[def.id]?.[state.lang] ?? def.id).toUpperCase();

  const status = document.createElement('div');
  status.className = 'anim-status';

  // aspect
  const aspectLabel = label(t.aspect);
  let aspectChips = chipRow(
    [{ id: '169', label: '16:9' }, { id: '916', label: '9:16' }, { id: '11', label: '1:1' }],
    stageId,
    (id) => { stageId = id as typeof stageId; applyStage(); syncUrl(); rebuildChips(); },
  );

  // preset
  const presetLabel = label(t.preset);
  let presetChips = chipRow(
    presets.map((p) => ({ id: p.id, label: p.label[state.lang].toUpperCase() })),
    preset.id,
    (id) => { preset = presets.find((p) => p.id === id) ?? preset; syncUrl(); rebuildChips(); },
  );

  function rebuildChips(): void {
    const na = chipRow(
      [{ id: '169', label: '16:9' }, { id: '916', label: '9:16' }, { id: '11', label: '1:1' }],
      stageId,
      (id) => { stageId = id as typeof stageId; applyStage(); syncUrl(); rebuildChips(); },
    );
    aspectChips.replaceWith(na); aspectChips = na;
    const np = chipRow(
      presets.map((p) => ({ id: p.id, label: p.label[state.lang].toUpperCase() })),
      preset.id,
      (id) => { preset = presets.find((p) => p.id === id) ?? preset; syncUrl(); rebuildChips(); },
    );
    presetChips.replaceWith(np); presetChips = np;
  }

  // intensity
  const intensityRow = document.createElement('div');
  intensityRow.className = 'ctl-row';
  const intensityHead = label(t.intensity);
  const intensityInput = document.createElement('input');
  intensityInput.type = 'range';
  intensityInput.min = '0'; intensityInput.max = '1'; intensityInput.step = '0.01';
  intensityInput.value = String(intensity);
  intensityInput.addEventListener('input', () => { intensity = Number(intensityInput.value); syncUrl(); });
  intensityRow.append(intensityHead, intensityInput);

  // source
  const drop = document.createElement('button');
  drop.className = 'anim-drop';
  drop.textContent = t.dropHint;
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  fileInput.style.display = 'none';
  drop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { const f = fileInput.files?.[0]; if (f) void loadFile(f); });
  stage.addEventListener('dragover', (e) => e.preventDefault());
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (f) void loadFile(f);
  });

  const micBtn = button(t.mic, async () => {
    try {
      swapRig(await micRig());
      clock = null; bpm = null; liveBeats = -1;
      playBtn.textContent = t.pause;
    } catch { status.textContent = t.micError; }
  });

  const playBtn = button(t.play, () => {
    if (!rig) return;
    if (rig.playing) { rig.pause(); playBtn.textContent = t.play; }
    else { rig.play(); playBtn.textContent = t.pause; }
  });

  // scrub (file mode)
  const scrub = document.createElement('input');
  scrub.type = 'range';
  scrub.min = '0'; scrub.max = '1000'; scrub.step = '1'; scrub.value = '0';
  scrub.className = 'anim-scrub';
  scrub.style.display = 'none';
  scrub.addEventListener('input', () => {
    if (rig?.duration != null) rig.seek((Number(scrub.value) / 1000) * rig.duration);
  });

  const recBtn = button(t.record, async () => {
    if (recorder) {
      const blob = await recorder.stop();
      recorder = null;
      recBtn.classList.remove('recording');
      recBtn.textContent = t.record;
      const mime = pickMimeType((m) => MediaRecorder.isTypeSupported(m))!;
      downloadBlob(blob, `flowshape-${def.id}.${mime.ext}`);
      return;
    }
    if (!rig || typeof MediaRecorder === 'undefined') { status.textContent = t.recError; return; }
    const mime = pickMimeType((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) { status.textContent = t.recError; return; }
    recorder = new StageRecorder(canvas, rig.recordingStream(), mime.mime);
    recorder.start();
    recBtn.classList.add('recording');
    recBtn.textContent = t.stop;
  });

  const fsBtn = button(t.fullscreen, () => void stage.requestFullscreen?.());

  const privacy = document.createElement('p');
  privacy.className = 'anim-privacy';
  privacy.textContent = t.privacy;

  panel.append(back, title, aspectLabel, aspectChips, presetLabel, presetChips, intensityRow,
    drop, fileInput, micBtn, playBtn, scrub, recBtn, fsBtn, status, privacy);
  wrap.append(stage, panel);
  root.append(wrap);

  function label(text: string): HTMLElement {
    const s = document.createElement('div');
    s.className = 'ctl-label anim-label';
    s.textContent = text;
    return s;
  }
  function button(text: string, onClick: () => void | Promise<void>): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'anim-btn';
    b.textContent = text;
    b.addEventListener('click', () => void onClick());
    return b;
  }

  function syncUrl(): void {
    history.replaceState(null, '', encodeState({
      ...state, view: 'a', stage: stageId, apre: preset.id, aint: intensity,
    }));
  }

  function swapRig(next: AudioRig): void {
    rig?.dispose();
    rig = next;
    pipeline = new FeaturePipeline(next.sampleRate);
  }

  async function loadFile(file: File): Promise<void> {
    status.textContent = '…';
    try {
      const { rig: next, buffer } = await fileRig(file);
      swapRig(next);
      const mono = buffer.getChannelData(0);
      const { onsets, flux, hopSec } = detectOnsets(mono, buffer.sampleRate);
      bpm = estimateTempo(flux, hopSec);
      clock = new BeatClock(beatGrid(onsets, bpm, buffer.duration));
      scrub.style.display = '';
      status.textContent = bpm ? `${Math.round(bpm)} BPM` : '';
      rig!.play();
      playBtn.textContent = t.pause;
    } catch {
      status.textContent = t.decodeError;
    }
  }

  // --- stage sizing + render loop ---
  let userSize = { w: 600, h: 600 };
  function applyStage(): void {
    const { cw, ch } = STAGES[stageId];
    canvas.width = cw;
    canvas.height = ch;
    userSize = { w: cw / SCALE, h: ch / SCALE };
    heavyTree = null; heavyReady = null; heavyPendingIdx = -1;
  }
  applyStage();

  const ctx = canvas.getContext('2d')!;
  let raf = 0;
  let lastNow = performance.now();
  let idleClock = 0;
  // fps governor: EMA of frame cost; halve to 30fps when consistently over budget
  let costEma = 8;
  let skipOdd = false;
  let flip = false;

  function draw(node: SvgNode): void {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawTree(ctx, node, pal);
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick);
    flip = !flip;
    if (skipOdd && flip) return;
    const dtMs = Math.min(100, now - lastNow);
    lastNow = now;
    const t0 = performance.now();

    let features: FeatureFrame = ZERO_FRAME;
    let beatIndex = -1;
    let tSec: number;
    if (rig && rig.playing && pipeline) {
      rig.analyser.getFloatTimeDomainData(timeBuf);
      features = pipeline.process(timeBuf, dtMs);
      tSec = rig.position();
      if (clock) beatIndex = clock.beatIndex(tSec);
      else {
        // raw (un-enveloped) flux — see LiveOnsetDetector's contract
        if (liveDet.process(pipeline.rawFlux, dtMs)) liveBeats++;
        beatIndex = liveBeats;
      }
      if (rig.duration != null && !scrubActive()) {
        scrub.value = String(Math.round((tSec / rig.duration) * 1000));
      }
    } else {
      idleClock += dtMs / 1000;
      tSec = idleClock;
    }

    const { params, seed } = frameParams({
      def: def!, baseParams, baseSeed: state.seed, preset, intensity,
      features, phase: phaseAt(tSec, bpm), beatIndex,
    });

    if (def!.heavy && workerClient) {
      // Beat-ahead double buffer: request the NEXT event window's tree early,
      // swap when its beat arrives. Never block the frame on the worker.
      const ev = preset.event;
      const every = ev?.everyBeats ?? 1;
      // Same window index k as frameParams derives — keep the two in lockstep.
      const curIdx = beatIndex < 0 ? 0 : Math.floor(beatIndex / every);
      if (heavyReady && heavyReady.idx <= curIdx) { heavyTree = heavyReady.node; heavyReady = null; }
      const wantIdx = heavyTree === null ? curIdx : curIdx + 1;
      if (heavyPendingIdx !== wantIdx) {
        heavyPendingIdx = wantIdx;
        const probe = frameParams({
          def: def!, baseParams, baseSeed: state.seed, preset, intensity,
          features: ZERO_FRAME, phase: 0, beatIndex: wantIdx * every,
        });
        void workerClient.request(def!.id, probe.params, probe.seed, userSize).then((node) => {
          if (node && heavyPendingIdx === wantIdx) heavyReady = { idx: wantIdx, node };
        });
      }
      if (heavyTree) draw(heavyTree);
      else { // paper until the first tree lands
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = pal.paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      draw(generateSafe(def!, params, seed, userSize));
    }

    costEma = costEma * 0.9 + (performance.now() - t0) * 0.1;
    if (!skipOdd && costEma > 26) skipOdd = true;
    else if (skipOdd && costEma < 10) skipOdd = false;
  }
  let scrubbing = false;
  scrub.addEventListener('pointerdown', () => { scrubbing = true; });
  scrub.addEventListener('pointerup', () => { scrubbing = false; });
  function scrubActive(): boolean { return scrubbing; }

  syncUrl();
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    rig?.dispose();
    workerClient?.dispose();
    if (recorder) void recorder.stop();
  };
}
```

Integration note for the implementer: `NAMES` is imported from `./gallery` the same way `playground.ts` does; if its shape is not `Record<string, Record<'en' | 'es', string>>`, match whatever `playground.ts` does to display the pattern name and drop the assumption here.

- [ ] **Step 2: Route in `src/main.ts`**

Add the import and extend `route()`:

```ts
import { mountAnimate } from './ui/animate';
```

```ts
  const state = decodeState(location.hash);
  if (state && state.view === 'a') {
    app.classList.remove('view-gallery', 'view-playground');
    app.classList.add('view-animate');
    cleanup = mountAnimate(app);
  } else if (state) {
    // ...existing playground branch unchanged, but also remove 'view-animate'
```

(Ensure each branch removes the other two view classes.)

- [ ] **Step 3: ANIMATE entry in `src/ui/playground.ts`**

Next to where `backLink` is appended to the panel, add:

```ts
    const animateBtn = document.createElement('button');
    animateBtn.className = 'anim-enter';
    animateBtn.textContent = state.lang === 'es' ? 'ANIMAR →' : 'ANIMATE →';
    animateBtn.addEventListener('click', () => {
      location.hash = encodeState({ ...state, view: 'a' });
    });
```

and append `animateBtn` to the panel near the export controls. (`state` here is the playground's live state variable; place the handler where it closes over the current value — inside the same scope the other controls use.)

- [ ] **Step 4: Styles in `src/style.css`** (append)

```css
/* --- animate stage (Part 4) --- */
.view-animate .anim-wrap { display: flex; height: 100vh; }
.anim-stage {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: #000; min-width: 0;
}
.anim-stage canvas { max-width: 100%; max-height: 100%; display: block; }
.anim-panel {
  width: 280px; flex-shrink: 0; padding: 20px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
}
.anim-panel h1 { font-size: 14px; letter-spacing: 0.08em; margin: 0; }
.anim-back { font-size: 11px; text-decoration: none; }
.anim-label { margin-top: 6px; }
.anim-btn, .anim-drop, .anim-enter {
  font: inherit; font-size: 11px; letter-spacing: 0.08em;
  padding: 8px 10px; cursor: pointer; text-align: center;
  background: none; border: 1px solid currentColor;
}
.anim-drop { border-style: dashed; }
.anim-btn.recording { color: #e3261a; border-color: #e3261a; }
.anim-scrub { width: 100%; }
.anim-privacy { font-size: 10px; opacity: 0.6; margin: 4px 0 0; }
.anim-status { font-size: 11px; min-height: 14px; }
@media (max-width: 720px) {
  .view-animate .anim-wrap { flex-direction: column; }
  .anim-panel { width: auto; }
}
```

Match the existing stylesheet's variables/idiom — if the file uses CSS custom properties for colors and font sizes, use those instead of the literals above.

- [ ] **Step 5: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: clean typecheck, all tests pass, build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/ui/animate.ts src/main.ts src/ui/playground.ts src/style.css
git commit -m "feat(anim): animate stage view — transport, presets, recording"
```

---

### Task 15: DEV fidelity route + manual verification

**Files:**
- Create: `src/ui/fidelity.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Implement `src/ui/fidelity.ts`**

```ts
import '../patterns/index';
import { listPatterns, getPattern, defaultParams, generateSafe } from '../patterns/registry';
import { serialize, type Palette } from '../core/svg';
import { drawTree } from '../anim/canvas-render';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };

/** DEV-only: SVG vs canvas side by side, for eyeballing adapter fidelity. */
export function mountFidelity(root: HTMLElement): void {
  root.innerHTML = '';
  const sel = document.createElement('select');
  for (const def of listPatterns()) {
    const o = document.createElement('option');
    o.value = def.id; o.textContent = def.id;
    sel.append(o);
  }
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:16px;padding:16px;';
  const svgBox = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.width = SIZE.w; canvas.height = SIZE.h;
  row.append(svgBox, canvas);
  root.append(sel, row);

  function show(): void {
    const def = getPattern(sel.value)!;
    const node = generateSafe(def, defaultParams(def), 1, SIZE);
    svgBox.innerHTML = serialize(node, PAL);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, SIZE.w, SIZE.h);
    drawTree(ctx, node, PAL);
  }
  sel.addEventListener('change', show);
  show();
}
```

- [ ] **Step 2: DEV route in `src/main.ts`**

In `route()`, before the `decodeState` branch:

```ts
  if (import.meta.env.DEV && location.hash === '#/dev/fidelity') {
    void import('./ui/fidelity').then((m) => m.mountFidelity(app));
    return;
  }
```

- [ ] **Step 3: Manual verification checklist**

Run `npm run dev`, then verify each item (Chrome first, then Safari):

1. `#/dev/fidelity` — step through all 25 patterns; SVG and canvas sides must be visually identical (stroke weights, fills, accent placement). Fix `canvas-render.ts` for any drift and re-run the anim test suite.
2. Playground → ANIMATE → stage opens with the same pattern/params/seed; back link returns with state intact.
3. Silence: harmonograph/phyllotaxis/helix drift slowly (phase); others hold still.
4. Load an MP3 (music): status shows BPM; continuous patterns move with the music; event patterns (truchet, voronoi, voxel) switch on the beat; diffgrowth (heavy) swaps without any frame jank.
5. Aspect chips: 16:9 / 9:16 / 1:1 all letterbox correctly; pattern recomposes per aspect.
6. Preset chips + intensity slider audibly change the response; URL updates (share it into a second tab — stage restores silent, prompting for audio).
7. Mic: permission prompt → speak/clap → pattern reacts; no feedback from speakers.
8. REC while a file plays → STOP → downloaded movie plays back **with sound**, correct aspect, in QuickTime/browser (mp4 on Safari, webm on Chrome is honest and expected).
9. `lang=es` in the URL: every animate label/privacy line is Spanish.
10. Fullscreen works; ESC returns cleanly; leaving the route stops audio (no ghost playback).
11. A shared poster URL from before Part 4 still opens the playground unchanged.

- [ ] **Step 4: Full suite + build one last time**

Run: `npx vitest run && npm run build`
Expected: everything green

- [ ] **Step 5: Commit**

```bash
git add src/ui/fidelity.ts src/main.ts
git commit -m "feat(anim): dev fidelity route; manual verification pass"
```

---

## Spike findings (2026-08-29, branch `spike/audio-anim`, already folded in)

Two throwaway pages (`#/spike/smooth`, `#/spike/beat`) validated the design against real playback before this plan executes:

1. **Continuous mode is cheaper than assumed.** Harmonograph at its maximum duration (24k points) regenerates in ~3.5 ms/frame and holds 60 fps with plain SVG attribute updates. The canvas renderer stays in the plan (movie capture needs a canvas, and dense patterns like stipple will not enjoy SVG), but if Task 14 hits schedule pressure, the live stage could ship SVG-first with canvas only wrapping the recorder.
2. **Event mode is trivial on cost.** Voronoi/truchet regenerate in 2–11 ms with a 0.5–4 ms innerHTML swap — beat-locked full swaps are nowhere near a bottleneck.
3. **Onset detection must eat raw flux** (pre-envelope) — enveloped flux stalls the adaptive threshold. Folded into Tasks 3/4/14 above.
4. **Live onsets ≠ beats.** The detector fires on every transient (hi-hats included → ~240 events/min on a 120 BPM loop). That is correct behavior for mic mode — the sensitivity knob tames it — and it confirms the file path must use the precomputed beat grid (§4 of the spec), not live onsets.
5. **rAF pauses in hidden tabs.** Harmless for the visualizer, but Phase A's MediaRecorder capture records frozen video if the tab is hidden mid-recording. Known Phase A caveat; the Phase B offline exporter is immune.
6. **Band normalization must be per-band with a shared floor.** A single shared gain preserves spectral balance but starves mid/high in real music (bass dominates → "it only picks the bass"); naive per-band gains amplify leakage in empty bands to full scale. The hybrid — each band against its own running max, floored at 10% of the global max — is what Task 3 now specifies. User-confirmed against real playback.
7. **Audio-driven stroke color** (user-requested, spike-built): spectral centroid → OKLCH hue (250° cool → 30° warm), level → chroma (silence decays to monochrome ink), lightness fixed, one flat color per frame — no gradients. If it survives the eye test it becomes an opt-in preset flavor in the mapping layer; defaults stay monochrome.

## Self-review notes (already applied)

- Spec coverage: §1 analysis → Tasks 1–4; §2 mapping/presets/phase/state → Tasks 5–8, 12; §3 renderer → Tasks 9–10, 15; §4 engine → Task 11 + loop in 14; §5 UI → Task 14; §6 Phase A export → Tasks 13–14. §6 Phase B and §7 are explicitly out of scope.
- The `flip` event alternates by beat *window* parity, and `frameParams` derives everything from `beatIndex` — no hidden state, so scrubbing a file re-derives the identical frame (spec §4 determinism).
- Heavy patterns bypass per-frame `generateSafe` entirely (their presets carry no routes — enforced by the Task 8 validation test), so the worker is the only generation path for them.
- `aint=7` clamps to 1 rather than erroring, matching `clampParams` philosophy for URL-supplied values.
