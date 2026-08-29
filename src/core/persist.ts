/**
 * Per-pattern "last state" memory in localStorage. Deliberately every access
 * is wrapped in try/catch: localStorage throws on read/write in Safari
 * private mode and some embedded/sandboxed contexts, and a persistence nice-
 * to-have must never break the app.
 */
const KEY = (id: string): string => `flowshape:last:${id}`;

export function rememberState(patternId: string, hash: string): void {
  try {
    globalThis.localStorage?.setItem(KEY(patternId), hash);
  } catch {
    // ignore — persistence is best-effort
  }
}

export function recallState(patternId: string): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY(patternId)) ?? null;
  } catch {
    return null;
  }
}

export function forgetState(patternId: string): void {
  try {
    globalThis.localStorage?.removeItem(KEY(patternId));
  } catch {
    // ignore — persistence is best-effort
  }
}
