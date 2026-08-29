import '../patterns/index';
import { listPatterns, getPattern, defaultParams, generateSafe } from '../patterns/registry';
import { serialize, type Palette } from '../core/svg';
import { drawTree } from '../anim/canvas-render';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 600, h: 840 };

/** DEV-only: SVG vs canvas side by side, for eyeballing adapter fidelity. */
export function mountFidelity(root: HTMLElement): void {
  root.innerHTML = '';
  const sel = document.createElement('select');
  for (const def of listPatterns()) {
    const o = document.createElement('option');
    o.value = def.id; o.textContent = def.id;
    sel.append(o);
  }
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:16px;padding:16px;';
  const svgBox = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.width = SIZE.w; canvas.height = SIZE.h;
  row.append(svgBox, canvas);
  root.append(sel, row);

  function show(): void {
    const def = getPattern(sel.value)!;
    const node = generateSafe(def, defaultParams(def), 1, SIZE);
    svgBox.innerHTML = serialize(node, PAL);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, SIZE.w, SIZE.h);
    drawTree(ctx, node, PAL);
  }
  sel.addEventListener('change', show);
  show();
}
