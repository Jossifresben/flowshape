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
 *  stacked full-width buttons.
 *
 *  Takes a `getState` accessor, not a state snapshot: slider drags commit
 *  through the playground's fast path, which updates state and the URL
 *  without rebuilding this panel, so a captured snapshot goes stale the
 *  moment a slider moves — Animate and Poster would silently discard the
 *  visitor's edits and ship the values from the last full rebuild. */
export function buildActionsRow(
  def: PatternDef, getState: () => AppState, lang: Lang, setState: (next: Partial<AppState>) => void,
): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'panel-actions';

  const rand = actionButton(t('pg.randomizeShort', lang), t('pg.randomize', lang));
  rand.addEventListener('click', () => {
    if (def.usesSeed) {
      setState({ seed: 1 + Math.floor(Math.random() * 99999) });
    } else {
      setState({ params: randomParams(def, Math.random, getState().params) });
    }
  });

  const explainBtn = actionButton(t('pg.explainShort', lang), t('pg.explain', lang));
  explainBtn.addEventListener('click', () => {
    const { patternId } = getState();
    openModal({
      title: patternName(patternId, lang),
      tabs: [
        { id: 'math', label: t('modal.math', lang), render: () => renderMathTab(patternId, lang) },
        { id: 'code', label: t('modal.code', lang), render: () => renderCodeTab(patternId, lang) },
      ],
    });
  });

  const animateBtn = actionButton(t('pg.animateShort', lang), t('pg.animate', lang));
  animateBtn.addEventListener('click', () => {
    location.hash = encodeState({ ...getState(), view: 'a' });
  });

  const posterBtn = actionButton(t('pg.posterShort', lang), t('pg.poster', lang));
  posterBtn.addEventListener('click', () => {
    // Its own window, per the brief: the composer is a separate surface and
    // the playground keeps its state and its scroll position.
    window.open(
      `${location.pathname}${location.search}${composerUrl(getState())}`,
      '_blank',
      'noopener',
    );
  });

  actions.append(rand, explainBtn, animateBtn, posterBtn);
  return actions;
}
