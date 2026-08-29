import { RESERVED } from './reserved';
import { DEFAULT_FORMAT } from '../poster/formats';

export interface ColorState {
  hue?: number;
  chroma?: number;
  paperL?: number;
  accentShift?: number;
  bg?: string;
  ink?: string;
  acc?: string;
}

/** Defaults for the four OKLCH colour controls. `ColorState` lives here, so
 *  this is the single canonical copy; `src/poster/palettes.ts` re-exports
 *  it as `COLOR_DEFAULTS` for colour resolution. */
export const COLOR_DEFAULTS = { hue: 250, chroma: 0, paperL: 0.09, accentShift: 150 } as const;

export interface AppState {
  patternId: string;
  seed: number;
  params: Record<string, number>;
  color: ColorState;
  lang: 'en' | 'es';
  format?: string;
  cw?: number;
  ch?: number;
  cu?: 'mm' | 'cm' | 'in';
}

export { RESERVED } from './reserved';

export function encodeState(s: AppState): string {
  const q = new URLSearchParams();
  q.set('v', '1');
  q.set('seed', String(s.seed));
  if (s.color.hue !== undefined && s.color.hue !== COLOR_DEFAULTS.hue) q.set('hue', String(s.color.hue));
  if (s.color.chroma !== undefined && s.color.chroma !== COLOR_DEFAULTS.chroma) q.set('chroma', String(s.color.chroma));
  if (s.color.paperL !== undefined && s.color.paperL !== COLOR_DEFAULTS.paperL) q.set('paperL', String(s.color.paperL));
  if (s.color.accentShift !== undefined && s.color.accentShift !== COLOR_DEFAULTS.accentShift) q.set('accentShift', String(s.color.accentShift));
  if (s.color.bg) q.set('bg', s.color.bg);
  if (s.color.ink) q.set('ink', s.color.ink);
  if (s.color.acc) q.set('acc', s.color.acc);
  if (s.lang !== 'en') q.set('lang', s.lang);
  if (s.format !== undefined && s.format !== DEFAULT_FORMAT) q.set('format', s.format);
  if (s.cw !== undefined) q.set('cw', String(s.cw));
  if (s.ch !== undefined) q.set('ch', String(s.ch));
  if (s.cu !== undefined) q.set('cu', s.cu);
  for (const [k, v] of Object.entries(s.params)) {
    if (RESERVED.has(k)) continue;
    q.set(k, String(Math.round(v * 10000) / 10000));
  }
  return `#/p/${encodeURIComponent(s.patternId)}?${q.toString()}`;
}

export function decodeState(hash: string): AppState | null {
  const m = /^#\/p\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  const q = new URLSearchParams(m[2] ?? '');
  const params: Record<string, number> = {};
  for (const [k, v] of q.entries()) {
    if (RESERVED.has(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) params[k] = n;
  }
  const seedRaw = Number(q.get('seed'));
  const color: ColorState = {};
  const hueRaw = q.get('hue'); if (hueRaw !== null) { const n = Number(hueRaw); if (Number.isFinite(n)) color.hue = n; }
  const chromaRaw = q.get('chroma'); if (chromaRaw !== null) { const n = Number(chromaRaw); if (Number.isFinite(n)) color.chroma = n; }
  const paperLRaw = q.get('paperL'); if (paperLRaw !== null) { const n = Number(paperLRaw); if (Number.isFinite(n)) color.paperL = n; }
  const accentShiftRaw = q.get('accentShift'); if (accentShiftRaw !== null) { const n = Number(accentShiftRaw); if (Number.isFinite(n)) color.accentShift = n; }
  const bg = q.get('bg'); if (bg) color.bg = bg;
  const ink = q.get('ink'); if (ink) color.ink = ink;
  const acc = q.get('acc'); if (acc) color.acc = acc;
  let patternId: string;
  try {
    patternId = decodeURIComponent(m[1]!);
  } catch {
    return null;
  }
  const state: AppState = {
    patternId,
    seed: Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1,
    params,
    color,
    lang: q.get('lang') === 'es' ? 'es' : 'en',
  };
  const format = q.get('format'); if (format !== null) state.format = format;
  const cwRaw = q.get('cw'); if (cwRaw !== null) { const n = Number(cwRaw); if (Number.isFinite(n)) state.cw = n; }
  const chRaw = q.get('ch'); if (chRaw !== null) { const n = Number(chRaw); if (Number.isFinite(n)) state.ch = n; }
  const cu = q.get('cu'); if (cu === 'mm' || cu === 'cm' || cu === 'in') state.cu = cu;
  return state;
}
