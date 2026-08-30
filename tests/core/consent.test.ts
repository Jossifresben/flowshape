import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storedConsent, setConsent, routePath, GA_ID, CONSENT_EVENT } from '../../src/core/consent';

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

/** A storage that refuses everything, as Safari private mode does. */
function makeHostileStorage(): Storage {
  const throwing = (): never => { throw new Error('denied'); };
  return { getItem: throwing, setItem: throwing, removeItem: throwing, clear: throwing, key: throwing, length: 0 } as unknown as Storage;
}

describe('consent', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  function install(storage: Storage): void {
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  }

  beforeEach(() => {
    install(makeStubStorage());
    // The module writes these when a choice is made; start each test clean.
    (globalThis as Record<string, unknown>)[`ga-disable-${GA_ID}`] = undefined;
  });

  afterEach(() => {
    try {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } catch {
      // non-configurable in this environment — the restore below covers it
    }
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  });

  it('treats an undecided visitor as null, never as consent', () => {
    expect(storedConsent()).toBeNull();
  });

  it('round-trips both choices', () => {
    setConsent('granted');
    expect(storedConsent()).toBe('granted');
    setConsent('denied');
    expect(storedConsent()).toBe('denied');
  });

  it('rejects a stored value that is not a choice', () => {
    globalThis.localStorage.setItem('flowshape:consent', 'yes-please');
    expect(storedConsent()).toBeNull();
  });

  it('reports no consent when storage throws, rather than assuming', () => {
    install(makeHostileStorage());
    expect(storedConsent()).toBeNull();
    // And a choice made in that browser must not throw out of the app.
    expect(() => setConsent('denied')).not.toThrow();
  });

  it('sets the gtag kill switch when consent is withdrawn', () => {
    setConsent('denied');
    expect((globalThis as Record<string, unknown>)[`ga-disable-${GA_ID}`]).toBe(true);
  });

  it('announces a change so chrome can re-render', () => {
    // The runner's global is not an EventTarget; lend it one for this test.
    const hub = new EventTarget();
    for (const m of ['addEventListener', 'removeEventListener', 'dispatchEvent'] as const) {
      Object.defineProperty(globalThis, m, { value: hub[m].bind(hub), configurable: true });
    }
    let fired = 0;
    const onChange = (): void => { fired += 1; };
    globalThis.addEventListener(CONSENT_EVENT, onChange);
    setConsent('granted');
    setConsent('denied');
    globalThis.removeEventListener(CONSENT_EVENT, onChange);
    expect(fired).toBe(2);
  });

  describe('routePath', () => {
    // The reason this function exists: the hash query is the artwork itself,
    // so it must never travel to the analytics property.
    const at = (hash: string): string => routePath({ pathname: '/', hash });

    it('drops the design from a pattern URL', () => {
      expect(at('#/p/guilloche?v=1&seed=1&rings=31&twist=0.83')).toBe('/#/p/guilloche');
    });

    it('drops it for animate and composer routes too', () => {
      expect(at('#/a/mystery?v=1&seed=4&stage=11')).toBe('/#/a/mystery');
      expect(at('#/c/voronoi?v=1&seed=9&cway=8')).toBe('/#/c/voronoi');
    });

    it('leaves a plain route alone', () => {
      expect(at('#/about')).toBe('/#/about');
      expect(at('#/gallery')).toBe('/#/gallery');
    });

    it('never returns anything containing a parameter separator', () => {
      expect(at('#/p/curlicue?seed=3&curls=60')).not.toContain('?');
      expect(at('#/p/curlicue?seed=3&curls=60')).not.toContain('seed');
    });
  });
});
