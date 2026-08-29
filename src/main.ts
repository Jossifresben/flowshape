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

function route(): void {
  cleanup?.();
  cleanup = null;
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

window.addEventListener('hashchange', route);
// Switching language rewrites the URL with replaceState (no hashchange), so
// the language event is what re-renders the current view.
window.addEventListener(LANG_EVENT, route);
route();
