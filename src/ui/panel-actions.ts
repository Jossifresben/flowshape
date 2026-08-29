import { randomParams } from '../patterns/randomize';
import { encodeState, type AppState } from '../core/url-state';
import type { PatternDef } from '../patterns/registry';
import { openModal } from './modal';
import { composerUrl } from './poster';
import { renderCodeTab, renderMathTab } from './tabs';
import { t, patternName, type Lang } from '../i18n';

/** One button in the three-up action row: short visible label, full wording
 *  kept as the accessible name so nothing is lost to the abbreviation. */
function actionButton(short: string, full: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = short;
  b.title = full;
  b.setAttribute('aria-label', full);
  return b;
}

/** Builds the three things a visitor reaches for constantly — Randomize,
 *  Explain, Animate, Poster — side by side above the fold instead of four
 *  stacked full-width buttons. */
export function buildActionsRow(
  def: PatternDef, state: AppState, lang: Lang, setState: (next: Partial<AppState>) => void,
): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'panel-actions';

  const rand = actionButton(t('pg.randomizeShort', lang), t('pg.randomize', lang));
  rand.addEventListener('click', () => {
    if (def.usesSeed) {
      setState({ seed: 1 + Math.floor(Math.random() * 99999) });
    } else {
      setState({ params: randomParams(def, Math.random, state.params) });
    }
  });

  const explainBtn = actionButton(t('pg.explainShort', lang), t('pg.explain', lang));
  explainBtn.addEventListener('click', () => {
    openModal({
      title: patternName(state.patternId, lang),
      tabs: [
        { id: 'math', label: t('modal.math', lang), render: () => renderMathTab(state.patternId, lang) },
        { id: 'code', label: t('modal.code', lang), render: () => renderCodeTab(state.patternId, lang) },
      ],
    });
  });

  const animateBtn = actionButton(t('pg.animateShort', lang), t('pg.animate', lang));
  animateBtn.addEventListener('click', () => {
    location.hash = encodeState({ ...state, view: 'a' });
  });

  const posterBtn = actionButton(t('pg.posterShort', lang), t('pg.poster', lang));
  posterBtn.addEventListener('click', () => {
    // Its own window, per the brief: the composer is a separate surface and
    // the playground keeps its state and its scroll position.
    window.open(
      `${location.pathname}${location.search}${composerUrl(state)}`,
      '_blank',
      'noopener',
    );
  });

  actions.append(rand, explainBtn, animateBtn, posterBtn);
  return actions;
}
