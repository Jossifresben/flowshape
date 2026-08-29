import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  list, isSaved, kindOf, isAvailable, storageState, readState, SAVED_KEY, PROBE_KEY,
  toggle, rename, remove, reset, exportJSON, importJSON, MAX_HASH_LEN, MAX_TITLE_LEN, type SavedItem,
} from '../../src/core/saved';

/** Minimal in-memory stand-in for the Storage interface. */
function makeStubStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
    clear: () => { map.clear(); },
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  } as Storage;
}

function install(s: Storage | undefined): void {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: s });
}

const HASH_P = '#/p/timestable?v=1&seed=71203&points=300';
const HASH_A = '#/a/voronoi?v=1&seed=9&stage=916';
const HASH_C = '#/c/girih?v=1&seed=4&sk=3';
/** A hash decodeState rejects outright: an incomplete percent-escape in the
 *  pattern id makes decodeURIComponent throw. */
const HASH_MALFORMED = '#/p/%E0%A4%A?v=1';

describe('saved — kind derivation', () => {
  it('reads the route letter from a hash', () => {
    expect(kindOf(HASH_P)).toBe('p');
    expect(kindOf(HASH_A)).toBe('a');
    expect(kindOf(HASH_C)).toBe('c');
  });

  it('rejects anything that is not a creation hash', () => {
    expect(kindOf('#/saved')).toBeNull();
    expect(kindOf('#/about')).toBeNull();
    expect(kindOf('#/x/timestable?v=1')).toBeNull();
    expect(kindOf('')).toBeNull();
  });
});

