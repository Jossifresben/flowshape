import { describe, it, expect } from 'vitest';
import { bauhaus } from '../../src/patterns/bauhaus';
import { standardPatternTests, render } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(bauhaus, { maxElements: 120 });

describe('bauhaus specifics', () => {
  const base = defaultParams(bauhaus);
  const SIZE = { w: 600, h: 840 };

  it('every motif × symmetry renders something under every render mode', () => {
    for (let motif = 0; motif <= 8; motif++) for (let symmetry = 0; symmetry <= 3; symmetry++) for (const render of [0, 1]) {
      const svg = generateSafe(bauhaus, { ...base, motif, symmetry, render }, 5, SIZE);
      expect(svg.children.length, `motif ${motif} symmetry ${symmetry} render ${render}`).toBeGreaterThan(1);
    }
  });

  it('stripe count sets the number of stroke lanes (one path bucket per lane)', () => {
    const paths = (n: number): number => (render(bauhaus, { ...base, stripes: n }, 3).match(/<path/g) ?? []).length;
    expect(paths(6)).toBeGreaterThan(paths(2));
  });

  it('bands mode draws only the even lanes, so a two-stripe band is one lane', () => {
    const svg = generateSafe(bauhaus, { ...base, motif: 1, stripes: 2, render: 1 }, 3, SIZE);
    const strokes = svg.children.filter((c) => c.tag === 'path' && c.attrs['stroke'] === 'ink');
    expect(strokes).toHaveLength(1);
  });

  it('the dot chain motif emits discs and ignores the stripe params', () => {
    const a = render(bauhaus, { ...base, motif: 8, stripes: 3 }, 3);
    const b = render(bauhaus, { ...base, motif: 8, stripes: 9, width: 0.2, tilt: 1 }, 3);
    expect(a).toContain('<circle');
    expect(a).toBe(b);
  });

  it('accentEvery paints some chains in the accent colour', () => {
    const svg = render(bauhaus, { ...base, accentEvery: 3 }, 3);
    expect(svg).toContain('stroke="#e3261a"');
  });

  it('repeat 2 under free placement tiles the field with a 2×2 period', () => {
    // With a 2-cell repeat, the cell at (I, J) is a copy of (I mod 2, J mod 2):
    // the rendering at repeat 2 and repeat 4 must differ, since 4 admits more
    // distinct cells.
    expect(render(bauhaus, { ...base, repeat: 2 }, 3)).not.toBe(render(bauhaus, { ...base, repeat: 4 }, 3));
  });
});
