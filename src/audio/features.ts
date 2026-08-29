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
