import { RESERVED } from './reserved';

export interface ColorState { pal?: string; bg?: string; ink?: string; acc?: string }

export interface AppState {
  patternId: string;
  seed: number;
  params: Record<string, number>;
  color: ColorState;
  theme: 'light' | 'dark';
  lang: 'en' | 'es';
}

export { RESERVED } from './reserved';

export function encodeState(s: AppState): string {
  const q = new URLSearchParams();
  q.set('v', '1');
  q.set('seed', String(s.seed));
  if (s.color.pal) q.set('pal', s.color.pal);
  if (s.color.bg) q.set('bg', s.color.bg);
  if (s.color.ink) q.set('ink', s.color.ink);
  if (s.color.acc) q.set('acc', s.color.acc);
  if (s.theme !== 'light') q.set('theme', s.theme);
  if (s.lang !== 'en') q.set('lang', s.lang);
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
  const pal = q.get('pal'); if (pal) color.pal = pal;
  const bg = q.get('bg'); if (bg) color.bg = bg;
  const ink = q.get('ink'); if (ink) color.ink = ink;
  const acc = q.get('acc'); if (acc) color.acc = acc;
  let patternId: string;
  try {
    patternId = decodeURIComponent(m[1]!);
  } catch {
    return null;
  }
  return {
    patternId,
    seed: Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1,
    params,
    color,
    theme: q.get('theme') === 'dark' ? 'dark' : 'light',
    lang: q.get('lang') === 'es' ? 'es' : 'en',
  };
}
