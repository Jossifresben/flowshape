import { list, readState, reset } from '../core/saved';
import { currentLang, t, type Lang } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';

/** Mounts the saved page. Returns a teardown, because this view registers a
 *  `storage` listener and an IntersectionObserver that must not outlive it. */
export function mountSaved(root: HTMLElement): () => void {
  const lang = currentLang();
  root.innerHTML = '';
  document.documentElement.lang = lang;

  const head = document.createElement('div');
  head.className = 'saved-head';
  const heading = document.createElement('h1');
  heading.className = 'saved-title';
  heading.textContent = t('saved.title', lang);
  const count = document.createElement('span');
  count.className = 'saved-count';
  head.append(heading, count);

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  const notice = document.createElement('div');
  notice.className = 'saved-notice';

  // `readState()` reports only what READING found, so 'quota' cannot appear
  // here — a full store still reads fine. Quota is reported by the star, from
  // the failed write's own Result.
  const NOTICE_KEY: Record<string, string> = {
    corrupt: 'saved.corrupt', future: 'saved.future',
  };

  function renderNotice(): void {
    notice.innerHTML = '';
    const state = readState();
    if (state === 'ok') return;
    const p = document.createElement('p');
    p.textContent = t(NOTICE_KEY[state] ?? 'fav.unavailable', lang);
    notice.append(p);
    // Only a store this build cannot parse gets the destructive recovery. A
    // 'future' store is intact and readable by a newer bundle — offering a
    // reset there would let a stale cache destroy perfectly good work.
    if (state !== 'corrupt') return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = t('saved.reset', lang);
    // The only destructive operation in the feature, and only ever reached
    // through this explicit choice — nothing else discards an unreadable store.
    btn.addEventListener('click', () => { reset(); render(); });
    notice.append(btn);
  }

  function renderEmpty(): void {
    const wrap = document.createElement('div');
    wrap.className = 'saved-empty';
    const p = document.createElement('p');
    p.textContent = t('saved.empty', lang);
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = '#/';
    a.textContent = t('saved.emptyCta', lang);
    wrap.append(p, a);
    grid.append(wrap);
  }

  function render(): void {
    const items = list();
    count.textContent = `${items.length} ${t('saved.count', lang)}`;
    grid.innerHTML = '';
    renderNotice();
    if (items.length === 0) { renderEmpty(); return; }
    for (const item of items) grid.append(buildCard(item, lang, render));
  }

  render();
  root.append(buildNav(lang, 'saved'), head, notice, grid, buildFooter(lang));

  return () => { /* listeners are added in a later task */ };
}

/** Placeholder until Task 12 gives cards their thumbnail. */
function buildCard(item: { hash: string; title: string }, _lang: Lang, _refresh: () => void): HTMLElement {
  const card = document.createElement('a');
  card.className = 'gal-card';
  card.href = item.hash;
  card.textContent = item.title;
  return card;
}
