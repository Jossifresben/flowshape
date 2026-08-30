import { loadSource } from '../content/source';
import { loadExplain } from '../content/explain';
import { renderMarkdown, renderCitation } from './markdown';
import { t, type Lang } from '../i18n';
import { REPO_URL } from './footer';
import { copyOrSelect } from './clipboard';

function placeholderTab(text: string): HTMLElement {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function codeWord(text: string): HTMLElement {
  const c = document.createElement('code');
  c.textContent = text;
  return c;
}

/** Builds the Code tab: the pattern's real, un-rewritten source, a short
 *  preamble naming the helpers a reader needs, and a Copy button. */
export async function renderCodeTab(id: string, lang: Lang): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const source = await loadSource(id);
  if (source === null) {
    wrap.append(placeholderTab(t('code.missing', lang)));
    return wrap;
  }

  const preamble = document.createElement('p');
  preamble.className = 'code-preamble';
  const repoLink = document.createElement('a');
  repoLink.href = REPO_URL;
  repoLink.target = '_blank';
  repoLink.rel = 'noopener noreferrer';
  repoLink.textContent = t('code.repo', lang);
  preamble.append(
    t('code.preambleA', lang),
    codeWord('el'), '/', codeWord('serialize'), t('code.preambleB', lang), codeWord('core/svg'),
    t('code.preambleC', lang),
    codeWord('mulberry32'), '/', codeWord('deriveSeed'), t('code.preambleB', lang), codeWord('core/prng'),
    t('code.preambleD', lang), repoLink, '.',
  );

  const pre = document.createElement('pre');
  pre.textContent = source;

  const copyRow = document.createElement('div');
  copyRow.className = 'ctl-row';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = t('code.copy', lang);
  let copyResetTimer = 0;
  copyBtn.addEventListener('click', async () => {
    const wroteToClipboard = await copyOrSelect(source, pre);
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyBtn.textContent = t(wroteToClipboard ? 'code.copied' : 'code.selected', lang);
    copyResetTimer = window.setTimeout(() => {
      copyBtn.textContent = t('code.copy', lang);
    }, 2000);
  });
  copyRow.append(copyBtn);

  wrap.append(preamble, copyRow, pre);
  return wrap;
}

/** Builds the Math tab: the pattern's explanation content (formula, plain-
 *  language meaning, per-parameter notes) rendered from markdown, plus its
 *  citation as a link, in the reader's language. */
export async function renderMathTab(id: string, lang: Lang): Promise<HTMLElement> {
  const wrap = document.createElement('div');
  const doc = await loadExplain(id, lang);
  if (doc === null) {
    wrap.append(placeholderTab(t('math.missing', lang)));
    return wrap;
  }
  wrap.innerHTML = renderMarkdown(doc.body) + renderCitation(doc.source, doc.url, doc.doi);
  return wrap;
}
