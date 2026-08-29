/** Copies `text` to the clipboard; falls back to selecting `target`'s
 *  contents (so the user can copy manually) when the clipboard API is
 *  unavailable or the permission is denied. Returns whether the clipboard
 *  itself was written to, so the caller can word its confirmation honestly. */
export async function copyOrSelect(text: string, target: HTMLElement): Promise<boolean> {
  try {
    if (!navigator.clipboard) throw new Error('clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      // Nothing more we can do — the button label still tells the user what happened.
    }
    return false;
  }
}
