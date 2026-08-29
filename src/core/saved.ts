/**
 * Saved creations, in localStorage. A favourite is a saved URL hash: the hash
 * is already the complete, forward-compatible description of a design, poster
 * or animation (see docs/url-state.md), so nothing about the artwork is
 * duplicated here and nothing can drift out of sync with the generators.
 *
 * The contract deliberately differs from core/persist.ts. Persist may swallow
 * failures silently because losing a remembered slider position costs nothing.
 * These are the visitor's own saved work, so a save that did not happen must
 * be reported, never swallowed — hence Result rather than void.
 */

/** Which view a hash belongs to: design · animation · poster. */
export type Kind = 'p' | 'a' | 'c';

export interface SavedItem {
  /** The complete creation. Also the record's identity: unique by construction. */
  hash: string;
  kind: Kind;
  title: string;
  /** Epoch ms, for newest-first ordering. */
  savedAt: number;
}

export type Reason = 'unavailable' | 'quota' | 'corrupt' | 'invalid' | 'missing';
export type Result<T> = { ok: true; value: T } | { ok: false; reason: Reason };

export const SAVED_KEY = 'flowshape:saved';
/** The store's schema version, independent of the URL schema's `v`. */
export const SV = 1;
const PROBE_KEY = 'flowshape:probe';

interface Store { sv: number; items: SavedItem[] }

const HASH_RE = /^#\/(p|a|c)\/[^?]+/;

/** The route letter of a creation hash, or null for anything else. */
export function kindOf(hash: string): Kind | null {
  const m = HASH_RE.exec(hash);
  return m ? (m[1] as Kind) : null;
}

function raw(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing the property itself throws in some sandboxed contexts.
    return null;
  }
}

/** Whether saving can actually work here. A probe write, because Safari in
 *  private mode exposes the object and throws only on write. */
export function isAvailable(): boolean {
  const s = raw();
  if (!s) return false;
  try {
    s.setItem(PROBE_KEY, '1');
    s.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function isItem(v: unknown): v is SavedItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['hash'] === 'string'
    && kindOf(o['hash']) !== null
    && (o['kind'] === 'p' || o['kind'] === 'a' || o['kind'] === 'c')
    && typeof o['title'] === 'string'
    && typeof o['savedAt'] === 'number'
    && Number.isFinite(o['savedAt']);
}

type ReadResult = { ok: true; store: Store } | { ok: false; reason: Reason };

/** Reading never writes and never throws. An unreadable store reads as empty
 *  and is left exactly as it was, so a transient reader bug cannot destroy a
 *  collection. */
function read(): ReadResult {
  const s = raw();
  if (!s) return { ok: false, reason: 'unavailable' };
  let text: string | null;
  try {
    text = s.getItem(SAVED_KEY);
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (text === null) return { ok: true, store: { sv: SV, items: [] } };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, reason: 'corrupt' };
  const o = parsed as Record<string, unknown>;
  if (typeof o['sv'] !== 'number' || !Array.isArray(o['items'])) return { ok: false, reason: 'corrupt' };
  // An older build must not truncate a newer schema it cannot understand.
  if (o['sv'] > SV) return { ok: false, reason: 'corrupt' };
  return { ok: true, store: { sv: SV, items: (o['items'] as unknown[]).filter(isItem) } };
}

/** Newest first. Any failure reads as an empty collection; the UI asks
 *  `readState()` when it needs to explain why. */
export function list(): SavedItem[] {
  const r = read();
  return r.ok ? [...r.store.items].sort((a, b) => b.savedAt - a.savedAt) : [];
}

/** Why `list()` is empty: 'ok' when it genuinely is. */
export function readState(): 'ok' | Reason {
  const r = read();
  return r.ok ? 'ok' : r.reason;
}

export function isSaved(hash: string): boolean {
  return list().some((i) => i.hash === hash);
}
