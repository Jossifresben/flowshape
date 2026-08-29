import { describe, it, expect } from 'vitest';
import { el, serialize, type SvgNode, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#1c1b22', accent: '#e3261a' };

describe('serialize', () => {
  it('renders a node tree with resolved role colors', () => {
    const tree: SvgNode = el('svg', { viewBox: '0 0 100 100' }, [
      el('circle', { cx: 50, cy: 50, r: 10, fill: 'ink' }),
      el('path', { d: 'M0 0L10 10', stroke: 'accent', fill: 'none' }),
    ]);
    expect(serialize(tree, pal)).toBe(
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="50" cy="50" r="10" fill="#1c1b22"/>' +
        '<path d="M0 0L10 10" stroke="#e3261a" fill="none"/>' +
        '</svg>',
    );
  });

  it('escapes attribute values', () => {
    const tree = el('svg', { 'data-x': 'a"<b>&' });
    expect(serialize(tree, pal)).toContain('data-x="a&quot;&lt;b&gt;&amp;"');
  });

  it('rounds numeric attributes to 2 decimals', () => {
    const tree = el('svg', {}, [el('circle', { cx: 1.23456, cy: 2, r: 0.100001 })]);
    expect(serialize(tree, pal)).toContain('cx="1.23"');
    expect(serialize(tree, pal)).toContain('r="0.1"');
  });
});
