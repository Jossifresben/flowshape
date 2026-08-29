import { describe, it, expect } from 'vitest';
import { relativeLuminance, contrastRatio } from '../../src/core/contrast';

describe('contrast', () => {
  it('anchors luminance at the sRGB extremes', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('weights green above red above blue', () => {
    const r = relativeLuminance('#ff0000');
    const g = relativeLuminance('#00ff00');
    const b = relativeLuminance('#0000ff');
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
  });

  it('gives 21:1 for black on white and 1:1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#3d7fa1', '#3d7fa1')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#f0e8d8')).toBeCloseTo(contrastRatio('#f0e8d8', '#123456'), 10);
  });
});
