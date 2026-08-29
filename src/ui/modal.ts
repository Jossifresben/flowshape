export interface ModalTab {
  id: string;
  label: string;
  render: () => Promise<HTMLElement> | HTMLElement;
}

export interface ModalOptions {
  title: string;
  tabs: ModalTab[];
  /** Runs after the modal is removed from the DOM. For content that needs
   *  more than DOM removal to stop — e.g. a playing `<video>`, where removal
   *  alone is not reliably synchronous across browsers. */
  onClose?: () => void;
}

/** The close function of whatever modal is currently open, if any — lets a
 *  second `openModal` close the first before opening itself, and lets close()
 *  no-op if it has already run (e.g. Escape and backdrop-click racing). */
let activeClose: (() => void) | null = null;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(el: HTMLElement): boolean {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

let modalSeq = 0;

/** Opens a two-tab modal dialog: backdrop + panel, focus-trapped, closes on
 *  Escape or a backdrop click, and restores focus to whatever opened it.
 *  Only one modal is ever open at a time. */
export function openModal(opts: ModalOptions): void {
  // Opening a second modal closes the first.
  activeClose?.();

  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleId = `modal-title-${++modalSeq}`;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const panel = document.createElement('div');
  panel.className = 'modal';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', titleId);
  panel.tabIndex = -1;
  // Clicks inside the panel must not bubble to the backdrop's close handler.
  panel.addEventListener('click', (e) => e.stopPropagation());

  const head = document.createElement('div');
  head.className = 'modal-head';
  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.id = titleId;
  titleEl.textContent = opts.title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => close());
  head.append(titleEl, closeBtn);

  // A tab strip only means something when there is a choice to make — a
  // single-tab modal (e.g. the video player) has nothing to switch between,
  // so the bar would just be a lonely, clickless-looking chip.
  const showTabStrip = opts.tabs.length > 1;
  const tabStrip = document.createElement('div');
  tabStrip.className = 'modal-tabs';
  tabStrip.setAttribute('role', 'tablist');

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.setAttribute('role', 'tabpanel');

  let activeTabId: string | undefined;
  const tabButtons = new Map<string, HTMLButtonElement>();

  function selectTab(tabId: string): void {
    const tab = opts.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    activeTabId = tabId;
    for (const [tid, btn] of tabButtons) {
      const selected = tid === tabId;
      btn.setAttribute('aria-selected', String(selected));
      btn.className = 'chip' + (selected ? ' selected' : '');
    }
    body.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'ctl-value';
    loading.textContent = 'Loading…';
    body.append(loading);

    Promise.resolve(tab.render()).then((el) => {
      // The tab may have changed (or the modal closed) while this was pending.
      if (activeTabId !== tabId) return;
      body.innerHTML = '';
      body.append(el);
    });
  }

  for (const tab of opts.tabs) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.addEventListener('click', () => selectTab(tab.id));
    tabButtons.set(tab.id, btn);
    tabStrip.append(btn);
  }

  panel.append(head);
  if (showTabStrip) panel.append(tabStrip);
  panel.append(body);
  backdrop.append(panel);
  backdrop.addEventListener('click', () => close());

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = focusableElements(panel);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || !(current instanceof Node) || !panel.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !(current instanceof Node) || !panel.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function close(): void {
    if (activeClose !== close) return; // already closed, or superseded by a later modal
    activeClose = null;
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
    if (opener && document.contains(opener)) opener.focus();
    opts.onClose?.();
  }

  activeClose = close;
  document.addEventListener('keydown', onKeydown);
  document.body.append(backdrop);

  if (opts.tabs.length > 0) selectTab(opts.tabs[0]!.id);

  const focusables = focusableElements(panel);
  (focusables[0] ?? panel).focus();
}
