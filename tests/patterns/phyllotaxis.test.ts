import { describe, it, expect } from 'vitest';
import { phyllotaxis } from '../../src/patterns/phyllotaxis';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const size = { w: 600, h: 840 };

describe('phyllotaxis', () => {
  it('is deterministic: same inputs ⇒ identical SVG', () => {
    const p = defaultParams(phyllotaxis);
    const a = serialize(phyllotaxis.generate(p, 42, size), pal);
    const b = serialize(phyllotaxis.generate(p, 42, size), pal);
    expect(a).toBe(b);
    expect(a.startsWith('<svg')).toBe(true);
  });

  it('emits one circle per point plus accents', () => {
    const p = { ...defaultParams(phyllotaxis), points: 200, accentEvery: 50 };
    const svg = serialize(phyllotaxis.generate(p, 1, size), pal);
    expect(svg.match(/<circle/g)!.length).toBe(200);
    expect(svg.match(/#e3261a/g)!.length).toBe(4); // n = 0, 50, 100, 150
  });

  it('produces no NaN coordinates across the param matrix', () => {
    for (const points of [10, 2000]) {
      for (const angle of [90, 137.50776, 179.9]) {
        for (const radialExp of [0.4, 1]) {
          const svg = serialize(
            phyllotaxis.generate(
              { ...defaultParams(phyllotaxis), points, angle, radialExp },
              7,
              size,
            ),
            pal,
          );
          expect(svg).not.toContain('NaN');
        }
      }
    }
  });

  it('matches the committed snapshot (URL permanence guarantee)', () => {
    expect(serialize(phyllotaxis.generate(defaultParams(phyllotaxis), 1, size), pal)).toMatchSnapshot();
  });
});
