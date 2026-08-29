import './style.css';
import './patterns/index';
import { mountPlayground } from './ui/playground';
import { mountGallery } from './ui/gallery';
import { mountAbout } from './ui/about';
import { decodeState } from './core/url-state';
import { LANG_EVENT } from './i18n';

const app = document.querySelector<HTMLDivElement>('#app')!;

// The router owns view lifecycle: it decides which view mounts and tears the
// previous one down (playground registers its own `hashchange` listener, so
// leaving it mounted while switching views would fight the router's own
// listener and re-render playground with default state on every navigation).
let cleanup: (() => void) | null = null;

function setView(name: 'gallery' | 'playground' | 'about'): void {
  app.classList.remove('view-gallery', 'view-playground', 'view-about');
  app.classList.add(`view-${name}`);
}

function route(): void {
  cleanup?.();
  cleanup = null;
  if (location.hash.startsWith('#/about')) {
    setView('about');
    mountAbout(app);
    return;
  }
  const state = decodeState(location.hash);
  if (state) {
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
