import type { SvgNode } from '../core/svg';
import type { AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import { DEFAULT_FORMAT } from '../poster/formats';
import { toSvgString, toPngBlob, downloadBlob, exportFilename, pixelDimensions } from '../poster/export';
import { sectionRow } from './controls';
import { t, type Lang } from '../i18n';

export interface ExportRow {
  el: HTMLElement;
  /** Re-enables the export buttons once a deferred node becomes available —
   *  a heavy pattern's first, still in-flight worker request — without a
   *  full panel rebuild. The caller wires this into whatever fires when that
   *  node lands. */
  markReady: () => void;
}

/** Builds the Export disclosure: SVG/PNG buttons, the DPI choice, and any
 *  render-time error.
 *
 *  Reads the node through `getNode` rather than a value captured at build
 *  time: a heavy pattern's node can land asynchronously after this row is
 *  built (see `markReady`), and the click handlers must see that live value,
 *  not a stale null closed over at construction. */
export function buildExportRow(
  state: AppState, phys: { wmm: number; hmm: number }, lang: Lang, getNode: () => SvgNode | null,
): ExportRow {
  const exportSec = sectionRow('export', t('pg.export', lang), false);

  const exportRow = document.createElement('div');
  exportRow.className = 'ctl-row';

  const svgBtn = document.createElement('button');
  svgBtn.className = 'btn';
  svgBtn.textContent = t('pg.exportSvg', lang);

  const dpiSel = document.createElement('select');
  dpiSel.className = 'ctl-select';
  for (const dpi of [150, 300]) {
    const px = pixelDimensions(phys, dpi);
    const o = document.createElement('option');
    o.value = String(dpi);
    o.textContent = `${dpi} dpi · ${px.w} × ${px.h}`;
    if (dpi === 300) o.selected = true;
    dpiSel.append(o);
  }

  const pngBtn = document.createElement('button');
  pngBtn.className = 'btn';
  pngBtn.textContent = t('pg.exportPng', lang);

  const exportError = document.createElement('div');
  exportError.className = 'ctl-value export-error';
  exportError.textContent = '';

  if (!getNode()) {
    svgBtn.disabled = true;
    pngBtn.disabled = true;
  }

  svgBtn.addEventListener('click', () => {
    const node = getNode();
    if (!node) return;
    const pal = resolvePalette(state.color);
    const svg = toSvgString(node, pal, phys);
    const name = exportFilename(state.patternId, state.seed, state.format ?? DEFAULT_FORMAT, 'svg');
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), name);
  });

  pngBtn.addEventListener('click', async () => {
    const node = getNode();
    if (!node) return;
    const originalText = pngBtn.textContent;
    pngBtn.disabled = true;
    pngBtn.textContent = t('pg.rendering', lang);
    exportError.textContent = '';
    try {
      const pal = resolvePalette(state.color);
      const svg = toSvgString(node, pal, phys);
      const dpi = Number(dpiSel.value);
      const px = pixelDimensions(phys, dpi);
      const blob = await toPngBlob(svg, px);
      const name = exportFilename(state.patternId, state.seed, state.format ?? DEFAULT_FORMAT, 'png');
      downloadBlob(blob, name);
    } catch (err) {
      exportError.textContent = err instanceof Error ? err.message : String(err);
    } finally {
      pngBtn.disabled = false;
      pngBtn.textContent = originalText;
    }
  });

  exportRow.append(svgBtn, dpiSel, pngBtn);
  exportSec.body.append(exportRow, exportError);

  return {
    el: exportSec.el,
    markReady: () => {
      svgBtn.disabled = false;
      pngBtn.disabled = false;
    },
  };
}
