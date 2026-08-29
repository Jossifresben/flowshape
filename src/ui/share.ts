import { kindOf } from '../core/saved';
import { autoTitle, SITE_TITLE } from './saved-title';
import type { Lang } from '../i18n';

export interface ShareTarget {
  /** What the native sheet shows as the item's name. */
  title: string;
  /** The URL handed out, verbatim — the fragment is the whole creation. */
  url: string;
}

/**
 * What the share control hands out from a given page. On a creation route the
 * artwork is the subject; everywhere else — gallery, about, saved — the site
 * is. The saved page shares the site deliberately: favourites are local, so
 * there is nothing at that URL for anyone else to see.
 */
export function shareTargetFor(href: string, lang: Lang): ShareTarget {
  const at = href.indexOf('#');
  const hash = at === -1 ? '' : href.slice(at);
  return { title: kindOf(hash) ? autoTitle(hash, lang) : SITE_TITLE, url: href };
}
