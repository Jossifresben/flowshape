import { describe, it, expect } from 'vitest';
import { oklchToHex } from '../../src/core/oklch';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

describe('oklchToHex', () => {
  it('L=0 is near black', () => {
    const [r, g, b] = hexToRgb(oklchToHex(0, 0, 0));
    expect(r).toBeLessThanOrEqual(2);
    expect(g).toBeLessThanOrEqual(2);
    expect(b).toBeLessThanOrEqual(2);
  });

  it('L=1 is near white', () => {
    const [r, g, b] = hexToRgb(oklchToHex(1, 0, 0));
    expect(r).toBeGreaterThanOrEqual(253);
    expect(g).toBeGreaterThanOrEqual(253);
    expect(b).toBeGreaterThanOrEqual(253);
  });

  it('C=0 always yields a grey (R=G=B) at any hue', () => {
    for (const L of [0, 0.2, 0.5, 0.8, 1]) {
      for (const H of [0, 45, 90, 137.51, 200, 300, 359]) {
        const [r, g, b] = hexToRgb(oklchToHex(L, 0, H));
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
    }
  });

  it('always returns a valid 7-char #rrggbb string', () => {
    const cases: Array<[number, number, number]> = [
      [0.5, 0.1, 250],
      [-0.2, 0.5, 10], // out of range inputs should still clamp cleanly
      [1.4, 0.02, 400],
      [0.09, 0, 0],
    ];
    for (const [L, C, H] of cases) {
      const hex = oklchToHex(L, C, H);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('a mid-lightness saturated blue lands with B highest', () => {
    const [r, g, b] = hexToRgb(oklchToHex(0.55, 0.2, 260));
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('a mid-lightness saturated red lands with R highest', () => {
    const [r, g, b] = hexToRgb(oklchToHex(0.55, 0.2, 25));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
});
