import { list, readState, reset, rename, remove, importJSON, exportJSON, SAVED_KEY, SV } from '../core/saved';
import { currentLang, t, type Lang } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';
import { showToast } from './toast';
// `kind` is derived from the hash, never stored — a stored copy could contradict it.
import { kindOf, type SavedItem, type Kind } from '../core/saved';
import { renderThumb, onVisible, stopThumbWorker } from './thumb';

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

  const tools = document.createElement('div');
  tools.className = 'saved-tools';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'btn';
  exportBtn.textContent = t('saved.export', lang);
  exportBtn.addEventListener('click', () => {
    const doc = exportJSON();
    // Refuses on an unreadable store rather than handing over an empty file
    // that looks like a valid backup. The visitor might then hit Reset —
    // which is offered on exactly that state — and lose everything.
    if (!doc.ok) { showToast(t('saved.exportFailed', lang)); return; }
    const blob = new Blob([doc.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowshape-favourites.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.hidden = true;
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';           // so re-picking the same file fires again
    if (!file) return;
    const r = importJSON(await file.text());
    if (!r.ok) {
      showToast(t(r.reason === 'future' ? 'saved.importFuture' : 'saved.importFailed', lang));
      return;
    }
    render();
    showToast(
      t('saved.imported', lang)
        .replace('{added}', String(r.value.added))
        .replace('{skipped}', String(r.value.skipped)),
    );
  });

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'btn';
  importBtn.textContent = t('saved.import', lang);
  importBtn.addEventListener('click', () => importInput.click());

  tools.append(exportBtn, importBtn, importInput);
  head.append(tools);

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  const notice = document.createElement('div');
  notice.className = 'saved-notice';

  let observer = new IntersectionObserver(onVisible, { rootMargin: '200px' });

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
    count.textContent = `${items.length} ${t(items.length === 1 ? 'saved.countOne' : 'saved.count', lang)}`;
    observer.disconnect();
    observer = new IntersectionObserver(onVisible, { rootMargin: '200px' });
    grid.innerHTML = '';
    renderNotice();
    if (items.length === 0) { renderEmpty(); return; }
    for (const item of items) grid.append(buildCard(item, lang, observer, render));
  }

  render();
  root.append(buildNav(lang, 'saved'), head, notice, grid, buildFooter(lang));

  // Another tab saving or deleting must be reflected here. `storage` fires
  // only in the tabs that did not make the change, which is exactly right.
  const onStorage = (e: StorageEvent): void => {
    if (e.key === null || e.key === SAVED_KEY) render();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    observer.disconnect();
    stopThumbWorker();
  };
}

const KIND_KEY: Record<Kind, string> = {
  p: 'saved.kindP', a: 'saved.kindA', c: 'saved.kindC',
};

function buildCard(item: SavedItem, lang: Lang, observer: IntersectionObserver, refresh: () => void): HTMLElement {
  const card = document.createElement('div');
  card.className = 'gal-card saved-card';

  const link = document.createElement('a');
  link.className = 'saved-link';
  link.href = item.hash;

  const box = document.createElement('div');
  box.className = 'gal-thumb saved-thumb';
  // Rendering is deferred to the observer: a card off screen costs nothing,
  // and a saved card costs exactly what its playground render cost.
  (box as HTMLElement & { render?: () => void }).render = () => renderThumb(box, item.hash, lang);
  observer.observe(box);

  const meta = document.createElement('div');
  meta.className = 'gal-meta saved-meta';

  const name = document.createElement('span');
  name.className = 'gal-name saved-name';
  name.textContent = item.title;
  name.tabIndex = 0;
  name.setAttribute('role', 'button');
  name.title = t('saved.rename', lang);

  function beginRename(): void {
    const input = document.createElement('input');
    input.className = 'saved-rename';
    input.value = item.title;
    // Defence in depth: the store rejects an over-long title outright, so
    // stopping it here means the visitor never types into a dead end.
    input.maxLength = 200;
    input.setAttribute('aria-label', t('saved.rename', lang));
    let settled = false;
    const commit = (keep: boolean): void => {
      if (settled) return;
      settled = true;
      // A blank name reverts rather than storing an empty title; the store
      // rejects it too, so this is belt and braces.
      if (keep && input.value.trim() && input.value.trim() !== item.title) {
        rename(item.hash, input.value);
        refresh();
        return;
      }
      input.replaceWith(name);
    };
    input.addEventListener('blur', () => commit(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      if (e.key === 'Escape') { e.preventDefault(); commit(false); }
    });
    name.replaceWith(input);
    input.focus();
    input.select();
  }

  name.addEventListener('click', beginRename);
  name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginRename(); }
  });

  const kind = document.createElement('span');
  kind.className = 'gal-family';
  kind.textContent = t(KIND_KEY[kindOf(item.hash)!], lang);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'saved-del';
  del.textContent = '×';
  del.title = t('saved.delete', lang);
  del.setAttribute('aria-label', `${t('saved.delete', lang)}: ${item.title}`);
  del.addEventListener('click', () => {
    const snapshot = { ...item };
    if (!remove(item.hash).ok) return;
    refresh();
    showToast(t('saved.deleted', lang), {
      label: t('saved.undo', lang),
      run: () => {
        // Undo through importJSON, NOT toggle: `toggle` stamps a fresh
        // `savedAt`, so an undeleted favourite would jump to the top of a
        // newest-first list instead of returning to where it was. Import
        // preserves the record verbatim and skips it if it somehow came back.
        importJSON(JSON.stringify({ sv: SV, items: [snapshot] }));
        refresh();
      },
    });
  });

  meta.append(name, kind, del);

  link.append(box);
  card.append(link, meta);
  return card;
}
