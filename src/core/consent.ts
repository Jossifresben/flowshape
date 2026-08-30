/**
 * Analytics consent, and the Google Analytics loader it gates.
 *
 * The rule the rest of the app relies on: nothing Google-owned is fetched and
 * no analytics cookie is written until the visitor has actively chosen
 * `granted`. There is no "implied consent by continuing to browse" path and no
 * pre-selected option — under GDPR/ePrivacy an analytics cookie needs prior,
 * unambiguous opt-in, so the default for an undecided visitor is silence.
 *
 * `denied` is stored as deliberately as `granted`: it is what stops the banner
 * from asking again, and it is what a visitor who changes their mind lands
 * back on. Withdrawal has to be as easy as consent, so the footer carries the
 * same choice on every page and switching back to `denied` disables the
 * already-loaded tracker and drops the cookies it wrote.
 *
 * Every storage access is wrapped: localStorage throws in Safari private mode,
 * and a visitor whose browser refuses storage must still get the site — they
 * simply get asked again next visit, which is the privacy-safe failure.
 */
export type Consent = 'granted' | 'denied';

const STORAGE_KEY = 'flowshape:consent';

/** GA4 measurement ID. Traffic is only ever sent from the production host. */
export const GA_ID = 'G-70XKSPCMEP';

/** Fired on `window` after the choice changes, so chrome can re-render. */
export const CONSENT_EVENT = 'flowshape:consentchange';

function isConsent(v: string | null | undefined): v is Consent {
  return v === 'granted' || v === 'denied';
}

/** The stored choice, or null when the visitor has not decided yet. */
export function storedConsent(): Consent | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isConsent(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Records a choice and acts on it immediately: loading the tracker on
 * `granted`, and on `denied` disabling any tracker this page already loaded.
 */
export function setConsent(consent: Consent): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, consent);
  } catch {
    // A browser refusing storage still gets the choice honoured for this page.
  }
  if (consent === 'granted') loadAnalytics();
  else disableAnalytics();
  globalThis.dispatchEvent?.(new Event(CONSENT_EVENT));
}

// --- the tracker ----------------------------------------------------------

/** gtag's globals, reached through `globalThis` so the module also loads under
 *  the (window-less) test runner. In a browser this is `window`. */
type GaGlobal = typeof globalThis & {
  dataLayer?: unknown[];
  [key: `ga-disable-${string}`]: boolean | undefined;
};
const g = (): GaGlobal => globalThis as GaGlobal;

const DISABLE_KEY = `ga-disable-${GA_ID}` as const;

let loaded = false;

/** Analytics is production-only: a dev server must never pollute the property. */
function analyticsAllowed(): boolean {
  return import.meta.env.PROD && globalThis.location?.hostname === 'flowshape.art';
}

function gtag(...args: unknown[]): void {
  (g().dataLayer ??= []).push(args);
}

/**
 * Injects gtag.js. Called only from `setConsent('granted')` and from
 * `initConsent` for a visitor who already granted on an earlier visit.
 *
 * `send_page_view` is off because routing is hash-based: gtag's own automatic
 * pageview would fire once for the whole session and every later view would go
 * unrecorded, so the router reports them through `trackPageView` instead.
 */
function loadAnalytics(): void {
  if (loaded || !analyticsAllowed()) return;
  loaded = true;
  g()[DISABLE_KEY] = false;

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(tag);

  gtag('js', new Date());
  gtag('config', GA_ID, {
    send_page_view: false,
    // Nothing here feeds advertising: this property exists to count visits,
    // and the consent asked for at the banner is scoped to exactly that.
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  trackPageView();
}

/**
 * Turns off a tracker that is already on the page. `ga-disable-<id>` is
 * gtag's documented kill switch and takes effect without a reload; the
 * cookies it wrote are cleared separately, since withdrawing consent has to
 * remove what the consent allowed rather than merely stop adding to it.
 */
function disableAnalytics(): void {
  g()[DISABLE_KEY] = true;
  clearAnalyticsCookies();
}

function clearAnalyticsCookies(): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0]?.trim())
    .filter((n): n is string => !!n && n.startsWith('_ga'));
  const host = location.hostname;
  const domains = ['', `; domain=${host}`, `; domain=.${host}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
  }
}

/**
 * The route, with the design dropped.
 *
 * This matters more here than in most apps: on flowshape the query half of the
 * hash *is* the artwork — every parameter, the seed and the colour — so
 * reporting a raw URL would hand the visitor's work to Google as the price of
 * counting the visit. `#/p/guilloche?seed=1&rings=31&…` is therefore reported
 * as `#/p/guilloche`. It is also the more useful number: views aggregate per
 * pattern instead of scattering across endlessly unique URLs.
 */
export function routePath(loc: { pathname: string; hash: string } = location): string {
  return loc.pathname + (loc.hash.split('?')[0] ?? '');
}

/**
 * Reports the current view. A no-op until consent is granted, so the router
 * can call it on every navigation without knowing anything about consent.
 */
export function trackPageView(): void {
  if (!loaded || g()[DISABLE_KEY]) return;
  const path = routePath();
  gtag('event', 'page_view', {
    page_path: path,
    page_location: location.origin + path,
    page_title: document.title,
  });
}

/** Re-arms a returning visitor's earlier `granted`. Called once at startup. */
export function initConsent(): void {
  if (storedConsent() === 'granted') loadAnalytics();
}