describe('saved — read path', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  afterEach(() => {
    try { delete (globalThis as { localStorage?: unknown }).localStorage; } catch { /* non-configurable */ }
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
  });

  let store: Storage;
  beforeEach(() => { store = makeStubStorage(); install(store); });

  it('is empty before anything is saved', () => {
    expect(list()).toEqual([]);
    expect(isSaved(HASH_P)).toBe(false);
  });

  it('returns items newest first regardless of stored order', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'older', savedAt: 100 },
      { hash: HASH_A, title: 'newer', savedAt: 200 },
    ] }));
    expect(list().map((i) => i.title)).toEqual(['newer', 'older']);
  });

  it('reads unparseable JSON as empty and leaves the bad value untouched', () => {
    store.setItem(SAVED_KEY, '{not json');
    expect(list()).toEqual([]);
    expect(store.getItem(SAVED_KEY)).toBe('{not json');
  });

  it('reads a newer schema version as empty and leaves it untouched', () => {
    const future = JSON.stringify({ sv: 99, items: [{ hash: HASH_P, title: 'x', savedAt: 1 }] });
    store.setItem(SAVED_KEY, future);
    expect(list()).toEqual([]);
    expect(store.getItem(SAVED_KEY)).toBe(future);
  });

  it('drops individual records that are not well formed', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'good', savedAt: 1 },
      { hash: 42, title: 'hash is not a string', savedAt: 2 },
      { hash: '#/z/x?v=1', title: 'bad route letter', savedAt: 3 },
      { hash: HASH_MALFORMED, title: 'malformed percent-escape', savedAt: 4 },
      { hash: HASH_A, title: 'no savedAt' },
      // 1e999 parses out of JSON as Infinity — an unguarded record here
      // would pin itself to the top of every sort forever.
      { hash: HASH_C, title: 'infinite', savedAt: 1e999 },
      null,
    ] }));
    expect(list().map((i) => i.title)).toEqual(['good']);
  });

  it('drops a record with an over-long title or hash', () => {
    const longTitle = 'x'.repeat(201);
    const longHash = `#/p/${'y'.repeat(4100)}?v=1`;
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'good', savedAt: 1 },
      { hash: HASH_A, title: longTitle, savedAt: 2 },
      { hash: longHash, title: 'also bad', savedAt: 3 },
    ] }));
    expect(list().map((i) => i.title)).toEqual(['good']);
  });

  it('collapses duplicate hashes, keeping the one with the highest savedAt', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'stale', savedAt: 100 },
      { hash: HASH_P, title: 'fresh', savedAt: 200 },
    ] }));
    const items = list();
    expect(items.length).toBe(1);
    expect(items[0]!.title).toBe('fresh');
    expect(items[0]!.savedAt).toBe(200);
  });

  it.each([0, -7, 0.5])('rejects sv: %s as corrupt', (sv) => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv, items: [] }));
    expect(list()).toEqual([]);
    expect(readState()).toBe('corrupt');
  });

  it('reads as empty when localStorage is absent', () => {
    install(undefined);
    expect(list()).toEqual([]);
    expect(isAvailable()).toBe(false);
  });

  it('reads as empty when localStorage throws on read', () => {
    install({ ...makeStubStorage(), getItem: () => { throw new Error('denied'); } } as Storage);
    expect(list()).toEqual([]);
  });

  it('treats a localStorage property access that itself throws as unavailable', () => {
    // Distinct from getItem throwing: here the `localStorage` getter throws
    // before any method on it is even reached.
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get(): Storage { throw new Error('SecurityError'); },
    });
    expect(list()).toEqual([]);
    expect(isAvailable()).toBe(false);
  });

  it('reports availability with a probe write', () => {
    expect(isAvailable()).toBe(true);
    install({ ...makeStubStorage(), setItem: () => { throw new Error('private mode'); } } as Storage);
    expect(isAvailable()).toBe(false);
  });

  it('performs no writes at all while reading', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [{ hash: HASH_P, title: 'x', savedAt: 1 }] }));
    const calls: string[] = [];
    const tracked: Storage = {
      ...store,
      setItem: (k: string, v: string) => { calls.push(`set:${k}`); store.setItem(k, v); },
      removeItem: (k: string) => { calls.push(`remove:${k}`); store.removeItem(k); },
    } as Storage;
    install(tracked);

    list();
    isSaved(HASH_P);
    readState();

    expect(calls).toEqual([]);
  });

  describe('readState()', () => {
    it('reports corrupt for unparseable JSON', () => {
      store.setItem(SAVED_KEY, '{not json');
      expect(readState()).toBe('corrupt');
    });

    it('reports future for a schema version newer than this build understands', () => {
      store.setItem(SAVED_KEY, JSON.stringify({ sv: 99, items: [] }));
      expect(readState()).toBe('future');
    });

    it('reports unavailable when storage is absent', () => {
      install(undefined);
      expect(readState()).toBe('unavailable');
    });

    it('reports ok when there is nothing wrong', () => {
      expect(readState()).toBe('ok');
    });
  });

  describe('storageState()', () => {
    it('reports quota when the store is full, while reads keep working', () => {
      store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [{ hash: HASH_P, title: 'kept', savedAt: 1 }] }));
      install({
        ...store,
        setItem: () => { throw new DOMException('quota exceeded', 'QuotaExceededError'); },
      } as Storage);

      expect(storageState()).toBe('quota');
      expect(isAvailable()).toBe(true);
      expect(list().map((i) => i.title)).toEqual(['kept']);
    });

    it('treats a throwing probe on an EMPTY store as unavailable, not quota', () => {
      // Private-mode Safari also throws QuotaExceededError on every write,
      // but an empty store means no write has ever succeeded here — that's
      // "no quota at all", not "full", and the feature must not be offered.
      install({
        ...makeStubStorage(),
        setItem: () => { throw new DOMException('quota exceeded', 'QuotaExceededError'); },
      } as Storage);

      expect(storageState()).toBe('unavailable');
      expect(isAvailable()).toBe(false);
    });

    it('treats a throwing probe on a NON-EMPTY store as quota, not unavailable', () => {
      store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [{ hash: HASH_P, title: 'kept', savedAt: 1 }] }));
      install({
        ...store,
        setItem: () => { throw new DOMException('quota exceeded', 'QuotaExceededError'); },
      } as Storage);

      expect(storageState()).toBe('quota');
    });

    it('re-probes after quota and clears once space frees up (quota is never cached)', () => {
      store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [{ hash: HASH_P, title: 'kept', savedAt: 1 }] }));
      let full = true;
      const tracked: Storage = {
        ...store,
        setItem: (k: string, v: string) => {
          if (full) throw new DOMException('quota exceeded', 'QuotaExceededError');
          store.setItem(k, v);
        },
      } as Storage;
      install(tracked);

      expect(storageState()).toBe('quota');
      full = false; // the visitor deleted enough favourites to make room
      expect(storageState()).toBe('ok');
    });

    it('memoizes the probe: two isAvailable() calls make exactly one setItem/removeItem pair', () => {
      const calls: string[] = [];
      const tracked: Storage = {
        ...store,
        setItem: (k: string, v: string) => { calls.push(`set:${k}`); store.setItem(k, v); },
        removeItem: (k: string) => { calls.push(`remove:${k}`); store.removeItem(k); },
      } as Storage;
      install(tracked);

      isAvailable();
      isAvailable();

      expect(calls).toEqual([`set:${PROBE_KEY}`, `remove:${PROBE_KEY}`]);
    });
  });
});

