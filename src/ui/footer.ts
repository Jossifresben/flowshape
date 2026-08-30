import { t, type Lang } from '../i18n';
import { openConsentBanner } from './consent-banner';
import { openTipJar } from './tip';

export const REPO_URL = 'https://github.com/Jossifresben/flowshape';
export const AUTHOR_NAME = 'Jossi Fresco Benaim';
export const AUTHOR_URL = 'https://jossifresco.com';
export const ORCID_URL = 'https://orcid.org/0009-0000-2026-0836';

function extLink(href: string, text: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

/**
 * The site footer: who made it, and where the code is.
 *
 * `compact` drops the licence and about links for the playground's control
 * panel, where the credit line sits under the export controls and vertical
 * space is already scarce. The privacy control is the one link it keeps:
 * withdrawing consent has to be as easy as giving it, and the playground is
 * where a visitor spends most of their time — leaving it out there would put
 * the choice behind a navigation on the site's main view.
 */
export function buildFooter(lang: Lang, opts: { compact?: boolean } = {}): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'site-footer' + (opts.compact ? ' compact' : '');

  const credit = document.createElement('div');
  credit.className = 'site-footer-credit';
  credit.append(`${t('footer.builtBy', lang)} `, extLink(AUTHOR_URL, AUTHOR_NAME));

  footer.append(credit);

  const links = document.createElement('div');
  links.className = 'site-footer-links';
  links.append(extLink(REPO_URL, t('footer.source', lang)));
  if (!opts.compact) {
    const about = document.createElement('a');
    about.href = '#/about';
    about.textContent = t('footer.about', lang);
    links.append(about, extLink(`${REPO_URL}/blob/main/LICENSE`, t('footer.licence', lang)));
  }
  const privacy = document.createElement('button');
  privacy.type = 'button';
  privacy.className = 'site-footer-privacy';
  privacy.textContent = t('footer.privacy', lang);
  privacy.addEventListener('click', openConsentBanner);
  // Brighter than its neighbours because it is the one link here that asks for
  // something, rather than pointing at more reading.
  const tip = document.createElement('button');
  tip.type = 'button';
  tip.className = 'site-footer-privacy site-footer-tip';
  tip.textContent = t('tip.support', lang);
  tip.addEventListener('click', () => openTipJar(lang));
  links.append(privacy, tip);
  footer.append(links);

  return footer;
}
