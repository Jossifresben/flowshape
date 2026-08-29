import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { list, isSaved, kindOf, isAvailable, storageState, readState, SAVED_KEY, PROBE_KEY } from '../../src/core/saved';

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
        setItem: () => {
          const e = new Error('quota exceeded');
          (e as { name?: string }).name = 'QuotaExceededError';
          throw e;
        },
      } as Storage);

      expect(storageState()).toBe('quota');
      expect(isAvailable()).toBe(true);
      expect(list().map((i) => i.title)).toEqual(['kept']);
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
