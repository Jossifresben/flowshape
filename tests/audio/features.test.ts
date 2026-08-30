// tests/audio/features.test.ts
import { describe, it, expect } from 'vitest';
import { FeaturePipeline, FEATURE_KEYS, ZERO_FRAME, TUNING_DEFAULTS } from '../../src/audio/features';

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
  it('a band gain of 0 silences that band; >1 still clamps at 1', () => {
    const p = new FeaturePipeline(SR, { ...TUNING_DEFAULTS, bassGain: 0, midGain: 2 });
    let f = ZERO_FRAME;
    for (let i = 0; i < 30; i++) f = p.process(sineWindow(100), 16);
    expect(f.bass).toBe(0);
    for (let i = 0; i < 30; i++) f = p.process(sineWindow(1000), 16);
    expect(f.mid).toBeLessThanOrEqual(1);
    expect(f.mid).toBeGreaterThan(0.5);
  });
  it('a longer release retuned live decays slower than the default', () => {
    const slow = new FeaturePipeline(SR);
    const fast = new FeaturePipeline(SR);
    slow.setTuning({ ...TUNING_DEFAULTS, releaseMs: 1500 });
    let fs = ZERO_FRAME, ff = ZERO_FRAME;
    for (let i = 0; i < 30; i++) { fs = slow.process(sineWindow(100), 16); ff = fast.process(sineWindow(100), 16); }
    for (let i = 0; i < 20; i++) { fs = slow.process(new Float32Array(2048), 16); ff = fast.process(new Float32Array(2048), 16); }
    expect(fs.bass).toBeGreaterThan(ff.bass);
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
