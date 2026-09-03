import { RESERVED } from './reserved';
import { DEFAULT_FORMAT } from '../poster/formats';
import { TUNING_DEFAULTS } from '../audio/features';

export interface ColorState {
  hue?: number;
  /** Offsets *paper's* hue from ink's, in degrees. The second hue axis: at 0
   *  the whole palette is one hue plus a lightness slider; away from 0 the
   *  ground and the mark sit at different points on the hue circle, which is
   *  what makes a warm paper under cool ink possible at all. */
  hueSpread?: number;
  chroma?: number;
  paperL?: number;
  accentShift?: number;
  bg?: string;
  ink?: string;
  acc?: string;
}

/** Defaults for the five OKLCH colour controls. `ColorState` lives here, so
 *  this is the single canonical copy; `src/poster/palettes.ts` re-exports
 *  it as `COLOR_DEFAULTS` for colour resolution.
 *
 *  `hueSpread` defaults to 0 and must stay there: every poster URL shared
 *  before this axis existed omits the key, so 0 is what those URLs decode to,
 *  and `resolvePalette` is required to reproduce the old palette exactly at
 *  that value. */
export const COLOR_DEFAULTS = { hue: 250, hueSpread: 0, chroma: 0, paperL: 0.09, accentShift: 150 } as const;

/** The three routes a creation hash can name. 'a' = animate stage; 'c' =
 *  poster composer; 'p' = playground. */
export type View = 'p' | 'a' | 'c';

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
  /** undefined behaves as 'p' — see `View`. */
  view?: View;
  stage?: '169' | '916' | '11';
  apre?: string;
  aint?: number;
  /** Stage-only COLOUR toggle. Default off; a shared link preserves it like
   *  apre/aint do. Never read outside view === 'a' — the poster path has no
   *  concept of it. */
  acol?: boolean;
  /** Stage-only: which demo track is loaded, by its id. A shared link that
   *  names one arrives with that music already selected, so the recipient
   *  hears what the sender heard rather than a silent stage. Absent when the
   *  audio is the viewer's own file or the mic — neither travels in a URL. */
  adem?: string;
  /** Stage-only audio tuning, mirroring `AudioTuning` — envelope attack (ms),
   *  release (ms), and the three band gains. Omitted at the defaults so every
   *  animate URL shared before these existed decodes to identical motion. */
  aatk?: number;
  arel?: number;
  abass?: number;
  amid?: number;
  ahigh?: number;
  /** Composer only: the browsed layout variant id. */
  layout?: string;
  /** Composer only: the stepped colorway index. */
  cway?: number;
  /** Composer only: render the sheet without any text. */
  notext?: boolean;
}

export { RESERVED } from './reserved';

export function encodeState(s: AppState): string {
  const q = new URLSearchParams();
  q.set('v', '1');
  q.set('seed', String(s.seed));
  if (s.color.hue !== undefined && s.color.hue !== COLOR_DEFAULTS.hue) q.set('hue', String(s.color.hue));
  if (s.color.hueSpread !== undefined && s.color.hueSpread !== COLOR_DEFAULTS.hueSpread) q.set('hueSpread', String(s.color.hueSpread));
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
  if (s.view === 'a') {
    if (s.stage !== undefined && s.stage !== '169') q.set('stage', s.stage);
    if (s.apre !== undefined) q.set('apre', s.apre);
    if (s.aint !== undefined && s.aint !== 1) q.set('aint', String(Math.round(s.aint * 100) / 100));
    if (s.acol) q.set('acol', '1');
    if (s.adem !== undefined) q.set('adem', s.adem);
    if (s.aatk !== undefined && s.aatk !== TUNING_DEFAULTS.attackMs) q.set('aatk', String(Math.round(s.aatk)));
    if (s.arel !== undefined && s.arel !== TUNING_DEFAULTS.releaseMs) q.set('arel', String(Math.round(s.arel)));
    if (s.abass !== undefined && s.abass !== TUNING_DEFAULTS.bassGain) q.set('abass', String(Math.round(s.abass * 100) / 100));
    if (s.amid !== undefined && s.amid !== TUNING_DEFAULTS.midGain) q.set('amid', String(Math.round(s.amid * 100) / 100));
    if (s.ahigh !== undefined && s.ahigh !== TUNING_DEFAULTS.highGain) q.set('ahigh', String(Math.round(s.ahigh * 100) / 100));
  }
  if (s.view === 'c') {
    if (s.layout !== undefined) q.set('layout', s.layout);
    if (s.cway !== undefined) q.set('cway', String(s.cway));
    if (s.notext) q.set('notext', '1');
  }
  for (const [k, v] of Object.entries(s.params)) {
    if (RESERVED.has(k)) continue;
    q.set(k, String(Math.round(v * 10000) / 10000));
  }
  const route = s.view === 'a' || s.view === 'c' ? s.view : 'p';
  return `#/${route}/${encodeURIComponent(s.patternId)}?${q.toString()}`;
}

