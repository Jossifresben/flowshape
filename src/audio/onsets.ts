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
