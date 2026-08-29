import { kindOf } from '../core/saved';
import { autoTitle, SITE_TITLE } from './saved-title';
import { t, type Lang } from '../i18n';
import { copyOrSelect } from './clipboard';

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

/**
 * The share control. One button, three fallbacks: the native sheet where it
 * exists (the whole point on mobile), the clipboard where it does not, and
 * selecting the text where even that is refused. `navigator.share` rejects
 * with AbortError when the visitor dismisses the sheet — that is a normal
 * outcome, not a failure, so it must not fall through to a copy.
 */
export function shareButton(lang: Lang): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'nav-share-wrap';

  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'nav-share';
  b.title = t('share.action', lang);
  b.setAttribute('aria-label', t('share.action', lang));
  // Inline SVG rather than a font or an image: one icon, no extra request.
  b.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3v12M12 3 8 7M12 3l4 4"/><path d="M5 12v7h14v-7"/></svg>';

  const label = document.createElement('span');
  label.className = 'nav-share-msg';
  label.setAttribute('role', 'status');
  b.append(label);

  // The select-text fallback needs a node that actually holds the URL — there
  // is no point selecting a button whose only text is an icon. This sits
  // beside the button, hidden, until that last fallback is reached.
  const fallback = document.createElement('span');
  fallback.className = 'nav-share-url';
  fallback.hidden = true;

  let resetTimer = 0;
  function flash(key: string): void {
    label.textContent = t(key, lang);
    b.classList.add('flashed');
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      label.textContent = '';
      fallback.hidden = true;
      fallback.textContent = '';
      b.classList.remove('flashed');
    }, 6000);
  }

  b.addEventListener('click', async () => {
    const target = shareTargetFor(location.href, lang);
    if (navigator.share) {
      try {
        await navigator.share({ title: target.title, text: target.title, url: target.url });
        return;
      } catch (e) {
        // A dismissed sheet is not a failure; anything else falls through.
        if ((e as { name?: string } | null)?.name === 'AbortError') return;
      }
    }
    fallback.textContent = target.url;
    fallback.hidden = false;
    const copied = await copyOrSelect(target.url, fallback);
    if (copied) { fallback.hidden = true; fallback.textContent = ''; }
    flash(copied ? 'share.copied' : 'share.selected');
  });

  wrap.append(b, fallback);
  return wrap;
}
