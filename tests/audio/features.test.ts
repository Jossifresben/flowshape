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