describe('saved — mutations', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  afterEach(() => {
    vi.useRealTimers();
    try { delete (globalThis as { localStorage?: unknown }).localStorage; } catch { /* non-configurable */ }
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
  });

  let store: Storage;
  beforeEach(() => {
    store = makeStubStorage();
    install(store);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z'));
  });

  it('saves, and reports which way the toggle went', () => {
    const r = toggle(HASH_P, 'Times Table · 71203');
    expect(r).toEqual({ ok: true, value: 'saved' });
    expect(isSaved(HASH_P)).toBe(true);
    expect(list()[0]).toEqual({
      hash: HASH_P, title: 'Times Table · 71203',
      savedAt: new Date('2026-08-29T12:00:00Z').getTime(),
    });
  });

  it('toggling the same hash again removes it', () => {
    toggle(HASH_P, 'a');
    expect(toggle(HASH_P, 'a')).toEqual({ ok: true, value: 'removed' });
    expect(list()).toEqual([]);
  });

  it('never creates a duplicate', () => {
    toggle(HASH_P, 'a');
    toggle(HASH_P, 'a');
    toggle(HASH_P, 'b');
    expect(list()).toHaveLength(1);
  });

  it('accepts all three kinds of creation', () => {
    toggle(HASH_P, 'p'); toggle(HASH_A, 'a'); toggle(HASH_C, 'c');
    expect(list().map((i) => kindOf(i.hash)).sort()).toEqual(['a', 'c', 'p']);
  });

  it('refuses a hash that is not a creation', () => {
    expect(toggle('#/saved', 'x')).toEqual({ ok: false, reason: 'invalid' });
    expect(toggle('#/about', 'x')).toEqual({ ok: false, reason: 'invalid' });
    expect(list()).toEqual([]);
  });

  it('renames without changing the hash or the save time', () => {
    toggle(HASH_P, 'before');
    expect(rename(HASH_P, 'after')).toEqual({ ok: true, value: undefined });
    expect(list()[0]!.title).toBe('after');
    expect(list()[0]!.hash).toBe(HASH_P);
    expect(list()[0]!.savedAt).toBe(new Date('2026-08-29T12:00:00Z').getTime());
  });

  it('trims a rename and refuses a blank one', () => {
    toggle(HASH_P, 'before');
    expect(rename(HASH_P, '  after  ')).toEqual({ ok: true, value: undefined });
    expect(list()[0]!.title).toBe('after');
    expect(rename(HASH_P, '   ')).toEqual({ ok: false, reason: 'invalid' });
    expect(list()[0]!.title).toBe('after');
  });

  it('rejects an over-long rename and leaves the existing record unchanged', () => {
    toggle(HASH_P, 'before');
    const tooLong = 'x'.repeat(MAX_TITLE_LEN + 1);
    expect(rename(HASH_P, tooLong)).toEqual({ ok: false, reason: 'invalid' });
    // The return value alone would not have caught a write that silently
    // succeeded and then vanished on the next read.
    expect(list()[0]!.title).toBe('before');
  });

  it('rejects an over-long title on toggle and saves nothing', () => {
    const tooLong = 'x'.repeat(MAX_TITLE_LEN + 1);
    expect(toggle(HASH_P, tooLong)).toEqual({ ok: false, reason: 'invalid' });
    expect(list()).toEqual([]);
  });

  it('rejects an over-long hash on toggle and saves nothing', () => {
    const tooLongHash = `#/p/${'y'.repeat(MAX_HASH_LEN)}?v=1`;
    expect(toggle(tooLongHash, 'x')).toEqual({ ok: false, reason: 'invalid' });
    expect(list()).toEqual([]);
  });

  it('accepts a title of exactly the maximum length and it survives a round-trip', () => {
    const boundary = 'x'.repeat(MAX_TITLE_LEN);
    expect(toggle(HASH_P, boundary)).toEqual({ ok: true, value: 'saved' });
    expect(list()[0]!.title).toBe(boundary);
  });

  it('reports a rename or removal of something not saved', () => {
    expect(rename(HASH_P, 'x')).toEqual({ ok: false, reason: 'missing' });
    expect(remove(HASH_P)).toEqual({ ok: false, reason: 'missing' });
  });

  it('removes only the targeted record', () => {
    toggle(HASH_P, 'p'); toggle(HASH_A, 'a');
    expect(remove(HASH_P)).toEqual({ ok: true, value: undefined });
    expect(list().map((i) => i.hash)).toEqual([HASH_A]);
  });

  it('does not lose a write made behind its back', () => {
    toggle(HASH_P, 'p');
    // A second tab saves directly into storage between our calls.
    const outside = JSON.parse(store.getItem(SAVED_KEY)!) as { sv: number; items: SavedItem[] };
    outside.items.push({ hash: HASH_C, title: 'other tab', savedAt: 1 });
    store.setItem(SAVED_KEY, JSON.stringify(outside));
    toggle(HASH_A, 'a');
    expect(list().map((i) => i.hash).sort()).toEqual([HASH_A, HASH_C, HASH_P].sort());
  });

  it('reports quota exhaustion without changing anything', () => {
    // A real DOMException: the duck-typed fallback was removed in Task 1.
    install({ ...makeStubStorage(), setItem: () => {
      throw new DOMException('full', 'QuotaExceededError');
    } } as Storage);
    expect(toggle(HASH_P, 'x')).toEqual({ ok: false, reason: 'quota' });
  });

  it('lets a failed write correct a stale ok probe', () => {
    let quotaExceeded = false;
    const tracked: Storage = {
      ...store,
      setItem: (k: string, v: string) => {
        if (quotaExceeded) throw new DOMException('full', 'QuotaExceededError');
        store.setItem(k, v);
      },
      // A spread copies the getter's *current* value, not a live binding —
      // redeclare it so `.length` still reflects `store` after later writes.
      get length() { return store.length; },
    } as Storage;
    install(tracked);

    toggle(HASH_A, 'seed'); // something already saved, so a later throw reads as "full"
    expect(storageState()).toBe('ok'); // probes now, caches 'ok' against `tracked`

    quotaExceeded = true;
    expect(toggle(HASH_P, 'x')).toEqual({ ok: false, reason: 'quota' });
    // Must not return the stale cached 'ok' — the failed write should have
    // dropped the memo so this re-probes.
    expect(storageState()).toBe('quota');
  });

  it('reports unavailable storage without changing anything', () => {
    install(undefined);
    expect(toggle(HASH_P, 'x')).toEqual({ ok: false, reason: 'unavailable' });
    expect(rename(HASH_P, 'x')).toEqual({ ok: false, reason: 'unavailable' });
    expect(remove(HASH_P)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('refuses to write over a corrupt store', () => {
    store.setItem(SAVED_KEY, '{not json');
    expect(toggle(HASH_P, 'x')).toEqual({ ok: false, reason: 'corrupt' });
    expect(store.getItem(SAVED_KEY)).toBe('{not json');
  });

  it('reset is the only thing that discards a corrupt store', () => {
    store.setItem(SAVED_KEY, '{not json');
    expect(reset()).toEqual({ ok: true, value: undefined });
    expect(readState()).toBe('ok');
    expect(list()).toEqual([]);
    expect(toggle(HASH_P, 'x')).toEqual({ ok: true, value: 'saved' });
  });

  it('refuses to reset a store written by a newer version of the site', () => {
    const future = JSON.stringify({ sv: 99, items: [] });
    store.setItem(SAVED_KEY, future);
    expect(reset()).toEqual({ ok: false, reason: 'future' });
    expect(store.getItem(SAVED_KEY)).toBe(future);
  });
});

describe('saved — export and import', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  afterEach(() => {
    try { delete (globalThis as { localStorage?: unknown }).localStorage; } catch { /* non-configurable */ }
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
  });

  let store: Storage;
  beforeEach(() => { store = makeStubStorage(); install(store); });

  it('round-trips through export and import', () => {
    toggle(HASH_P, 'one');
    toggle(HASH_A, 'two');
    const exported = exportJSON();
    expect(exported.ok).toBe(true);
    const text = exported.ok ? exported.value : '';
    reset();
    expect(list()).toEqual([]);
    expect(importJSON(text)).toEqual({ ok: true, value: { added: 2, skipped: 0 } });
    expect(list().map((i) => i.title).sort()).toEqual(['one', 'two']);
  });

  it('exports a readable, versioned document', () => {
    toggle(HASH_P, 'one');
    const exported = exportJSON();
    expect(exported.ok).toBe(true);
    const parsed = JSON.parse(exported.ok ? exported.value : '') as { sv: number; items: unknown[] };
    expect(parsed.sv).toBe(1);
    expect(parsed.items).toHaveLength(1);
  });

  it('refuses to export a corrupt store', () => {
    store.setItem(SAVED_KEY, '{not json');
    expect(exportJSON()).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('refuses to export a store written by a newer version of the site', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 99, items: [] }));
    expect(exportJSON()).toEqual({ ok: false, reason: 'future' });
  });

  it('merges rather than replaces, and skips duplicates by hash', () => {
    toggle(HASH_P, 'mine');
    const incoming = JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'theirs', savedAt: 1 },
      { hash: HASH_A, title: 'new', savedAt: 2 },
    ] });
    expect(importJSON(incoming)).toEqual({ ok: true, value: { added: 1, skipped: 1 } });
    expect(list()).toHaveLength(2);
    // An existing record wins: import never overwrites what is already here.
    expect(list().find((i) => i.hash === HASH_P)!.title).toBe('mine');
  });

  it('never deletes', () => {
    toggle(HASH_P, 'mine');
    expect(importJSON(JSON.stringify({ sv: 1, items: [] }))).toEqual({ ok: true, value: { added: 0, skipped: 0 } });
    expect(list()).toHaveLength(1);
  });

  it('rejects a file that is not a favourites document', () => {
    expect(importJSON('{not json')).toEqual({ ok: false, reason: 'invalid' });
    expect(importJSON('[]')).toEqual({ ok: false, reason: 'invalid' });
    expect(importJSON(JSON.stringify({ items: [] }))).toEqual({ ok: false, reason: 'invalid' });
    // An unknown lower sv is genuinely invalid...
    expect(importJSON(JSON.stringify({ sv: 0, items: [] }))).toEqual({ ok: false, reason: 'invalid' });
  });

  it('distinguishes a file from a newer build as future, not invalid', () => {
    // ...while a higher sv is a valid file this build just can't read yet —
    // telling the visitor to reload beats telling them the file is broken.
    expect(importJSON(JSON.stringify({ sv: 99, items: [] }))).toEqual({ ok: false, reason: 'future' });
  });

  it('drops malformed records inside an otherwise valid file', () => {
    const incoming = JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, title: 'good', savedAt: 1 },
      { hash: 'not-a-hash', title: 'bad', savedAt: 2 },
    ] });
    expect(importJSON(incoming)).toEqual({ ok: true, value: { added: 1, skipped: 1 } });
  });
});
