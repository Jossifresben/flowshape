/** Width of `text` rendered at `size` px, in the caller's bound font. */
export type Measure = (text: string, size: number) => number;

/**
 * Deterministic approximation. Used by tests, and as the fallback anywhere a
 * canvas is unavailable — a poster that lays out slightly loose is better than
 * one that throws.
 */
export function approxMeasure(ratio = 0.52): Measure {
  return (text, size) => text.length * size * ratio;
}

/** Canvas-backed measurement. Browser only. */
export function canvasMeasure(family: string, weight: number, tracking = 0): Measure {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return approxMeasure();
  return (text, size) => {
    ctx.font = `${weight} ${size}px ${family}`;
    // Canvas cannot apply letter-spacing portably, so tracking is added back
    // per gap. Titles are set at -0.045em or tighter, so omitting this
    // overestimates the width and the title wraps a step too early.
    return ctx.measureText(text).width + tracking * size * Math.max(0, text.length - 1);
  };
}
