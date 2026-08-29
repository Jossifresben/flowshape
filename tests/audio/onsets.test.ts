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
