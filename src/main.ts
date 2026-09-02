import './style.css';
import './patterns/index';
import { mountPlayground } from './ui/playground';
import { mountGallery } from './ui/gallery';
import { mountAnimate } from './ui/animate';
import { mountAbout } from './ui/about';
import { mountComposer } from './ui/poster';
import { mountSaved } from './ui/saved';
import { mountShowcase } from './ui/showcase';
import { decodeState } from './core/url-state';
import { LANG_EVENT } from './i18n';
import { initConsent, trackPageView } from './core/consent';
import { mountConsentBanner } from './ui/consent-banner';

const app = document.querySelector<HTMLDivElement>('#app')!;

// The router owns view lifecycle: it decides which view mounts and tears the
// previous one down (playground registers its own `hashchange` listener, so
// leaving it mounted while switching views would fight the router's own
// listener and re-render playground with default state on every navigation).
let cleanup: (() => void) | null = null;

// 'gallery' is the pattern grid at `#/` (module `ui/gallery.ts`); 'showcase'
// is the curated set at `#/gallery` (module `ui/showcase.ts`). Two different
// names on purpose — see `ui/showcase.ts`'s header comment.
function setView(
  name: 'gallery' | 'showcase' | 'playground' | 'about' | 'animate' | 'composer' | 'saved',
): void {
  app.classList.remove(
    'view-gallery', 'view-showcase', 'view-playground', 'view-about', 'view-animate', 'view-composer',
    'view-saved',
  );
  app.classList.add(`view-${name}`);
}

/** Hash navigation does not reset scroll, so arriving from a scrolled gallery
 *  keeps that offset in the next view. On mobile the playground and the stage
 *  put their control panel BELOW the artwork, so the preserved offset landed
 *  the reader at the bottom of the parameter list — the panel appeared to
 *  auto-scroll. Only reset when the route actually changes: a param edit
 *  rewrites the hash constantly, and yanking the panel to the top mid-drag
 *  would be far worse than the bug.
 *
 *  `routeKey` is the part before `?`, so `#/p/voxel?...` edits are one route. */
let lastRouteKey: string | null = null;

function route(): void {
  const routeKey = location.hash.split('?')[0] ?? '';
  if (lastRouteKey !== null && routeKey !== lastRouteKey) {
    window.scrollTo(0, 0);
    document.scrollingElement?.scrollTo(0, 0);
  }
  lastRouteKey = routeKey;
  cleanup?.();
  cleanup = null;
  // DEV-only spike stage for the unregistered `hopf` candidate. Rewrites to a
  // real animate hash so `mountAnimate` reads normal state; the import inside
  // `ui/hopf-spike` is what registers the pattern, and only in dev.
  // `#/dev/hopf` is only a convenience entry point: it redirects to a real
  // `#/a/hopf` hash and the ORDINARY animate route takes it from there. The
  // pattern is put in the registry by `registerSpikes()` at startup (DEV
  // only), not by this branch — an earlier version carried a `dev=hopf`
  // marker in the query instead, and `syncUrl` stripped it on the first
  // param write, so a refresh bounced to the gallery.
  if (import.meta.env.DEV && location.hash.startsWith('#/dev/hopf')) {
    location.replace('#/a/hopf?v=1&seed=1&stage=11');
    return;
  }
  if (import.meta.env.DEV && location.hash === '#/dev/fidelity') {
    void import('./ui/fidelity').then((m) => m.mountFidelity(app));
    return;
  }
  if (location.hash.startsWith('#/about')) {
    setView('about');
    mountAbout(app);
    return;
  }
  if (location.hash.startsWith('#/saved')) {
    setView('saved');
    cleanup = mountSaved(app);
    return;
  }
  // Matched before `decodeState`: that decoder only recognises `^#/(p|a|c)/…`,
  // so `#/gallery` decodes to null and would otherwise fall through to the
  // pattern grid below.
  if (location.hash.startsWith('#/gallery')) {
    setView('showcase');
    cleanup = mountShowcase(app);
    return;
  }
  const state = decodeState(location.hash);
  if (state && state.view === 'a') {
    setView('animate');
    cleanup = mountAnimate(app);
  } else if (state && state.view === 'c') {
    setView('composer');
    cleanup = mountComposer(app);
  } else if (state) {
    setView('playground');
    cleanup = mountPlayground(app);
  } else {
    setView('gallery');
    mountGallery(app);
  }
}

// A tab that stays open across a deploy holds a bundle whose dynamic imports
// name chunk hashes the new build no longer serves; the next lazy load then
// 404s. Vite surfaces exactly this as `vite:preloadError`. One reload fetches
// the current index.html and its live hashes. The sessionStorage latch stops
// a reload loop if the failure is something a reload cannot fix (offline,
// deploy actually broken) — in that case the modal's own error message takes
// over. The latch clears on the next successful load.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'flowshape:reloaded-for-preload-error';
  try {
    if (sessionStorage.getItem(KEY)) return; // second failure: give up, let UI errors show
    sessionStorage.setItem(KEY, '1');
  } catch { return; }
  event.preventDefault();
  location.reload();
});
try { sessionStorage.removeItem('flowshape:reloaded-for-preload-error'); } catch { /* fine */ }

window.addEventListener('hashchange', route);
// Switching language rewrites the URL with replaceState (no hashchange), so
// the language event is what re-renders the current view.
window.addEventListener(LANG_EVENT, route);

// DEV-only: spike patterns must be in the registry BEFORE the first route
// runs, or a cold load of `#/a/<spike>` finds no such pattern and bounces to
// the gallery — taking the hash with it, so a later re-route cannot recover
// it. Hence: await the registration, then route. Awaiting once at startup
// costs a microtask in dev and nothing at all in production, where
// `import.meta.env.DEV` is statically false and the branch is dropped.
if (import.meta.env.DEV) {
  void import('./ui/hopf-spike').then((m) => { m.registerSpikes(); route(); });
} else {
  route();
}

// Analytics, if and only if the visitor has already said yes; the banner asks
// the ones who have not. Routing is hash-based, so views are reported here
// rather than by gtag's own pageview, which would only ever see the first one.
initConsent();
mountConsentBanner();
window.addEventListener('hashchange', trackPageView);
