/**
 * Saved creations, in localStorage. A favourite is a saved URL hash: the hash
 * is already the complete, forward-compatible description of a design, poster
 * or animation (see docs/url-state.md), so nothing about the artwork is
 * duplicated here and nothing can drift out of sync with the generators.
 *
 * Reads degrade to an empty collection on any failure — corrupt JSON, a
 * schema this build doesn't understand, storage that isn't there at all —
 * and never throw. `readState()` is how a caller learns *why* `list()` came
 * back empty. Writes are a different matter: Task 2's mutations return
 * `Result` rather than swallowing a failure, because losing the visitor's own
 * saved work is not something to hide the way a remembered slider position
 * (core/persist.ts) can be.
 */

import { routeOf, type View } from './url-state';

/** Which view a hash belongs to: design · animation · poster. Same set as
 *  url-state's `View` — kept as its own name because a later task indexes a
 *  `Record<Kind, string>` lookup by it and "Kind" reads better there than
 *  "View" would. */
export type Kind = View;

/** Delegates to url-state's `routeOf`, the single source of truth for "is
 *  this a renderable creation URL" — kept as `kindOf` because that's what
 *  reads naturally at this module's call sites. */
export const kindOf = routeOf;

export interface SavedItem {
  /** The complete creation. Also the record's identity: unique by
   *  construction, and kind is derived from it with `kindOf` rather than
   *  stored — a stored kind could contradict its own hash. */
  hash: string;
  title: string;
  /** Epoch ms, for newest-first ordering. */
  savedAt: number;
}

export type Reason =
  | 'unavailable'
  | 'quota'
  | 'corrupt'
  /** A schema version newer than this build understands. The data is intact
   *  — just not something this build can read — so this must never be
   *  offered a destructive "reset saved data" recovery the way 'corrupt' is. */
  | 'future'
  | 'invalid'
  | 'missing';

export type Result<T> = { ok: true; value: T } | { ok: false; reason: Reason };

export const SAVED_KEY = 'flowshape:saved';
/** The store's schema version, independent of the URL schema's `v`. */
export const SV = 1;
/** Namespaced under SAVED_KEY so a later cross-tab `storage` listener can
 *  filter it out by prefix instead of waking every tab on every
 *  availability probe. */
export const PROBE_KEY = `${SAVED_KEY}:probe`;

const MAX_HASH_LEN = 4096;
const MAX_TITLE_LEN = 200;

interface Store { sv: number; items: SavedItem[] }

function raw(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing the property itself throws in some sandboxed contexts.
    return null;
  }
}

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException
    && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);
}

let probedFor: Storage | null = null;
let probedState: 'ok' | 'unavailable' | 'quota' = 'unavailable';

/** Whether writing can actually work here, distinguishing "no quota at all"
 *  (sandboxed contexts; also private-mode Safari, where reads work fine but
 *  every write throws QuotaExceededError) from "storage is full" (reads
 *  still work fine; the visitor needs the saved list open to delete
 *  something, not have the feature switched off under them). Memoized per
 *  Storage instance — except 'quota', which is re-probed every time so a
 *  visitor who frees space mid-session sees it clear. This probe write
 *  exists to catch private-mode Safari once per session, not to watch for
 *  ordinary quota exhaustion during real use — that's reported at write
 *  time by Task 2's `write()`. */
export function storageState(): 'ok' | 'unavailable' | 'quota' {
  const s = raw();
  if (!s) return 'unavailable';
  if (s === probedFor && probedState !== 'quota') return probedState;
  probedFor = s;
  try {
    s.setItem(PROBE_KEY, '1');
    s.removeItem(PROBE_KEY);
    probedState = 'ok';
  } catch (e) {
    // A throwing probe means either "full" or "no quota at all" — private-
    // mode Safari also throws QuotaExceededError. The store tells them
    // apart: if anything is already in it, writes worked once, so this one
    // means full.
    probedState = isQuotaError(e) && s.length > 0 ? 'quota' : 'unavailable';
  }
  return probedState;
}

/** Whether the feature can be offered at all. A full store is still
 *  available — only 'unavailable' turns it off. */
export function isAvailable(): boolean {
  return storageState() !== 'unavailable';
}

function isItem(v: unknown): v is SavedItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['hash'] === 'string'
    && o['hash'].length <= MAX_HASH_LEN
    && kindOf(o['hash']) !== null
    && typeof o['title'] === 'string'
    && o['title'].length <= MAX_TITLE_LEN
    && typeof o['savedAt'] === 'number'
    && Number.isFinite(o['savedAt']);
}

