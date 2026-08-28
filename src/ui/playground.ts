import { getPattern, defaultParams, clampParams } from '../patterns/registry';
import { serialize } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import { sliderRow, paletteRow } from './controls';

const DEFAULT_STATE: AppState = {
  patternId: 'phyllotaxis',
  seed: 1,
  params: {},
  color: {},
  theme: 'light',
  lang: 'en',
};

export function mountPlayground(root: HTMLElement): void {
  let state = decodeState(location.hash) ?? DEFAULT_STATE;
  let stage: HTMLDivElement;

  function setState(next: Partial<AppState>): void {
    state = { ...state, ...next };
    history.replaceState(null, '', encodeState(state));
    render();
  }

  let rafId = 0;
  function renderStage(): void {
    const def = getPattern(state.patternId);
    if (!def) return;
    const params = clampParams(def, { ...defaultParams(def), ...state.params });
    const pal = resolvePalette(state.color, state.theme);
    stage.style.background = pal.paper;
    stage.innerHTML = serialize(def.generate(params, state.seed, { w: 600, h: 840 }), pal);
  }
  function setParam(key: string, v: number): void {
    state = { ...state, params: { ...state.params, [key]: v } };
    history.replaceState(null, '', encodeState(state));
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { rafId = 0; renderStage(); });
  }

  function render(): void {
    const def = getPattern(state.patternId);
    if (!def) {
      root.textContent = 'Unknown pattern';
      return;
    }
    document.documentElement.dataset['theme'] = state.theme;
    const params = clampParams(def, { ...defaultParams(def), ...state.params });
    const pal = resolvePalette(state.color, state.theme);
    root.innerHTML = '';

    stage = document.createElement('div');
    stage.className = 'stage';
    stage.style.background = pal.paper;
    stage.innerHTML = serialize(def.generate(params, state.seed, { w: 600, h: 840 }), pal);

    const panel = document.createElement('div');
    panel.className = 'panel';

    if (def.usesSeed) {
      const seedRow = document.createElement('div');
      seedRow.className = 'ctl-row';
      const seedVal = document.createElement('span');
      seedVal.className = 'ctl-value';
      seedVal.textContent = `SEED ${state.seed}`;
      const rand = document.createElement('button');
      rand.className = 'btn';
      rand.textContent = 'Randomize';
      rand.addEventListener('click', () =>
        setState({ seed: 1 + Math.floor(Math.random() * 99999) }),
      );
      seedRow.append(seedVal, rand);
      panel.append(seedRow);
    }

    for (const pd of def.params) {
      panel.append(sliderRow(pd, params[pd.key]!, (v) => setParam(pd.key, v)));
    }
    panel.append(paletteRow(state.color, (c) => setState({ color: c })));

    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn';
    themeBtn.textContent = state.theme === 'light' ? 'Dark theme' : 'Light theme';
    themeBtn.addEventListener('click', () =>
      setState({ theme: state.theme === 'light' ? 'dark' : 'light' }),
    );
    panel.append(themeBtn);

    root.append(stage, panel);
  }

  window.addEventListener('hashchange', () => {
    state = decodeState(location.hash) ?? DEFAULT_STATE;
    render();
  });
  render();
  history.replaceState(null, '', encodeState(state));
}
