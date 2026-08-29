import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { list, isSaved, kindOf, isAvailable, SAVED_KEY } from '../../src/core/saved';

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
      { hash: HASH_P, kind: 'p', title: 'older', savedAt: 100 },
      { hash: HASH_A, kind: 'a', title: 'newer', savedAt: 200 },
    ] }));
    expect(list().map((i) => i.title)).toEqual(['newer', 'older']);
  });

  it('reads unparseable JSON as empty and leaves the bad value untouched', () => {
    store.setItem(SAVED_KEY, '{not json');
    expect(list()).toEqual([]);
    expect(store.getItem(SAVED_KEY)).toBe('{not json');
  });

  it('reads a newer schema version as empty and leaves it untouched', () => {
    const future = JSON.stringify({ sv: 99, items: [{ hash: HASH_P, kind: 'p', title: 'x', savedAt: 1 }] });
    store.setItem(SAVED_KEY, future);
    expect(list()).toEqual([]);
    expect(store.getItem(SAVED_KEY)).toBe(future);
  });

  it('drops individual records that are not well formed', () => {
    store.setItem(SAVED_KEY, JSON.stringify({ sv: 1, items: [
      { hash: HASH_P, kind: 'p', title: 'good', savedAt: 1 },
      { hash: 42, kind: 'p', title: 'bad hash', savedAt: 2 },
      { hash: '#/p/x?v=1', kind: 'z', title: 'bad kind', savedAt: 3 },
      null,
    ] }));
    expect(list().map((i) => i.title)).toEqual(['good']);
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

  it('reports availability with a probe write', () => {
    expect(isAvailable()).toBe(true);
    install({ ...makeStubStorage(), setItem: () => { throw new Error('private mode'); } } as Storage);
    expect(isAvailable()).toBe(false);
  });
});
