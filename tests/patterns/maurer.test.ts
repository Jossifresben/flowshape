import { describe, it, expect } from 'vitest';
import { maurer } from '../../src/patterns/maurer';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const size = { w: 600, h: 840 };

describe('maurer', () => {
  it('is deterministic', () => {
    const p = defaultParams(maurer);
    expect(serialize(maurer.generate(p, 1, size), pal)).toBe(
      serialize(maurer.generate(p, 1, size), pal),
    );
  });

  it('emits the walk path and an envelope path when enabled', () => {
    const p = { ...defaultParams(maurer), envelope: 1 };
    const svg = serialize(maurer.generate(p, 1, size), pal);
    expect(svg.match(/<path/g)!.length).toBe(2);
  });

  it('emits only the walk path when envelope is off', () => {
    const p = { ...defaultParams(maurer), envelope: 0 };
    const svg = serialize(maurer.generate(p, 1, size), pal);
    expect(svg.match(/<path/g)!.length).toBe(1);
  });

  it('no NaN across the param matrix', () => {
    for (const n of [1, 6, 8]) {
      for (const d of [1, 71, 359]) {
        const svg = serialize(
          maurer.generate({ ...defaultParams(maurer), n, d }, 1, size),
          pal,
        );
        expect(svg).not.toContain('NaN');
      }
    }
  });

  it('matches the committed snapshot (URL permanence guarantee)', () => {
    expect(serialize(maurer.generate(defaultParams(maurer), 1, size), pal)).toMatchSnapshot();
  });
});
