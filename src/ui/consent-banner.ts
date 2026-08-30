import { t, currentLang, LANG_EVENT, type Lang } from '../i18n';
import { storedConsent, setConsent, type Consent } from '../core/consent';

/**
 * The analytics consent bar.
 *
 * It lives on `document.body` rather than inside `#app`, because the router
 * tears `#app` down on every navigation and a consent choice is not per-view.
 * That also means nothing re-renders it for us, so it listens for the language
 * event itself.
 *
 * Shown unprompted only to a visitor who has not chosen yet. After that it is
 * reachable from the footer on every page — withdrawing consent has to be as
 * easy as granting it, so the same control does both, and reopening it marks
 * the choice currently in force.
 */
let bar: HTMLElement | null = null;

function button(key: string, choice: Consent, lang: Lang): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'consent-btn';
  b.textContent = t(key, lang);
  // Reopened from the footer, the bar has to say what is in force now;
  // aria-pressed carries that to a screen reader as well as to the eye.
  b.setAttribute('aria-pressed', String(storedConsent() === choice));
  b.addEventListener('click', () => {
    setConsent(choice);
    close();
  });
  return b;
}

function render(): void {
  if (!bar) return;
  const lang = currentLang();
  bar.innerHTML = '';
  bar.setAttribute('aria-label', t('consent.label', lang));

  const body = document.createElement('p');
  body.className = 'consent-body';
  body.textContent = t('consent.body', lang);

  const actions = document.createElement('div');
  actions.className = 'consent-actions';
  // Decline sits first and is styled identically to Accept: refusing must not
  // be the harder or the quieter of the two options.
  actions.append(
    button('consent.decline', 'denied', lang),
    button('consent.accept', 'granted', lang),
  );

  bar.append(body, actions);
}

function close(): void {
  bar?.remove();
  bar = null;
}

/** Opens the bar whatever the stored choice is. The footer control calls this. */
export function openConsentBanner(): void {
  if (bar) return;
  bar = document.createElement('div');
  bar.className = 'consent';
  bar.setAttribute('role', 'dialog');
  render();
  document.body.append(bar);
}

/** Startup: ask only if the visitor has never answered. */
export function mountConsentBanner(): void {
  if (storedConsent() === null) openConsentBanner();
  window.addEventListener(LANG_EVENT, render);
}
