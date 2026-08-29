import { decodeState } from '../core/url-state';
import { getPattern } from '../patterns/registry';
import { patternName, type Lang } from '../i18n';

/** The site's own name, used when a hash describes no creation. */
export const SITE_TITLE = 'flowshape.art';

/**
 * The name a favourite gets when it is saved: `Times-Table Chords · 71203`.
 * Taken from the existing bilingual pattern-name table, so titles are
 * translated with no new content. The title is a snapshot of the language in
 * force at save time — from then on it is the visitor's data and is never
 * re-translated, because a rename must survive a language switch.
 */
export function autoTitle(hash: string, lang: Lang): string {
  const state = decodeState(hash);
  if (!state) return SITE_TITLE;
  const name = patternName(state.patternId, lang);
  const def = getPattern(state.patternId);
  return def?.usesSeed === false ? name : `${name} · ${state.seed}`;
}
