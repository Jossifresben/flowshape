import { toggle, isSaved, storageState } from '../core/saved';
import { autoTitle } from './saved-title';
import { t, type Lang } from '../i18n';

export interface FavouriteControl {
  el: HTMLButtonElement;
  /** Re-reads the store and repaints. Call after every hash change. */
  sync: () => void;
}

/**
 * The save toggle, shared by the playground, the animate stage and the poster
 * composer. It reads `getHash()` on every interaction rather than closing over
 * a hash, because the URL is rewritten on every control change.
 *
 * The star empties as soon as a slider moves, and that is correct: what was
 * saved is that exact variant, so an empty star is an accurate statement about
 * what is on screen now.
 *
 * Unlike core/persist.ts, failure is never silent here — this is the visitor's
 * own work, and a save that did not happen must say so.
 */
export function favouriteButton(lang: Lang, getHash: () => string): FavouriteControl {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn star';

  // Disabled only when storage genuinely does not work. A FULL store is not
  // that: reads still succeed, and switching the control off would strand the
  // visitor with no way to delete anything and make room.
  const available = storageState() !== 'unavailable';
  if (!available) {
    b.disabled = true;
    b.title = t('fav.unavailable', lang);
    b.setAttribute('aria-label', t('fav.unavailable', lang));
  }

  function paint(saved: boolean): void {
    b.classList.toggle('on', saved);
    b.setAttribute('aria-pressed', String(saved));
    b.textContent = saved ? '★' : '☆';
    if (available) {
      const label = t(saved ? 'fav.remove' : 'fav.save', lang);
      b.title = label;
      b.setAttribute('aria-label', label);
    }
  }

  function sync(): void {
    paint(available && isSaved(getHash()));
  }

  b.addEventListener('click', () => {
    const hash = getHash();
    const r = toggle(hash, autoTitle(hash, lang));
    if (!r.ok) {
      b.title = t(r.reason === 'quota' ? 'fav.quota' : 'fav.unavailable', lang);
      b.classList.add('failed');
      window.setTimeout(() => b.classList.remove('failed'), 2000);
      return;
    }
    sync();
  });

  sync();
  return { el: b, sync };
}
