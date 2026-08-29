import { describe, it, expect } from 'vitest';
import { approxMeasure } from '../../src/compose/measure';
import { wrap, fitTitle, truncateDescription, formatInt, formatValue } from '../../src/compose/text';

const m = approxMeasure(0.5); // 0.5 * size px per character

describe('wrap', () => {
  it('breaks on words and never mid-word', () => {
    expect(wrap('Voxel form', 200, 100, m)).toEqual(['Voxel', 'form']);
    expect(wrap('Voxel form', 2000, 100, m)).toEqual(['Voxel form']);
  });

  it('keeps a single over-wide word on its own line', () => {
    expect(wrap('Supercalifragilistic', 10, 100, m)).toEqual(['Supercalifragilistic']);
  });

  it('returns nothing for empty input', () => {
    expect(wrap('   ', 200, 100, m)).toEqual([]);
  });
});

describe('fitTitle', () => {
  it('keeps the declared size when the title already fits', () => {
    const fit = fitTitle('Voxel form', 600, 2, 128, 76, m)!;
    expect(fit.size).toBe(128);
    expect(fit.lines).toHaveLength(2);
  });

  it('steps the size down until the line count fits', () => {
    // At 128 this wraps to four lines; it reaches two at ~100.
    const fit = fitTitle('Times-Table Chords Extended Edition', 900, 2, 128, 76, m)!;
    expect(fit.size).toBeLessThan(128);
    expect(fit.size).toBeGreaterThanOrEqual(76);
    expect(fit.lines).toEqual(['Times-Table Chords', 'Extended Edition']);
  });

  it('fails the render rather than ellipsing below the floor', () => {
    expect(fitTitle('a b c d e f g h i j k l m n o p', 60, 2, 128, 76, m)).toBeNull();
  });

  it('leaves a one-word title on one line', () => {
    expect(fitTitle('Harmonograph', 100, 2, 128, 76, m)!.lines).toEqual(['Harmonograph']);
  });
});

describe('truncateDescription', () => {
  it('leaves short text alone', () => {
    expect(truncateDescription('A cubic lattice.', 140)).toBe('A cubic lattice.');
  });

  it('cuts at a word boundary and appends an ellipsis', () => {
    const long = 'word '.repeat(40).trim();
    const out = truncateDescription(long, 140);
    expect(out.length).toBeLessThanOrEqual(141);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toContain('wor…');
  });
});

describe('formatting', () => {
  it('separates thousands with a thin space, not a comma', () => {
    expect(formatInt(1704)).toBe('1\u2009704');
    expect(formatInt(999)).toBe('999');
    expect(formatInt(1704)).not.toContain(',');
    expect(formatInt(1234567)).toBe('1\u2009234\u2009567');
  });

  it('formats by param kind', () => {
    expect(formatValue(1704, 'int')).toBe('1\u2009704');
    expect(formatValue(0.618034, 'float')).toBe('0.62');
    expect(formatValue(1, 'bool')).toBe('ON');
    expect(formatValue(0, 'bool')).toBe('OFF');
    expect(formatValue(2, 'enum')).toBe('2');
  });
});
