import { SHOWCASE_VIDEOS, type ShowcaseVideo } from '../content/showcase';
import { currentLang, t } from '../i18n';
import { buildNav } from './nav';
import { buildFooter } from './footer';
import { buildVideoShare, videoModalTitle } from './showcase';

/**
 * `#/video/<id>` — one recording, on a page of its own.
 *
 * This is where a shared link lands. The gallery's modal player is for
 * browsing; someone who followed a link came for this one video, so the page
 * is just the video, with the navbar left in place to get anywhere else.
 */

/** The id named by a `#/video/<id>` hash, or null if the hash is not one. */
export function videoIdFromHash(hash: string): string | null {
  const m = /^#\/video\/([^?/]+)/.exec(hash);
  return m ? decodeURIComponent(m[1]!) : null;
}

export function mountVideoPage(root: HTMLElement): () => void {
  const lang = currentLang();
  root.innerHTML = '';
  document.documentElement.lang = lang;

  const id = videoIdFromHash(location.hash);
  const entry: ShowcaseVideo | undefined = id
    ? SHOWCASE_VIDEOS.find((v) => v.id === id)
    : undefined;

  // An id that names nothing — a link shared before an entry was renamed, or a
  // typo — sends the visitor to the gallery rather than showing them an error
  // page. There is nothing they could do with the error, and the gallery is
  // what they were looking for.
  if (!entry) {
    location.replace(`${location.pathname}#/gallery/videos`);
    return () => {};
  }

  const title = videoModalTitle(entry, lang);

  const head = document.createElement('div');
  head.className = 'vid-head';
  if (title) {
    const h1 = document.createElement('h1');
    h1.className = 'vid-title';
    h1.textContent = title;
    head.append(h1);
  }

  const video = document.createElement('video');
  video.src = entry.src;
  video.poster = entry.poster;
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.className = 'vid-player';
  // No autoplay: arriving here is a navigation, not a click on a play button,
  // and a page that starts making noise on its own is hostile — especially on
  // a link opened from a message.

  const actions = document.createElement('div');
  actions.className = 'modal-video-actions';

  if (entry.hash) {
    const link = document.createElement('a');
    link.className = 'modal-video-link';
    link.href = entry.hash;
    link.textContent = t('show.openStage', lang);
    actions.append(link);
  }

  const { toggle, panel } = buildVideoShare(entry, lang);
  actions.append(toggle);

  const back = document.createElement('a');
  back.className = 'modal-video-link vid-back';
  back.href = '#/gallery/videos';
  back.textContent = t('show.allVideos', lang);

  const box = document.createElement('div');
  box.className = 'vid-box';
  box.append(head, video, actions, panel, back);

  root.append(buildNav(lang, 'gallery'), box, buildFooter(lang));

  return () => video.pause();
}
