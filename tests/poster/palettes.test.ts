import { describe, it, expect } from 'vitest';
import { PALETTES, resolvePalette } from '../../src/poster/palettes';

describe('palettes', () => {
  it('leads with the two monochrome defaults', () => {
    expect(PALETTES[0]!.id).toBe('mono-light');
    expect(PALETTES[1]!.id).toBe('mono-dark');
  });

  it('resolves a palette id', () => {
    expect(resolvePalette({ pal: 'mono-light' })).toMatchObject({ paper: '#ffffff' });
  });

  it('falls back to mono-dark for unknown ids', () => {
    expect(resolvePalette({ pal: 'nope' })).toMatchObject({ paper: '#17171a' });
    expect(resolvePalette({})).toMatchObject({ paper: '#17171a', ink: '#ececea' });
  });

  it('lets explicit hex overrides win over pal', () => {
    const p = resolvePalette({ pal: 'mono-light', bg: '131a2b', ink: 'e8dcc0', acc: 'd9a441' });
    expect(p).toEqual({ paper: '#131a2b', ink: '#e8dcc0', accent: '#d9a441' });
  });

  it('rejects malformed hex overrides', () => {
    const p = resolvePalette({ bg: 'xyz', ink: '<script>' });
    expect(p).toMatchObject({ paper: '#17171a', ink: '#ececea' });
  });
});
