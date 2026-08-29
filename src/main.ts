import './style.css';
import './patterns/index';
import { mountPlayground } from './ui/playground';
import { mountGallery } from './ui/gallery';
import { mountAnimate } from './ui/animate';
import { decodeState } from './core/url-state';

const app = document.querySelector<HTMLDivElement>('#app')!;

// The router owns view lifecycle: it decides which view mounts and tears the
// previous one down (playground registers its own `hashchange` listener, so
// leaving it mounted while switching views would fight the router's own
// listener and re-render playground with default state on every navigation).
let cleanup: (() => void) | null = null;

function route(): void {
  cleanup?.();
  cleanup = null;
  const state = decodeState(location.hash);
  if (state && state.view === 'a') {
    app.classList.remove('view-gallery', 'view-playground');
    app.classList.add('view-animate');
    cleanup = mountAnimate(app);
  } else if (state) {
    app.classList.remove('view-gallery', 'view-animate');
    app.classList.add('view-playground');
    cleanup = mountPlayground(app);
  } else {
    app.classList.remove('view-playground', 'view-animate');
    app.classList.add('view-gallery');
    mountGallery(app);
  }
}

window.addEventListener('hashchange', route);
route();
