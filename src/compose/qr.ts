/**
 * A minimal QR encoder: byte mode, error-correction level M, versions 1–3.
 *
 * Written out rather than pulled in because the project ships zero runtime
 * dependencies and because a QR symbol is a closed, fully specified algorithm —
 * the same reason the Delaunay and Voronoi generators are here in full. Range
 * is deliberately small: version 3 at level M holds 42 bytes, comfortably more
 * than the wordmark URL a poster carries, and staying inside single-block
 * versions removes the interleaving tables entirely.
 *
 * Correctness is not asserted by reading the spec back. `tests/compose/qr.test.ts`
 * compares every matrix, module for module, against the `qrcode` package (a dev
 * dependency, never shipped) across a range of inputs and versions.
 *
 * Reference: ISO/IEC 18004. Level M corrects ~15% of codewords, which is the
 * usual choice for print.
 */

// --- GF(256), primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D) --------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;
}

/**
 * The generator polynomial for `n` error-correction codewords: the product of
 * (x - α^i) for i in 0…n-1.
 *
 * Coefficients are highest-degree-first, which is what the division below
 * indexes. (Building them lowest-first and reading them highest-first produces
 * a symbol whose function patterns are perfect and whose data is nonsense — it
 * looks like a QR code and scans as nothing.)
 */
function generatorPoly(n: number): number[] {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] = (next[j] ?? 0) ^ poly[j]!;
      next[j + 1] = (next[j + 1] ?? 0) ^ gfMul(poly[j]!, EXP[i]!);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: number[], ecCount: number): number[] {
  const gen = generatorPoly(ecCount);
  const rem = new Array<number>(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0]!;
    rem.shift();
    rem.push(0);
    for (let i = 0; i < ecCount; i++) {
      rem[i] = rem[i]! ^ gfMul(gen[i + 1]!, factor);
    }
  }
  return rem;
}

// --- capacity, level M, single-block versions only --------------------------

interface VersionSpec { version: number; dataCodewords: number; ecCodewords: number }

const VERSIONS: VersionSpec[] = [
  { version: 1, dataCodewords: 16, ecCodewords: 10 },
  { version: 2, dataCodewords: 28, ecCodewords: 16 },
  { version: 3, dataCodewords: 44, ecCodewords: 26 },
];

/** Alignment-pattern centres per version. Version 1 has none. */
const ALIGNMENT: Record<number, number[]> = { 1: [], 2: [6, 18], 3: [6, 22] };

export class QrTooLongError extends Error {
  constructor(bytes: number) {
    super(`${bytes} bytes exceeds version 3 at level M (42 bytes)`);
    this.name = 'QrTooLongError';
  }
}

// --- encoding ---------------------------------------------------------------

function toBytes(text: string): number[] {
  return [...new TextEncoder().encode(text)];
}

function bitStream(bytes: number[], spec: VersionSpec): number[] {
  const bits: number[] = [];
  const push = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);          // byte mode
  push(bytes.length, 8);    // character count — 8 bits for versions 1–9
  for (const b of bytes) push(b, 8);

  const capacity = spec.dataCodewords * 8;
  // Terminator: up to four zero bits, fewer if the stream is nearly full.
  push(0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad alternately with the two codewords the spec names.
  const pad = [0xec, 0x11];
  for (let i = 0; bits.length < capacity; i++) push(pad[i % 2]!, 8);
  return bits;
}

function bitsToBytes(bits: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
    out.push(byte);
  }
  return out;
}

// --- matrix -----------------------------------------------------------------

type Grid = boolean[][];

function blank(size: number): Grid {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
}

function placeFinder(m: Grid, fn: Grid, row: number, col: number): void {
  // The 7x7 finder plus its one-module separator, clipped to the grid.
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || y >= m.length || x < 0 || x >= m.length) continue;
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[y]![x] = (r >= 0 && r <= 6 && c >= 0 && c <= 6) && (edge || core);
      fn[y]![x] = true;
    }
  }
}

function placeAlignment(m: Grid, fn: Grid, version: number): void {
  const centres = ALIGNMENT[version] ?? [];
  for (const cy of centres) {
    for (const cx of centres) {
      // Skip the three that would land on a finder pattern.
      const onFinder =
        (cy === 6 && cx === 6) ||
        (cy === 6 && cx === centres[centres.length - 1]) ||
        (cy === centres[centres.length - 1] && cx === 6);
      if (onFinder) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          m[cy + r]![cx + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          fn[cy + r]![cx + c] = true;
        }
      }
    }
  }
}

function placeTiming(m: Grid, fn: Grid): void {
  const size = m.length;
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    m[6]![i] = dark; fn[6]![i] = true;
    m[i]![6] = dark; fn[i]![6] = true;
  }
}

function reserveFormat(fn: Grid): void {
  const size = fn.length;
  for (let i = 0; i < 9; i++) {
    fn[8]![i] = true;
    fn[i]![8] = true;
  }
  for (let i = 0; i < 8; i++) {
    fn[8]![size - 1 - i] = true;
    fn[size - 1 - i]![8] = true;
  }
}

