import type { Measure } from './measure';

/** Thousands separator. A thin space, never a comma (handover section 5). */
const THIN_SPACE = ' ';

export function wrap(text: string, maxWidth: number, size: number, measure: Measure): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`;
    if (measure(next, size) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = words[i]!;
    }
  }
  lines.push(line);
  return lines;
}

export interface Fit { lines: string[]; size: number }

/**
 * Section 7's first rule: step down 8% per attempt, floor at 76 reference px,
 * and below that fail the render. Ellipsis on a poster title is wrong — a
 * truncated name is a worse artefact than a refused one.
 *
 * A single word wider than `maxWidth` is left on its own line rather than
 * broken, so a one-word title never forces a break.
 */
export function fitTitle(
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  floorSize: number,
  measure: Measure,
): Fit | null {
  let size = startSize;
  while (size >= floorSize) {
    const lines = wrap(text, maxWidth, size, measure);
    if (lines.length <= maxLines) return { lines, size };
    size *= 0.92;
  }
  return null;
}

/** Truncate at the last word boundary before `max`. Never shrink the type. */
export function truncateDescription(text: string, max = 140): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  const body = space > 0 ? cut.slice(0, space) : cut;
  return `${body.replace(/[.,;:–—-]+$/, '')}…`;
}

export function formatInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
}

export function formatValue(v: number, kind: 'int' | 'float' | 'bool' | 'enum'): string {
  if (kind === 'bool') return v >= 0.5 ? 'ON' : 'OFF';
  if (kind === 'int' || kind === 'enum') return formatInt(v);
  return v.toFixed(2);
}
