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
