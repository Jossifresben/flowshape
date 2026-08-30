/** A small, purpose-built markdown-to-HTML renderer for the explain content in
 *  `src/content/explain/*.md`. Not a general markdown implementation — it only
 *  understands the handful of constructs those files actually use:
 *
 *    ## Heading                → <h3>
 *    blank-line-separated text → <p>
 *    4-space-indented lines    → <pre> (the formula blocks)
 *    - bullet                  → <ul><li>
 *    **bold**                  → <strong> (parameter names)
 *    *italic*                  → <em> (the content prose leans on this for
 *                                 emphasis in running text; formula blocks
 *                                 use '·' for multiplication, never a bare
 *                                 '*', so this never fires inside a <pre>)
 *
 *  Source text is HTML-escaped before any tag is added, so the output is safe
 *  to assign to `innerHTML` even though the content here is trusted — an
 *  escape step is cheap insurance against ever reusing this on untrusted text. */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Applies inline formatting to already-escaped text: **bold** first (so a
 *  '**' pair is never picked off as two adjacent '*' italics), then *italic*
 *  on whatever single-asterisk pairs remain. */
function inline(escaped: string): string {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

const HEADING = /^## +(.*)$/;
const INDENTED = /^ {4}/;
const BULLET = /^-\s+(.*)$/;

/** Renders explain-doc markdown body to an HTML string. */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '') {
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      out.push(`<h3>${inline(escapeHtml(heading[1]!.trim()))}</h3>`);
      i++;
      continue;
    }

    if (INDENTED.test(line)) {
      const codeLines: string[] = [];
      while (i < lines.length && (INDENTED.test(lines[i]!) || lines[i]!.trim() === '')) {
        const l = lines[i]!;
        codeLines.push(INDENTED.test(l) ? l.slice(4) : l);
        i++;
      }
      // A blank line inside the indented run is part of the block; trailing
      // blank lines (the paragraph separator that ended it) are not.
      while (codeLines.length > 0 && codeLines[codeLines.length - 1]!.trim() === '') codeLines.pop();
      out.push(`<pre>${escapeHtml(codeLines.join('\n'))}</pre>`);
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      const items: string[] = [];
      while (i < lines.length) {
        const b = BULLET.exec(lines[i]!);
        if (!b) break;
        items.push(`<li>${inline(escapeHtml(b[1]!))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Paragraph: consume lines until a blank line or the start of another block.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !HEADING.test(lines[i]!) &&
      !INDENTED.test(lines[i]!) &&
      !BULLET.test(lines[i]!)
    ) {
      paraLines.push(lines[i]!);
      i++;
    }
    out.push(`<p>${inline(escapeHtml(paraLines.join(' ')))}</p>`);
  }

  return out.join('\n');
}

/** Renders a source citation as a link in small mono type, e.g. for the
 *  bottom of an explain doc: `<source text>` linking to `url`, followed by one
 *  resolvable `doi.org/…` link per DOI the citation carries, in the order the
 *  works are named. `doi` is empty for most patterns and the line is then
 *  omitted entirely rather than rendered blank. */
export function renderCitation(source: string, url: string, doi: readonly string[] = []): string {
  const cite = `<p class="explain-citation"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source)}</a></p>`;
  if (doi.length === 0) return cite;
  const links = doi
    .map(
      (d) =>
        `<a href="https://doi.org/${escapeHtml(d)}" target="_blank" rel="noopener noreferrer">doi.org/${escapeHtml(d)}</a>`,
    )
    .join(' ');
  return `${cite}\n<p class="explain-doi">${links}</p>`;
}
