import type { ColorState } from '../core/url-state';

export interface Preset { seed?: number; params?: Record<string, number>; color?: ColorState }

/** Hand-tuned states chosen by the owner for the gallery samples. Patterns absent
 *  from this map fall back to their defaults. */
export const PRESETS: Record<string, Preset> = {
  bands: {
    seed: 1,
    params: {
      bandCount: 5,
      minThickness: 9,
      maxThickness: 105,
      growthExponent: 2.35,
      gap: 24,
      startAngle: 261,
      sweepAngle: 94,
      accentEvery: 7,
      size: 1,
    },
    color: { hue: 117 },
  },
  harmonograph: {
    seed: 36890,
    params: {
      ratio: 0,
      detune: 0.011,
      damping: 0.0065,
      duration: 480,
      strokeWidth: 0.75,
      opacity: 0.82,
      size: 1.1,
    },
  },
  helix: {
    seed: 1,
    params: {
      turns: 11.7,
      radiusFraction: 0.27,
      rungEvery: 3,
      depthFade: 1.2,
      strokeWidth: 0.5,
      size: 1,
    },
  },
  roselattice: {
    seed: 1,
    params: {
      petals: 9,
      rings: 11,
      spokes: 115,
      petalDepth: 38,
      innerFraction: 0.07,
      strokeWidth: 0.6,
      size: 1,
    },
  },
  timestable: {
    seed: 1,
    params: {
      chords: 400,
      multiplier: 4.45,
      strokeWidth: 0.35,
      opacity: 0.88,
      showCircle: 0,
      size: 1,
    },
  },
  voxel: {
    seed: 95500,
    params: {
      shape: 1,
      dimension: 12,
      gap: 0.08,
      shellOnly: 1,
      scatter: 0.59,
      faceShading: 0.78,
      depthShading: 0.55,
      strokeWidth: 0.5,
      size: 1.11,
    },
  },
};
