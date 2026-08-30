import { openModal } from './modal';
import { t, type Lang } from '../i18n';

/**
 * The tip jar: a TipTopJar inline widget in a modal.
 *
 * The widget script is fetched at the moment the reader opens the jar, never
 * on page load. That is the same reason the analytics banner exists — a third
 * party's script and cookies should arrive because someone asked for them, not
 * because they visited. Here the click *is* the request, so it needs no
 * separate consent, and someone who never opens the jar never meets TipTopJar
 * at all.
 *
 * The plain link below the widget is not decoration: it is the fallback for
 * every case where the embed does not arrive — a blocked third-party script,
 * an extension, a dead CDN. Without it a failed widget would leave a reader
 * who wanted to give something with nowhere to go.
 */
const TIP_USER = 'jossif';
export const TIP_URL = `https://tiptopjar.com/${TIP_USER}`;

function buildBody(lang: Lang): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tip-body';

  const blurb = document.createElement('p');
  blurb.className = 'tip-blurb';
  blurb.textContent = t('tip.blurb', lang);

  const mount = document.createElement('div');
  mount.className = 'tip-mount';

  const fallback = document.createElement('p');
  fallback.className = 'tip-fallback';
  const link = document.createElement('a');
  link.href = TIP_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = t('tip.direct', lang);
  fallback.append(link);

  wrap.append(blurb, mount, fallback);

  // Inserted on the next tick so the mount is in the document: a <script>
  // only runs once its subtree is connected, and the modal appends this
  // element after render() has returned.
  setTimeout(() => {
    if (!mount.isConnected) return;
    const s = document.createElement('script');
    s.src = 'https://tiptopjar.com/widget.js';
    s.async = true;
    s.setAttribute('data-username', TIP_USER);
    s.setAttribute('data-mode', 'inline');
    mount.append(s);
  }, 0);

  return wrap;
}

export function openTipJar(lang: Lang): void {
  const title = t('tip.title', lang);
  openModal({ title, tabs: [{ id: 'tip', label: title, render: () => buildBody(lang) }] });
}
