import type { Family } from '../patterns/registry';
import { UI } from './ui';
import { PARAMS } from './params';
import { PATTERN_NAMES, FAMILY_NAMES } from './patterns';

export type Lang = 'en' | 'es';
/** `[english, spanish]`. A tuple rather than an object so a missing
 *  translation is a type error, not a silent `undefined`. */
export type Pair = readonly [en: string, es: string];

export const LANGS = ['en', 'es'] as const satisfies readonly Lang[];

const at = (p: Pair, lang: Lang): string => (lang === 'es' ? p[1] : p[0]);

/** A chrome string. Unknown keys return the key itself — visible in
 *  development, harmless in production. */
export function t(key: string, lang: Lang): string {
  const pair = UI[key];
  return pair ? at(pair, lang) : key;
}

export function patternName(id: string, lang: Lang): string {
  const pair = PATTERN_NAMES[id];
  return pair ? at(pair, lang) : id;
}

export function familyLabel(family: Family, lang: Lang): string {
  const pair = FAMILY_NAMES[family];
  return pair ? at(pair, lang) : family;
}

/** A parameter or enum-option label. Tries the exact `<pattern>.<key>` first,
 *  then the shared `common.<key>`, and only then falls back to the bare key —
 *  see `params.ts`. `hasParamLabel` is what the test suite asserts on, so the
 *  fallback can never quietly become the norm. */
export function paramLabel(key: string, lang: Lang): string {
  const exact = PARAMS[key];
  if (exact) return at(exact, lang);
  const suffix = key.split('.').pop()!;
  const shared = PARAMS[`common.${suffix}`];
  if (shared) return at(shared, lang);
  return suffix.toUpperCase();
}

/** Whether `paramLabel` resolves through a real table entry. */
export function hasParamLabel(key: string): boolean {
  return PARAMS[key] !== undefined || PARAMS[`common.${key.split('.').pop()!}`] !== undefined;
}

// --- the reader's chosen language ----------------------------------------

const STORAGE_KEY = 'flowshape:lang';
/** Fired on `window` after the language changes. The router listens and
 *  re-mounts the current view; nothing re-renders itself. */
export const LANG_EVENT = 'flowshape:langchange';

function isLang(v: string | null | undefined): v is Lang {
  return v === 'en' || v === 'es';
}

/** The query string of a `#/p/<id>?…` style hash, or null for anything else. */
function hashQuery(hash: string): { head: string; params: URLSearchParams } | null {
  const m = /^(#[^?]*)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  return { head: m[1]!, params: new URLSearchParams(m[2] ?? '') };
}

/**
 * The active language: an explicit `lang` in the URL wins (a shared link
 * carries its own language), then the reader's stored choice, then the
 * browser's. Deliberately does not import `url-state` — this needs to work on
 * the gallery and the about page, which have no poster state at all.
 */
export function currentLang(): Lang {
  const fromUrl = hashQuery(location.hash)?.params.get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // localStorage throws in Safari private mode; fall through to the browser.
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

/** Rewrites a state hash's `lang` to `lang`, dropping it when English (the
 *  default `encodeState` omits). Used for links the reader follows from a
 *  page they are already reading in one language — a remembered state must not
 *  drag the language it was saved in along with it. */
export function withLang(hash: string, lang: Lang): string {
  const q = hashQuery(hash);
  if (!q) return hash;
  if (lang === 'en') q.params.delete('lang');
  else q.params.set('lang', lang);
  const query = q.params.toString();
  return query ? `${q.head}?${query}` : q.head;
}

/**
 * Records the reader's choice and tells the app to re-render. Rewrites the
 * URL's `lang` in place when there is one — `en` is dropped rather than
 * written, matching how `encodeState` omits defaults, so switching to English
 * yields the same link a fresh visitor would get.
 *
 * Uses `replaceState`, so no `hashchange` fires and the language event is the
 * single re-render trigger.
 */
export function setLang(lang: Lang): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, lang);
  } catch {
    // Persistence is best-effort; the event below still switches the session.
  }
  const q = hashQuery(location.hash);
  if (q && q.params.toString() !== '') {
    if (lang === 'en') q.params.delete('lang');
    else q.params.set('lang', lang);
    const query = q.params.toString();
    history.replaceState(null, '', query ? `${q.head}?${query}` : q.head);
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}
