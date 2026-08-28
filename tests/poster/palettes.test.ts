import { describe, it, expect } from 'vitest';
import { PALETTES, resolvePalette } from '../../src/poster/palettes';

describe('palettes', () => {
  it('leads with the two monochrome defaults', () => {
    expect(PALETTES[0]!.id).toBe('mono-light');
    expect(PALETTES[1]!.id).toBe('mono-dark');
  });

  it('resolves a palette id', () => {
    expect(resolvePalette({ pal: 'mono-dark' }, 'light')).toMatchObject({ paper: '#17171a' });
  });

  it('falls back to the theme default for unknown ids', () => {
    expect(resolvePalette({ pal: 'nope' }, 'dark')).toMatchObject({ paper: '#17171a' });
    expect(resolvePalette({}, 'light')).toMatchObject({ paper: '#ffffff', ink: '#1c1b22' });
  });

  it('lets explicit hex overrides win over pal', () => {
    const p = resolvePalette({ pal: 'mono-light', bg: '131a2b', ink: 'e8dcc0', acc: 'd9a441' }, 'light');
    expect(p).toEqual({ paper: '#131a2b', ink: '#e8dcc0', accent: '#d9a441' });
  });

  it('rejects malformed hex overrides', () => {
    const p = resolvePalette({ bg: 'xyz', ink: '<script>' }, 'light');
    expect(p).toMatchObject({ paper: '#ffffff', ink: '#1c1b22' });
  });
});
