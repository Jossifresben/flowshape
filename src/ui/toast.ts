/** A transient message with one optional action. Used for undoing a delete:
 *  deletion is cheap to reverse, and a confirm dialog on a fast, low-stakes
 *  action only trains people to dismiss dialogs. */
export function showToast(message: string, action?: { label: string; run: () => void }): void {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  const text = document.createElement('span');
  text.textContent = message;
  el.append(text);
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { action.run(); el.remove(); });
    el.append(btn);
  }
  document.body.append(el);
  // The undo window holds the removed record in the caller's closure only, so
  // a reload during it forfeits the undo. That is an accepted limit.
  window.setTimeout(() => el.remove(), 6000);
}
