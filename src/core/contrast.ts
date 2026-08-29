/**
 * WCAG 2.1 relative luminance and contrast ratio, over `#rrggbb` strings.
 *
 * Lives in core/ rather than compose/ because the question it answers — "does
 * this type read on that field?" — belongs to the colour model, not to the
 * poster that happens to ask it first.
 */

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The better-reading of two candidates against `field`. */
export function pickType(field: string, a: string, b: string): string {
  return contrastRatio(field, a) >= contrastRatio(field, b) ? a : b;
}