/** Collapses records that share a hash — the documented identity — keeping
 *  the one with the highest savedAt, and the first of equals (a rapid
 *  re-save via Date.now() can tie). Nothing upstream enforces uniqueness,
 *  and a later task's file import is the obvious way to produce a dup. */
function dedupeByHash(items: SavedItem[]): SavedItem[] {
  const byHash = new Map<string, SavedItem>();
  for (const item of items) {
    const existing = byHash.get(item.hash);
    if (!existing || item.savedAt > existing.savedAt) byHash.set(item.hash, item);
  }
  return [...byHash.values()];
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
  if (!Number.isInteger(o['sv']) || o['sv'] < 1) return { ok: false, reason: 'corrupt' };
  // An older build must not offer to destroy a newer, intact schema it
  // simply doesn't understand yet — that's 'future', never 'corrupt'.
  if (o['sv'] > SV) return { ok: false, reason: 'future' };
  const items = dedupeByHash((o['items'] as unknown[]).filter(isItem));
  return { ok: true, store: { sv: o['sv'], items } };
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

/** Goes around list()'s sort — membership doesn't care about order. Even the
 *  full list() (filter + sort) was measured at 0.236ms against a 200-item
 *  store — 1.4% of a frame budget, still noise beside the SVG regeneration
 *  the same hash change triggers — so there's nothing worth caching here. */
export function isSaved(hash: string): boolean {
  const r = read();
  return r.ok && r.store.items.some((i) => i.hash === hash);
}

function write(items: SavedItem[]): Result<void> {
  const s = raw();
  if (!s) return { ok: false, reason: 'unavailable' };
  try {
    s.setItem(SAVED_KEY, JSON.stringify({ sv: SV, items } satisfies Store));
    return { ok: true, value: undefined };
  } catch (e) {
    // Reuse the helper Task 1 already has — quota detection must not be
    // spelled two different ways in one module.
    return { ok: false, reason: isQuotaError(e) ? 'quota' : 'unavailable' };
  }
}

/**
 * Every mutation is read-modify-write: the module never caches the array
 * between calls, so a second tab's save cannot be clobbered by this one.
 */
function mutate(fn: (items: SavedItem[]) => Result<SavedItem[]>): Result<void> {
  const r = read();
  // A store we could not read is never overwritten. `reset()` is the only
  // way to discard one, so destruction is always the visitor's choice.
  if (!r.ok) return { ok: false, reason: r.reason };
  const next = fn(r.store.items);
  if (!next.ok) return next;
  return write(next.value);
}

/** Saves `hash` if it is not saved, removes it if it is. */
export function toggle(hash: string, title: string): Result<'saved' | 'removed'> {
  if (!kindOf(hash)) return { ok: false, reason: 'invalid' };
  const clean = title.trim();
  if (!clean) return { ok: false, reason: 'invalid' };
  let outcome: 'saved' | 'removed' = 'saved';
  const r = mutate((items) => {
    if (items.some((i) => i.hash === hash)) {
      outcome = 'removed';
      return { ok: true, value: items.filter((i) => i.hash !== hash) };
    }
    outcome = 'saved';
    return { ok: true, value: [...items, { hash, title: clean, savedAt: Date.now() }] };
  });
  return r.ok ? { ok: true, value: outcome } : r;
}

export function rename(hash: string, title: string): Result<void> {
  const clean = title.trim();
  if (!clean) return { ok: false, reason: 'invalid' };
  return mutate((items) => {
    if (!items.some((i) => i.hash === hash)) return { ok: false, reason: 'missing' };
    return { ok: true, value: items.map((i) => (i.hash === hash ? { ...i, title: clean } : i)) };
  });
}

export function remove(hash: string): Result<void> {
  return mutate((items) => {
    if (!items.some((i) => i.hash === hash)) return { ok: false, reason: 'missing' };
    return { ok: true, value: items.filter((i) => i.hash !== hash) };
  });
}

/** Discards everything, including a store too corrupt to read. The only
 *  destructive operation, and only ever reached through an explicit action.
 *
 *  It refuses one case: a store written by a NEWER version of the site. This
 *  build cannot read it, but a newer one can, and a visitor on a stale cached
 *  bundle must not be able to destroy work that is perfectly intact. */
export function reset(): Result<void> {
  const r = read();
  if (!r.ok && r.reason === 'future') return { ok: false, reason: 'future' };
  return write([]);
}
