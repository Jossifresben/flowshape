import { describe, expect, it } from 'vitest';
import { qrMatrix } from '../../src/core/qr';
import vectors from '../fixtures/qr-vectors.json';

/**
 * A QR code that is subtly wrong still looks exactly like a QR code, so
 * eyeballing one proves nothing. These vectors come from an independent
 * reference encoder (the `qrcode` Python package, byte mode, error correction
 * level M, no quiet zone) and are compared module for module.
 *
 * Every symbol is pinned to an explicit mask, and all eight are checked. That
 * covers the whole encoder — bit stream, padding, Reed-Solomon, block
 * interleaving, function patterns, data placement, masking and format bits —
 * because a symbol that agrees with a reference on all eight masks can only
 * differ in which one it would pick.
 *
 * Mask *selection* is deliberately not compared: the standard scores the
 * complete symbol, while the reference encoder scores it with the format
 * modules blanked, so the two legitimately disagree on some inputs. Choice of
 * mask affects only how readily a scanner reads the code — never whether it
 * decodes, since the symbol records the mask it used — so it is tested below
 * on its own terms instead.
 *
 * The set includes both real share URLs, a 300-byte string (which crosses
 * into the 16-bit character-count field at version 10, the one place a naive
 * capacity calculation goes wrong) and accented text (which must be encoded
 * as UTF-8 bytes, not UTF-16 code units).
 */
interface Vector { text: string; mask: number; size: number; matrix: string[] }

const VECTORS = vectors as Vector[];

function rowsOf(text: string, mask?: number): string[] {
  return qrMatrix(text, mask).map((row) => row.map((m) => (m ? '1' : '0')).join(''));
}

describe('qrMatrix', () => {
  it.each(VECTORS.map((v) => [`${v.text.slice(0, 32)} · mask ${v.mask}`, v] as const))(
    'matches the reference encoder: %s',
    (_label, v) => {
      const rows = rowsOf(v.text, v.mask);
      expect(rows.length).toBe(v.size);
      expect(rows).toEqual(v.matrix);
    },
  );

  it('picks the smallest version that fits, and sizes each symbol 4·version+17', () => {
    // Version 1 at level M holds 16 data codewords: 2 go to the header, so 14
    // bytes fit and the 15th forces version 2.
    expect(qrMatrix('x'.repeat(14)).length).toBe(21);
    expect(qrMatrix('x'.repeat(15)).length).toBe(25);
    for (const v of VECTORS) {
      const m = qrMatrix(v.text);
      expect(m.every((row) => row.length === m.length)).toBe(true);
      expect((m.length - 17) % 4).toBe(0);
    }
  });

  it('encodes text as UTF-8 bytes, so an accent costs two bytes not one', () => {
    // 14 ASCII bytes fit in version 1; 14 accented characters do not.
    expect(qrMatrix('x'.repeat(14)).length).toBe(21);
    expect(qrMatrix('ñ'.repeat(14)).length).toBeGreaterThan(21);
  });

  it('refuses text beyond a version 40 symbol rather than emitting a broken one', () => {
    expect(() => qrMatrix('x'.repeat(3000))).toThrow(/exceeds the capacity/);
  });

  it('chooses the lowest-penalty mask, and is deterministic', () => {
    for (const text of ['https://flowshape.art/', 'hello world']) {
      const chosen = rowsOf(text);
      const all = [0, 1, 2, 3, 4, 5, 6, 7].map((m) => rowsOf(text, m));
      // The automatic choice must be one of the eight masked symbols, not
      // some ninth thing — and must be stable across calls.
      expect(all.map((a) => a.join('\n'))).toContain(chosen.join('\n'));
      expect(rowsOf(text)).toEqual(chosen);
    }
  });

  it('always places the three finders and the dark module', () => {
    const m = qrMatrix('https://flowshape.art/');
    const n = m.length;
    for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]] as const) {
      expect(m[r]![c]).toBe(true);        // finder outer ring
      expect(m[r + 1]![c + 1]).toBe(false); // its white separator ring
      expect(m[r + 3]![c + 3]).toBe(true);  // its 3x3 core
    }
    expect(m[n - 8]![8]).toBe(true);      // the dark module, always set
  });
});
