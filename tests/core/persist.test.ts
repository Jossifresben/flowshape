import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rememberState, recallState, forgetState, rememberSection, recallSection } from '../../src/core/persist';

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

describe('persist', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  afterEach(() => {
    try {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } catch {
      // non-configurable in this environment — fall through to restore below
    }
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    }
  });

  describe('round-trip against a stubbed localStorage', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: makeStubStorage(),
      });
    });

    it('remembers, recalls, and forgets a pattern\'s last state', () => {
      expect(recallState('bands')).toBeNull();

      rememberState('bands', '#/p/bands?v=1&seed=1&hue=117');
      expect(recallState('bands')).toBe('#/p/bands?v=1&seed=1&hue=117');

      forgetState('bands');
      expect(recallState('bands')).toBeNull();
    });

    it('keeps separate patterns independent', () => {
      rememberState('bands', '#/p/bands?v=1&seed=1');
      rememberState('helix', '#/p/helix?v=1&seed=2');
      expect(recallState('bands')).toBe('#/p/bands?v=1&seed=1');
      expect(recallState('helix')).toBe('#/p/helix?v=1&seed=2');
    });

    it('overwrites a previously remembered state', () => {
      rememberState('bands', '#/p/bands?v=1&seed=1');
      rememberState('bands', '#/p/bands?v=1&seed=2');
      expect(recallState('bands')).toBe('#/p/bands?v=1&seed=2');
    });
  });

  describe('sidebar section memory', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: makeStubStorage(),
      });
    });

    it('returns null for a section that has never been toggled', () => {
      expect(recallSection('format')).toBeNull();
    });

    it('round-trips both open and closed', () => {
      rememberSection('format', true);
      expect(recallSection('format')).toBe(true);
      rememberSection('format', false);
      expect(recallSection('format')).toBe(false);
    });

    it('keeps sections independent of one another and of pattern state', () => {
      rememberSection('params', true);
      rememberSection('export', false);
      rememberState('bands', '#/p/bands?v=1&seed=1');
      expect(recallSection('params')).toBe(true);
      expect(recallSection('export')).toBe(false);
      expect(recallSection('bands')).toBeNull();
      expect(recallState('bands')).toBe('#/p/bands?v=1&seed=1');
    });

    it('treats an unrecognised stored value as no memory at all', () => {
      globalThis.localStorage.setItem('flowshape:section:format', 'yes');
      expect(recallSection('format')).toBeNull();
    });
  });

  describe('failure resilience', () => {
    it('recallState returns null rather than throwing when localStorage access throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get(): Storage {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });

      expect(() => recallState('bands')).not.toThrow();
      expect(recallState('bands')).toBeNull();
    });

    it('rememberState does not throw when localStorage access throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get(): Storage {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });

      expect(() => rememberState('bands', '#/p/bands?v=1&seed=1')).not.toThrow();
    });

    it('forgetState does not throw when localStorage access throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get(): Storage {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });

      expect(() => forgetState('bands')).not.toThrow();
    });

    it('recallSection returns null rather than throwing when localStorage access throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get(): Storage {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });

      expect(() => recallSection('format')).not.toThrow();
      expect(recallSection('format')).toBeNull();
    });

    it('rememberSection does not throw when localStorage access throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get(): Storage {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });

      expect(() => rememberSection('format', true)).not.toThrow();
    });

    it('rememberState does not throw when setItem itself throws (quota exceeded)', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          getItem: () => null,
          setItem: () => { throw new DOMException('QuotaExceededError'); },
          removeItem: () => {},
        },
      });

      expect(() => rememberState('bands', '#/p/bands?v=1&seed=1')).not.toThrow();
    });
  });
});