/** Zigzag placement: two-module columns, right to left, skipping column 6. */
function placeData(m: Grid, fn: Grid, bits: number[]): void {
  const size = m.length;
  let idx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (fn[row]![col]) continue;
        m[row]![col] = (bits[idx++] ?? 0) === 1;
      }
    }
    upward = !upward;
  }
}

const MASKS: Array<(r: number, c: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(m: Grid, fn: Grid, mask: number): Grid {
  const test = MASKS[mask]!;
  return m.map((row, r) => row.map((v, c) => (fn[r]![c] ? v : v !== test(r, c))));
}

/** The four penalty rules, summed. Lower is better. */
function penalty(m: Grid): number {
  const size = m.length;
  let score = 0;

  // Rule 1 — runs of five or more.
  const runScore = (line: boolean[]): number => {
    let total = 0;
    let run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) run++;
      else { if (run >= 5) total += 3 + (run - 5); run = 1; }
    }
    return run >= 5 ? total + 3 + (run - 5) : total;
  };
  for (let i = 0; i < size; i++) {
    score += runScore(m[i]!);
    score += runScore(m.map((row) => row[i]!));
  }

  // Rule 2 — 2x2 blocks of one colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r]![c];
      if (v === m[r]![c + 1] && v === m[r + 1]![c] && v === m[r + 1]![c + 1]) score += 3;
    }
  }

  // Rule 3 — the finder-like 1:1:3:1:1 sequence with four light modules beside it.
  const A = [true, false, true, true, true, false, true, false, false, false, false];
  const B = [false, false, false, false, true, false, true, true, true, false, true];
  const matches = (line: boolean[], at: number, pat: boolean[]): boolean =>
    pat.every((v, k) => line[at + k] === v);
  for (let i = 0; i < size; i++) {
    const row = m[i]!;
    const col = m.map((r) => r[i]!);
    for (let j = 0; j + 11 <= size; j++) {
      if (matches(row, j, A) || matches(row, j, B)) score += 40;
      if (matches(col, j, A) || matches(col, j, B)) score += 40;
    }
  }

  // Rule 4 — deviation from an even split of dark and light.
  const dark = m.flat().filter(Boolean).length;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

/** BCH(15,5) format information for level M, XORed with the spec's mask. */
function formatBits(mask: number): number {
  const LEVEL_M = 0b00;
  let value = (LEVEL_M << 3) | mask;
  let bch = value << 10;
  for (let i = 4; i >= 0; i--) {
    if ((bch >> (i + 10)) & 1) bch ^= 0b10100110111 << i;
  }
  value = ((value << 10) | bch) ^ 0b101010000010010;
  return value;
}

function placeFormat(m: Grid, mask: number): void {
  const size = m.length;
  const bits = formatBits(mask);
  for (let i = 0; i < 15; i++) {
    const bit = ((bits >> i) & 1) === 1;
    // Copy beside the top-left finder: the low bits run *down* column 8, the
    // high bits run *left to right* along row 8. Transposing these two is the
    // one mistake that leaves every function pattern and every data module
    // correct while the symbol still refuses to decode.
    if (i < 6) m[i]![8] = bit;
    else if (i === 6) m[7]![8] = bit;
    else if (i === 7) m[8]![8] = bit;
    else if (i === 8) m[8]![7] = bit;
    else m[8]![14 - i] = bit;
    // Second copy, split between the other two finders.
    if (i < 8) m[8]![size - 1 - i] = bit;
    else m[size - 15 + i]![8] = bit;
  }
  m[size - 8]![8] = true; // the always-dark module
}

// --- public -----------------------------------------------------------------

export interface QrSymbol {
  /** `size × size` modules; `true` is dark. */
  modules: boolean[][];
  size: number;
  version: number;
}

/**
 * Encodes `text` as a QR symbol at error-correction level M.
 * Throws `QrTooLongError` above 42 bytes.
 */
export function encodeQr(text: string): QrSymbol {
  const bytes = toBytes(text);
  // Two codewords go to the mode indicator and character count.
  const spec = VERSIONS.find((v) => bytes.length + 2 <= v.dataCodewords);
  if (!spec) throw new QrTooLongError(bytes.length);

  const data = bitsToBytes(bitStream(bytes, spec));
  const codewords = [...data, ...reedSolomon(data, spec.ecCodewords)];
  const bits = codewords.flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (b >> i) & 1));

  const size = spec.version * 4 + 17;
  const base = blank(size);
  const fn = blank(size);
  placeFinder(base, fn, 0, 0);
  placeFinder(base, fn, 0, size - 7);
  placeFinder(base, fn, size - 7, 0);
  placeAlignment(base, fn, spec.version);
  placeTiming(base, fn);
  reserveFormat(fn);
  fn[size - 8]![8] = true; // dark module is a function module
  placeData(base, fn, bits);

  // Every mask is built and scored; the lowest penalty wins.
  let best: Grid | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = applyMask(base, fn, mask);
    placeFormat(candidate, mask);
    const score = penalty(candidate);
    if (score < bestScore) { bestScore = score; best = candidate; }
  }
  return { modules: best!, size, version: spec.version };
}
