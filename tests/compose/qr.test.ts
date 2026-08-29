import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import { encodeQr, QrTooLongError } from '../../src/compose/qr';

/**
 * The reference implementation's matrix, as a boolean grid.
 *
 * Byte mode is forced: `qrcode` auto-selects the most compact mode, so an
 * all-caps or all-digit string would come back alphanumeric or numeric and the
 * comparison would be against a symbol our encoder never claims to produce.
 */
function reference(text: string): { grid: boolean[][]; version: number } {
  const c = QRCode.create([{ data: text, mode: 'byte' }] as never, { errorCorrectionLevel: 'M' });
  const { size, data } = c.modules;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    grid.push([...data.slice(r * size, r * size + size)].map((v) => v === 1));
  }
  return { grid, version: c.version };
}

const CASES = [
  'https://flowshape.art',
  'flowshape.art',
  'A',
  'https://flowshape.art/#/c/voxel',
  'abcdefghijklmnopqrstuvwxyz0123456789AB', // 38 bytes — version 3
  'ñ',                                       // multi-byte UTF-8
];

describe('encodeQr', () => {
  for (const text of CASES) {
    it(`matches the reference implementation for ${JSON.stringify(text)}`, () => {
      const mine = encodeQr(text);
      const ref = reference(text);
      expect(mine.version).toBe(ref.version);
      expect(mine.size).toBe(ref.grid.length);
      // Compare row by row so a failure names the row rather than dumping 625 booleans.
      for (let r = 0; r < mine.size; r++) {
        expect(mine.modules[r], `row ${r}`).toEqual(ref.grid[r]);
      }
    });
  }

  it('encodes the poster wordmark at version 2', () => {
    const q = encodeQr('https://flowshape.art');
    expect(q.version).toBe(2);
    expect(q.size).toBe(25);
  });

  it('is deterministic', () => {
    expect(encodeQr('https://flowshape.art').modules)
      .toEqual(encodeQr('https://flowshape.art').modules);
  });

  it('places the three finder patterns', () => {
    const { modules: m, size } = encodeQr('https://flowshape.art');
    for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]] as const) {
      expect(m[r0 + 0]!.slice(c0, c0 + 7), 'finder top row').toEqual(new Array(7).fill(true));
      expect(m[r0 + 3]![c0 + 3], 'finder centre').toBe(true);
      expect(m[r0 + 1]![c0 + 1], 'finder inner ring').toBe(false);
    }
  });

  it('refuses input beyond version 3 rather than silently truncating', () => {
    expect(() => encodeQr('x'.repeat(43))).toThrow(QrTooLongError);
  });
});