export function decodeState(hash: string): AppState | null {
  const m = /^#\/(p|a|c)\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  const q = new URLSearchParams(m[3] ?? '');
  const params: Record<string, number> = {};
  for (const [k, v] of q.entries()) {
    if (RESERVED.has(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) params[k] = n;
  }
  const seedRaw = Number(q.get('seed'));
  const color: ColorState = {};
  const hueRaw = q.get('hue'); if (hueRaw !== null) { const n = Number(hueRaw); if (Number.isFinite(n)) color.hue = n; }
  const hueSpreadRaw = q.get('hueSpread'); if (hueSpreadRaw !== null) { const n = Number(hueSpreadRaw); if (Number.isFinite(n)) color.hueSpread = n; }
  const chromaRaw = q.get('chroma'); if (chromaRaw !== null) { const n = Number(chromaRaw); if (Number.isFinite(n)) color.chroma = n; }
  const paperLRaw = q.get('paperL'); if (paperLRaw !== null) { const n = Number(paperLRaw); if (Number.isFinite(n)) color.paperL = n; }
  const accentShiftRaw = q.get('accentShift'); if (accentShiftRaw !== null) { const n = Number(accentShiftRaw); if (Number.isFinite(n)) color.accentShift = n; }
  const bg = q.get('bg'); if (bg) color.bg = bg;
  const ink = q.get('ink'); if (ink) color.ink = ink;
  const acc = q.get('acc'); if (acc) color.acc = acc;
  let patternId: string;
  try {
    patternId = decodeURIComponent(m[2]!);
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
  if (m[1] === 'a') {
    state.view = 'a';
    const stage = q.get('stage');
    if (stage === '169' || stage === '916' || stage === '11') state.stage = stage;
    const apre = q.get('apre');
    if (apre) state.apre = apre;
    const aintRaw = q.get('aint');
    if (aintRaw !== null) {
      const n = Number(aintRaw);
      state.aint = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
    }
    if (q.get('acol') === '1') state.acol = true;
    const adem = q.get('adem');
    if (adem) state.adem = adem;
    // Tuning values clamp to the sliders' ranges; a non-numeric value is
    // dropped so the view falls back to the default, same as aint.
    const numIn = (key: string, lo: number, hi: number): number | undefined => {
      const raw = q.get(key);
      if (raw === null) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : undefined;
    };
    const aatk = numIn('aatk', 5, 200); if (aatk !== undefined) state.aatk = aatk;
    const arel = numIn('arel', 50, 1500); if (arel !== undefined) state.arel = arel;
    const abass = numIn('abass', 0, 2); if (abass !== undefined) state.abass = abass;
    const amid = numIn('amid', 0, 2); if (amid !== undefined) state.amid = amid;
    const ahigh = numIn('ahigh', 0, 2); if (ahigh !== undefined) state.ahigh = ahigh;
  }
  if (m[1] === 'c') {
    state.view = 'c';
    const layout = q.get('layout');
    if (layout) state.layout = layout;
    const cwayRaw = q.get('cway');
    if (cwayRaw !== null) {
      const n = Number(cwayRaw);
      // A bad index is dropped rather than clamped: the view then falls back
      // to colorway 0, which carries the user's own hue and accent offset.
      if (Number.isInteger(n) && n >= 0) state.cway = n;
    }
    if (q.get('notext') === '1') state.notext = true;
  }
  return state;
}

/** The route a creation hash belongs to, or null when it is not one. The
 *  single source of truth for "is this a renderable creation URL" — callers
 *  must not re-derive it with their own regex. decodeState leaves `view`
 *  unset for the playground route, hence the `?? 'p'` fallback. */
export function routeOf(hash: string): View | null {
  const s = decodeState(hash);
  return s ? (s.view ?? 'p') : null;
}
