export type Unit = 'mm' | 'cm' | 'in';

export interface Format {
  id: string;
  label: string;
  group: 'iso' | 'us' | 'other';
  wmm: number;
  hmm: number;
}

/** Physical poster sizes. Presets keep the orientation given; nothing auto-rotates. */
export const FORMATS: Format[] = [
  { id: 'a5', label: 'A5', group: 'iso', wmm: 148, hmm: 210 },
  { id: 'a4', label: 'A4', group: 'iso', wmm: 210, hmm: 297 },
  { id: 'a3', label: 'A3', group: 'iso', wmm: 297, hmm: 420 },
  { id: 'a2', label: 'A2', group: 'iso', wmm: 420, hmm: 594 },
  { id: 'letter', label: 'Letter', group: 'us', wmm: 216, hmm: 279 },
  { id: 'tabloid', label: 'Tabloid', group: 'us', wmm: 279, hmm: 432 },
  { id: 'in18x24', label: '18×24″', group: 'us', wmm: 457, hmm: 610 },
  { id: 'in24x36', label: '24×36″', group: 'us', wmm: 610, hmm: 914 },
  { id: 'square', label: '1:1', group: 'other', wmm: 500, hmm: 500 },
  { id: 'cm50x70', label: '50×70', group: 'other', wmm: 500, hmm: 700 },
];

export const DEFAULT_FORMAT = 'a3';
/** The short edge is fixed so stroke weights read the same across every format. */
export const SHORT_EDGE = 600;

const TO_MM: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 };

export interface FormatState { format?: string; cw?: number; ch?: number; cu?: Unit }

export function getFormat(id: string | undefined): Format | undefined {
  return FORMATS.find((f) => f.id === id);
}

/** Physical size in mm. Unknown ids and degenerate custom values fall back to the default. */
export function physicalSize(s: FormatState): { wmm: number; hmm: number } {
  if (s.format === 'custom') {
    const k = TO_MM[s.cu ?? 'mm'];
    const wmm = (s.cw ?? 0) * k;
    const hmm = (s.ch ?? 0) * k;
    if (wmm > 0 && hmm > 0) return { wmm: round2(wmm), hmm: round2(hmm) };
  }
  const f = getFormat(s.format) ?? getFormat(DEFAULT_FORMAT)!;
  return { wmm: f.wmm, hmm: f.hmm };
}

/** Render size in SVG user units: short edge fixed, long edge from the physical ratio. */
export function renderSize(s: FormatState): { w: number; h: number } {
  const { wmm, hmm } = physicalSize(s);
  return wmm <= hmm
    ? { w: SHORT_EDGE, h: Math.round((SHORT_EDGE * hmm) / wmm) }
    : { w: Math.round((SHORT_EDGE * wmm) / hmm), h: SHORT_EDGE };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
