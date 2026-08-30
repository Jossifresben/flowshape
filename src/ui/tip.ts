import { openModal } from './modal';
import { t, type Lang } from '../i18n';

/**
 * The tip jar.
 *
 * This deliberately does NOT embed TipTopJar's widget. That embed is a
 * cross-origin iframe, which means three things this site cannot accept: its
 * palette is fixed and unreachable by our CSS, it renders only in English (no
 * language attribute, `?lang=` ignored) against a site that is bilingual
 * everywhere else, and it injects a Google font we do not use into our own
 * document head. Its height also arrives by postMessage and was observed not
 * arriving at all.
 *
 * So the card below is ours: on-brand, bilingual, and no third-party code on
 * the page at any point. The reader lands on the payment page already knowing
 * what it is and what it takes — which is the part the embed was doing.
 */
const TIP_USER = 'jossif';
export const TIP_URL = `https://tiptopjar.com/${TIP_USER}`;

/** A stroke-based arrow, matching the icon style used elsewhere. */
function arrowIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M4 10h11M11 5.5L15.5 10 11 14.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function buildBody(lang: Lang): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tip-body';

  const blurb = document.createElement('p');
  blurb.className = 'tip-blurb';
  blurb.textContent = t('tip.blurb', lang);

  const cta = document.createElement('a');
  cta.className = 'tip-cta';
  cta.href = TIP_URL;
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.append(t('tip.cta', lang), arrowIcon());

  const methods = document.createElement('p');
  methods.className = 'tip-methods';
  methods.textContent = t('tip.methods', lang);

  const hosted = document.createElement('p');
  hosted.className = 'tip-hosted';
  hosted.textContent = t('tip.hosted', lang);

  wrap.append(blurb, cta, methods, hosted);
  return wrap;
}

export function openTipJar(lang: Lang): void {
  const title = t('tip.support', lang);
  openModal({ title, tabs: [{ id: 'tip', label: title, render: () => buildBody(lang) }] });
}
