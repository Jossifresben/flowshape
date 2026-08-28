import type { ParamDef } from '../patterns/registry';
import { PALETTES, type ColorState } from '../poster/palettes';

export function sliderRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const head = document.createElement('div');
  head.className = 'ctl-head';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const val = document.createElement('span');
  val.className = 'ctl-value';
  val.textContent = String(value);
  head.append(label, val);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(def.min);
  input.max = String(def.max);
  input.step = String(def.step);
  input.value = String(value);
  input.addEventListener('input', () => {
    val.textContent = input.value;
    onChange(Number(input.value));
  });
  row.append(head, input);
  return row;
}

export function paletteRow(
  current: ColorState,
  onChange: (c: ColorState) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pal-row';
  for (const p of PALETTES) {
    const b = document.createElement('button');
    b.className = 'pal-chip' + (current.pal === p.id ? ' selected' : '');
    b.title = p.name;
    for (const c of [p.paper, p.ink, p.accent]) {
      const sw = document.createElement('span');
      sw.style.background = c;
      b.append(sw);
    }
    b.addEventListener('click', () => onChange({ pal: p.id }));
    row.append(b);
  }
  return row;
}
