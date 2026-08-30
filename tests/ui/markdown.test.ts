import { describe, it, expect } from 'vitest';
import { renderMarkdown, renderCitation } from '../../src/ui/markdown';

describe('renderMarkdown', () => {
  it('renders a heading as <h3>', () => {
    expect(renderMarkdown('## Formula')).toBe('<h3>Formula</h3>');
  });

  it('renders a blank-line-separated paragraph as <p>', () => {
    const out = renderMarkdown('First paragraph.\n\nSecond paragraph.');
    expect(out).toBe('<p>First paragraph.</p>\n<p>Second paragraph.</p>');
  });

  it('joins soft-wrapped lines within one paragraph with a space', () => {
    const out = renderMarkdown('Line one\nline two.');
    expect(out).toBe('<p>Line one line two.</p>');
  });

  it('renders a 4-space-indented block as <pre>, dedented', () => {
    const out = renderMarkdown('    a = b + c\n    d = e');
    expect(out).toBe('<pre>a = b + c\nd = e</pre>');
  });

  it('keeps a blank line inside an indented block but drops the trailing one', () => {
    const out = renderMarkdown('    line one\n\n    line two\n\nAfter.');
    expect(out).toBe('<pre>line one\n\nline two</pre>\n<p>After.</p>');
  });

  it('renders a bullet list as <ul><li>', () => {
    const out = renderMarkdown('- first\n- second');
    expect(out).toBe('<ul><li>first</li><li>second</li></ul>');
  });

  it('renders **bold** as <strong>', () => {
    expect(renderMarkdown('the **points** parameter')).toBe(
      '<p>the <strong>points</strong> parameter</p>',
    );
  });

  it('renders *italic* as <em>', () => {
    expect(renderMarkdown('an *internally* tangent circle')).toBe(
      '<p>an <em>internally</em> tangent circle</p>',
    );
  });

  it('does not let *italic* swallow a **bold** pair', () => {
    expect(renderMarkdown('the **points** parameter, *stressed*')).toBe(
      '<p>the <strong>points</strong> parameter, <em>stressed</em></p>',
    );
  });

  it('applies bold inside list items', () => {
    expect(renderMarkdown('- **points** — the count')).toBe(
      '<ul><li><strong>points</strong> — the count</li></ul>',
    );
  });

  it('escapes HTML in paragraph text instead of emitting a tag', () => {
    const out = renderMarkdown('Contains <script>alert(1)</script> inline.');
    expect(out).not.toContain('<script>');
    expect(out).toBe('<p>Contains &lt;script&gt;alert(1)&lt;/script&gt; inline.</p>');
  });

  it('escapes HTML inside headings, code blocks, and list items', () => {
    expect(renderMarkdown('## <b>Heading</b>')).toBe('<h3>&lt;b&gt;Heading&lt;/b&gt;</h3>');
    expect(renderMarkdown('    <img src=x onerror=alert(1)>')).toBe(
      '<pre>&lt;img src=x onerror=alert(1)&gt;</pre>',
    );
    expect(renderMarkdown('- <script>bad()</script>')).toBe(
      '<ul><li>&lt;script&gt;bad()&lt;/script&gt;</li></ul>',
    );
  });

  it('escapes ampersands and quotes', () => {
    expect(renderMarkdown('Tom & Jerry "quoted" text')).toBe(
      '<p>Tom &amp; Jerry &quot;quoted&quot; text</p>',
    );
  });

  it('renders a realistic mixed document like the explain content', () => {
    const md = [
      '## Formula',
      '',
      '    theta = n * alpha',
      '',
      '## What it means',
      '',
      'Each point sits at angle theta.',
      '',
      '## Parameters',
      '',
      '- **points** — the total count.',
      '- **angle** — the divergence angle.',
    ].join('\n');
    const out = renderMarkdown(md);
    expect(out).toContain('<h3>Formula</h3>');
    expect(out).toContain('<pre>theta = n * alpha</pre>');
    expect(out).toContain('<h3>What it means</h3>');
    expect(out).toContain('<p>Each point sits at angle theta.</p>');
    expect(out).toContain('<h3>Parameters</h3>');
    expect(out).toContain('<li><strong>points</strong> — the total count.</li>');
    expect(out).toContain('<li><strong>angle</strong> — the divergence angle.</li>');
  });
});

describe('renderCitation', () => {
  it('renders the source text as a link to url', () => {
    const out = renderCitation('Vogel, H. (1979)', 'https://en.wikipedia.org/wiki/Phyllotaxis');
    expect(out).toBe(
      '<p class="explain-citation"><a href="https://en.wikipedia.org/wiki/Phyllotaxis" target="_blank" rel="noopener noreferrer">Vogel, H. (1979)</a></p>',
    );
  });

  it('escapes HTML in the source text and url', () => {
    const out = renderCitation('<b>Evil</b> & Co.', 'https://example.com/?q="x"');
    expect(out).not.toContain('<b>Evil</b>');
    expect(out).toContain('&lt;b&gt;Evil&lt;/b&gt; &amp; Co.');
    expect(out).toContain('href="https://example.com/?q=&quot;x&quot;"');
  });

  // Most citations carry no DOI — a 1704 memoir and a Wikipedia article have
  // none — so the absent case is the common one and must render nothing at all
  // rather than an empty line under every explainer.
  it('omits the DOI line when the citation carries none', () => {
    const out = renderCitation('Vogel, H. (1979)', 'https://example.com');
    expect(out).not.toContain('explain-doi');
  });

  it('renders one resolvable doi.org link per DOI, in the given order', () => {
    const out = renderCitation('Cromwell and Konig', 'https://example.com', [
      '10.1007/BF03025256',
      '10.1007/BF01456961',
    ]);
    expect(out).toContain('<p class="explain-doi">');
    expect(out).toContain('href="https://doi.org/10.1007/BF03025256"');
    expect(out).toContain('>doi.org/10.1007/BF03025256</a>');
    expect(out.indexOf('BF03025256')).toBeLessThan(out.indexOf('BF01456961'));
  });
});
