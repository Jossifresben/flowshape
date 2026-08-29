import { describe, it, expect } from 'vitest';
import { el, elText, serialize, resolveRoles, type Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#f2efe9', ink: '#0d0d0d', accent: '#e5322a' };

describe('text content', () => {
  it('serializes text between the tags', () => {
    const node = elText('text', { x: 10, y: 20, fill: 'ink' }, 'Voxel Form');
    expect(serialize(node, PAL)).toBe('<text x="10" y="20" fill="#0d0d0d">Voxel Form</text>');
  });

  it('escapes text content', () => {
    expect(serialize(elText('text', {}, 'a & b < c'), PAL)).toBe('<text>a &amp; b &lt; c</text>');
  });

  it('still self-closes a node with neither text nor children', () => {
    expect(serialize(el('rect', { x: 0 }), PAL)).toBe('<rect x="0"/>');
  });

  it('keeps an empty string as real content, not a self-close', () => {
    expect(serialize(elText('text', {}, ''), PAL)).toBe('<text></text>');
  });
});

describe('resolveRoles', () => {
  it('replaces role tokens on fill and stroke, at every depth', () => {
    const tree = el('g', { fill: 'ink' }, [
      el('circle', { stroke: 'accent', r: 4 }, []),
      el('g', {}, [el('rect', { fill: 'paper' }, [])]),
    ]);
    const out = resolveRoles(tree, PAL);
    expect(out.attrs['fill']).toBe('#0d0d0d');
    expect(out.children[0]!.attrs['stroke']).toBe('#e5322a');
    expect(out.children[1]!.children[0]!.attrs['fill']).toBe('#f2efe9');
  });

  it('leaves literal colours, numbers and non-role attributes alone', () => {
    const tree = el('rect', { fill: '#abcdef', 'stroke-width': 2, id: 'ink' }, []);
    const out = resolveRoles(tree, PAL);
    expect(out.attrs['fill']).toBe('#abcdef');
    expect(out.attrs['stroke-width']).toBe(2);
    expect(out.attrs['id']).toBe('ink');
  });

  it('does not mutate the input tree', () => {
    const tree = el('rect', { fill: 'ink' }, []);
    resolveRoles(tree, PAL);
    expect(tree.attrs['fill']).toBe('ink');
  });

  it('makes a resolved tree palette-independent', () => {
    const tree = el('rect', { fill: 'ink' }, []);
    const baked = resolveRoles(tree, PAL);
    const other: Palette = { paper: '#000000', ink: '#ffffff', accent: '#00ff00' };
    expect(serialize(baked, other)).toBe(serialize(baked, PAL));
    expect(serialize(baked, other)).toContain('#0d0d0d');
  });

  it('carries text content through unchanged', () => {
    const baked = resolveRoles(elText('text', { fill: 'accent' }, 'Voxel'), PAL);
    expect(baked.text).toBe('Voxel');
    expect(baked.attrs['fill']).toBe('#e5322a');
  });
});
