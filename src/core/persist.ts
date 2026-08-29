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

/**
 * Collapsed/expanded memory for the playground's sidebar sections.
 *
 * Deliberately NOT part of AppState and never in the URL: a poster or animate
 * link has to stay a pure description of the artwork, and which panels a
 * visitor happened to leave folded is chrome, not artwork. Same best-effort
 * try/catch contract as the state helpers above.
 */
const SECTION_KEY = (id: string): string => `flowshape:section:${id}`;

export function rememberSection(sectionId: string, open: boolean): void {
  try {
    globalThis.localStorage?.setItem(SECTION_KEY(sectionId), open ? '1' : '0');
  } catch {
    // ignore — persistence is best-effort
  }
}

/** The remembered open/closed state, or null when the section has never been
 *  toggled (so the caller can fall back to its own default). */
export function recallSection(sectionId: string): boolean | null {
  try {
    const raw = globalThis.localStorage?.getItem(SECTION_KEY(sectionId));
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}
