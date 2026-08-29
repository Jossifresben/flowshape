import { t, setLang, LANGS, type Lang } from '../i18n';
import { shareButton } from './share';

/** The EN | ES switch. Buttons rather than a select: two options, and the
 *  inactive one should read as a one-tap alternative, not a hidden menu. */
export function langSwitch(lang: Lang): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nav-lang';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', t('nav.language', lang));
  for (const code of LANGS) {
    const b = document.createElement('button');
    b.className = 'nav-lang-btn' + (code === lang ? ' active' : '');
    b.type = 'button';
    b.lang = code;
    b.textContent = code.toUpperCase();
    b.setAttribute('aria-pressed', String(code === lang));
    b.addEventListener('click', () => {
      if (code !== lang) setLang(code);
    });
    wrap.append(b);
  }
  return wrap;
}

/** The site top bar: wordmark, section links, language switch. Shared by the
 *  gallery and the about page; the playground has its own narrow panel and
 *  uses `panelNav` below instead. */
export function buildNav(lang: Lang, active: 'patterns' | 'about' | 'saved'): HTMLElement {
  const topbar = document.createElement('div');
  topbar.className = 'gal-topbar';

  const wordmark = document.createElement('a');
  wordmark.className = 'gal-wordmark';
  wordmark.href = '#/';
  wordmark.setAttribute('aria-label', t('nav.home', lang));
  wordmark.innerHTML = 'flowshape<span class="gal-wordmark-dot">.art</span>';

  const links = document.createElement('nav');
  links.className = 'nav-links';
  const link = (href: string, label: string, isActive: boolean): void => {
    const a = document.createElement('a');
    a.className = 'nav-link' + (isActive ? ' active' : '');
    a.href = href;
    a.textContent = label;
    if (isActive) a.setAttribute('aria-current', 'page');
    links.append(a);
  };
  link('#/', t('nav.patterns', lang), active === 'patterns');
  link('#/saved', t('nav.saved', lang), active === 'saved');
  link('#/about', t('nav.about', lang), active === 'about');
  links.append(langSwitch(lang), shareButton(lang));

  topbar.append(wordmark, links);
  return topbar;
}

/** The playground's equivalent: a back link plus the language switch, sized
 *  for the control panel rather than a full-width bar. */
export function panelNav(lang: Lang, favourite?: HTMLElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'panel-nav';

  const back = document.createElement('a');
  back.className = 'gal-back-link';
  back.href = '#/';
  back.textContent = t('pg.back', lang);

  // Star before share, matching the animate stage and the composer: the two
  // "keep it / pass it on" controls read as a pair wherever they appear.
  if (favourite) row.append(back, langSwitch(lang), favourite, shareButton(lang));
  else row.append(back, langSwitch(lang), shareButton(lang));
  return row;
}
