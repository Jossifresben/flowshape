import type { ParamDef } from '../patterns/registry';

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

export function checkboxRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  // <label>, not <div> — the whole row becomes one tap target: clicking
  // anywhere inside it toggles the descendant checkbox natively.
  const row = document.createElement('label');
  row.className = 'ctl-row ctl-inline';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value === 1;
  input.addEventListener('change', () => onChange(input.checked ? 1 : 0));
  row.append(label, input);
  return row;
}

export function chipRow(
  items: { id: string; label: string }[],
  current: string,
  onPick: (id: string) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'chip-row';
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip' + (it.id === current ? ' selected' : '');
    b.textContent = it.label;
    b.addEventListener('click', () => onPick(it.id));
    row.append(b);
  }
  return row;
}

export function selectRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const select = document.createElement('select');
  select.className = 'ctl-select';
  (def.options ?? []).forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = opt.split('.').pop()!;
    if (i === value) o.selected = true;
    select.append(o);
  });
  select.addEventListener('change', () => onChange(Number(select.value)));
  row.append(label, select);
  return row;
}
