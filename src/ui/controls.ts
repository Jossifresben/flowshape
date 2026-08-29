import type { ParamDef } from '../patterns/registry';
import { recallSection, rememberSection } from '../core/persist';
import { paramLabel, type Lang } from '../i18n';

export function sliderRow(
  def: ParamDef,
  value: number,
  lang: Lang,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const head = document.createElement('div');
  head.className = 'ctl-head';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = paramLabel(def.label, lang);
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
  lang: Lang,
  onChange: (v: number) => void,
): HTMLElement {
  // <label>, not <div> — the whole row becomes one tap target: clicking
  // anywhere inside it toggles the descendant checkbox natively.
  const row = document.createElement('label');
  row.className = 'ctl-row ctl-inline';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = paramLabel(def.label, lang);
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value === 1;
  input.addEventListener('change', () => onChange(input.checked ? 1 : 0));
  row.append(label, input);
  return row;
}

/**
 * Grey out a control whose `dependsOn` gate isn't satisfied.
 *
 * Dimmed rather than hidden, deliberately: hiding would make the panel jump
 * on every dropdown change, and would also erase the fact that the param
 * still exists and is still carried in the shared URL. Dimming says "this
 * one belongs to the other mode", which is the true statement.
 *
 * `hint` names the mode that would bring it back, and lands on both the row
 * and the disabled input — a disabled control doesn't fire pointer events in
 * every browser, so the title has to sit on an enabled ancestor too.
 */
export function dimRow(row: HTMLElement, hint: string): void {
  row.classList.add('ctl-dependent');
  row.setAttribute('aria-disabled', 'true');
  row.title = hint;
  for (const c of row.querySelectorAll('input, select')) {
    (c as HTMLInputElement | HTMLSelectElement).disabled = true;
    (c as HTMLElement).title = hint;
  }
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
  lang: Lang,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = paramLabel(def.label, lang);
  const select = document.createElement('select');
  select.className = 'ctl-select';
  (def.options ?? []).forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = paramLabel(opt, lang);
    if (i === value) o.selected = true;
    select.append(o);
  });
  select.addEventListener('change', () => onChange(Number(select.value)));
  row.append(label, select);
  return row;
}

/**
 * A collapsible sidebar section.
 *
 * Native `<details>`/`<summary>`: the disclosure behaviour, keyboard handling
 * (Enter/Space on a focused summary) and the screen-reader announcement all
 * come from the platform — no JS beyond remembering the state.
 *
 * `id` keys the localStorage memory; `defaultOpen` applies only until the
 * visitor has toggled the section themselves.
 */
export function sectionRow(
  id: string,
  title: string,
  defaultOpen: boolean,
): { el: HTMLDetailsElement; body: HTMLElement } {
  const el = document.createElement('details');
  el.className = 'ctl-section';
  el.open = recallSection(id) ?? defaultOpen;

  const summary = document.createElement('summary');
  summary.className = 'ctl-section-heading';
  summary.textContent = title;

  const body = document.createElement('div');
  body.className = 'ctl-section-body';

  el.append(summary, body);
  el.addEventListener('toggle', () => rememberSection(id, el.open));
  return { el, body };
}
