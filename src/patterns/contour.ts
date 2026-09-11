import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { deriveSeed } from '../core/prng';
import { fbm2D } from '../core/noise';

/**
 * Contour terraces — level sets of a noise field, cut by marching squares.
 *
 * A scalar field v(x, y) ∈ [0, 1] (fractional Brownian value noise, seeded)
 * is sampled on a lattice with pitch CELL. For each threshold t_i = i / N the
 * region { v ≥ t_i } is traced as closed polygons by marching squares
 * (Lorensen & Cline's 2-D case): every lattice cell whose corners straddle t
 * contributes one segment (two on a saddle, split by the centre sample), with
 * the crossing placed by linear interpolation along the edge, and segments
 * are chained edge-to-edge into loops. A ring of samples at −1 outside the
 * frame guarantees every loop closes; its crossings are clamped to the frame
 * edge, so a region that runs off the sheet is drawn to the sheet's edge.
 *
 * Terraces: the regions nest (v ≥ t₂ ⊂ v ≥ t₁), so drawing them lowest first
 * is a painter's stack — every level genuinely covers the one below it, and
 * with fill-rule evenodd the holes (a dip inside a plateau) come out on their
 * own. Fills alternate ink / paper, with every k-th level in accent. Isolines:
 * the same loops as hairline strokes.
 *
 * Motion: the sample point walks a small circle in noise space once per
 * cycle (the same device as `flowfield`): value noise is periodic in nothing,
 * so a closed orbit is the only drift that returns to its own field, and
 * (cos − 1, sin) are exactly 0 at phase 0. `% 1` folds phase 1 onto 0.
 */

const CELL = 4;

export const contour = definePattern({
  id: 'contour',
  family: 'fields',
  phase: 1,
  heavy: false,
  usesSeed: true,
  anim: { continuous: ['noiseScale', 'contrast', 'strokeWidth', 'size'], usesPhase: true },
  params: [
    { key: 'noiseScale', kind: 'float', min: 0.002, max: 0.02, step: 0.0005, default: 0.006, label: 'contour.noiseScale' },
    { key: 'octaves', kind: 'int', min: 1, max: 5, step: 1, default: 3, label: 'contour.octaves' },
    { key: 'levels', kind: 'int', min: 2, max: 16, step: 1, default: 7, label: 'contour.levels' },
    { key: 'contrast', kind: 'float', min: 0.6, max: 3, step: 0.05, default: 1.6, label: 'contour.contrast' },
    { key: 'mode', kind: 'enum', min: 0, max: 1, step: 1, default: 0, label: 'contour.mode', options: ['contour.terraces', 'contour.isolines'] },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 3, step: 0.05, default: 0.6, label: 'contour.strokeWidth', dependsOn: { key: 'mode', values: [1] } },
    { key: 'accentEvery', kind: 'int', min: 0, max: 8, step: 1, default: 3, label: 'contour.accentEvery' },
  ],
  generate(p, seed, size) {
    const noise = fbm2D(deriveSeed(seed, 'contour'), p['octaves']!);
    const s = p['noiseScale']!;
    const ph = (p['phase'] ?? 0) % 1;
    const R = 0.5;
    const ox = R * (Math.cos(2 * Math.PI * ph) - 1);
    const oy = R * Math.sin(2 * Math.PI * ph);
    const contrast = p['contrast']!;

    // Padded lattice: real samples at i = 0..nx-1 (x = i·CELL), plus a ring
    // at −1 on every side so every level set closes.
    const nx = Math.ceil(size.w / CELL) + 1, ny = Math.ceil(size.h / CELL) + 1;
    const W = nx + 2, H = ny + 2;
    const G = new Float32Array(W * H).fill(-1);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const v = 0.5 + 0.5 * contrast * noise(i * CELL * s + ox, j * CELL * s + oy);
        G[(i + 1) + (j + 1) * W] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
    }
    // Lattice coordinates of padded sample (I, J): x = (I − 1)·CELL, clamped
    // to the frame so the ring's crossings land on the sheet edge.
    const X = (I: number): number => Math.min(size.w, Math.max(0, (I - 1) * CELL));
    const Y = (J: number): number => Math.min(size.h, Math.max(0, (J - 1) * CELL));

    // Edge ids: horizontal edge (I,J)–(I+1,J) is 2·(J·W + I), vertical edge
    // (I,J)–(I,J+1) is that + 1. Each crossing point is computed once per
    // level and shared by the two cells that meet on the edge.
    const E = W * H * 2;
    const px = new Float32Array(E), py = new Float32Array(E);
    // 1 where the crossing was interpolated against the −1 ring, i.e. the
    // point sits on the sheet edge. Isolines break the loop there rather than
    // stroke the frame; terraces keep the loop closed so the fill reaches it.
    const onRing = new Uint8Array(E);
    const slotA = new Int32Array(E), slotB = new Int32Array(E);
    const segE0: number[] = [], segE1: number[] = [];

    const f = (v: number): string => (Math.round(v * 10) / 10).toString();

    const levelPath = (t: number, open: boolean): string => {
      slotA.fill(-1); slotB.fill(-1);
      segE0.length = 0; segE1.length = 0;
      const cross = (I0: number, J0: number, I1: number, J1: number, e: number): void => {
        const a = G[I0 + J0 * W]!, b = G[I1 + J1 * W]!;
        const u = (t - a) / (b - a);
        px[e] = X(I0) + (X(I1) - X(I0)) * u;
        py[e] = Y(J0) + (Y(J1) - Y(J0)) * u;
        onRing[e] = a < 0 || b < 0 ? 1 : 0;
      };
      const seg = (e0: number, e1: number): void => {
        const k = segE0.length;
        segE0.push(e0); segE1.push(e1);
        if (slotA[e0]! < 0) slotA[e0] = k; else slotB[e0] = k;
        if (slotA[e1]! < 0) slotA[e1] = k; else slotB[e1] = k;
      };
      for (let J = 0; J < H - 1; J++) {
        for (let I = 0; I < W - 1; I++) {
          const tl = G[I + J * W]!, tr = G[I + 1 + J * W]!, br = G[I + 1 + (J + 1) * W]!, bl = G[I + (J + 1) * W]!;
          const c = (tl >= t ? 8 : 0) | (tr >= t ? 4 : 0) | (br >= t ? 2 : 0) | (bl >= t ? 1 : 0);
          if (c === 0 || c === 15) continue;
          const top = 2 * (J * W + I), bottom = 2 * ((J + 1) * W + I);
          const left = top + 1, right = 2 * (J * W + I + 1) + 1;
          if (c & 8 ? !(c & 4) : !!(c & 4)) cross(I, J, I + 1, J, top);
          if (c & 1 ? !(c & 2) : !!(c & 2)) cross(I, J + 1, I + 1, J + 1, bottom);
          if (c & 8 ? !(c & 1) : !!(c & 1)) cross(I, J, I, J + 1, left);
          if (c & 4 ? !(c & 2) : !!(c & 2)) cross(I + 1, J, I + 1, J + 1, right);
          switch (c) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 5: // TR + BL: the centre sample decides which pair joins.
              if ((tl + tr + br + bl) / 4 >= t) { seg(left, top); seg(bottom, right); }
              else { seg(left, bottom); seg(top, right); }
              break;
            case 10: // TL + BR
              if ((tl + tr + br + bl) / 4 >= t) { seg(top, right); seg(bottom, left); }
              else { seg(top, left); seg(right, bottom); }
              break;
          }
        }
      }
      // Chain segments into loops. Every crossing edge carries exactly two
      // segments (one per adjacent cell), so following the "other" segment
      // at each edge walks the loop back to its start.
      const used = new Uint8Array(segE0.length);
      let d = '';
      for (let k0 = 0; k0 < segE0.length; k0++) {
        if (used[k0]) continue;
        used[k0] = 1;
        const start = segE0[k0]!;
        let prev = start;
        let e = segE1[k0]!;
        d += 'M' + f(px[start]!) + ' ' + f(py[start]!);
        let guard = segE0.length + 1;
        while (e !== start && guard-- > 0) {
          // An open line lifts the pen along the sheet edge: a segment whose
          // both ends sit on the ring is the frame, not a contour.
          const lift = open && onRing[prev] && onRing[e];
          d += (lift ? 'M' : 'L') + f(px[e]!) + ' ' + f(py[e]!);
          const k = slotA[e]! >= 0 && !used[slotA[e]!] ? slotA[e]! : slotB[e]! >= 0 && !used[slotB[e]!] ? slotB[e]! : -1;
          if (k < 0) break;
          used[k] = 1;
          prev = e;
          e = segE0[k] === e ? segE1[k]! : segE0[k]!;
        }
        if (open) {
          if (!(onRing[prev] && onRing[start])) d += 'L' + f(px[start]!) + ' ' + f(py[start]!);
        } else {
          d += 'Z';
        }
      }
      return d;
    };

    const N = p['levels']!;
    const every = p['accentEvery']!;
    const isolines = p['mode'] === 1;
    const children: SvgNode[] = [];
    for (let i = 1; i < N; i++) {
      const d = levelPath(i / N, isolines);
      if (!d) continue;
      const accent = every > 0 && i % every === 0;
      if (isolines) {
        children.push(el('path', {
          d, fill: 'none', stroke: accent ? 'accent' : 'ink',
          'stroke-width': accent ? p['strokeWidth']! * 1.6 : p['strokeWidth']!,
          'stroke-linejoin': 'round',
        }));
      } else {
        const fill = accent ? 'accent' : i % 2 === 1 ? 'ink' : 'paper';
        children.push(el('path', { d, fill, 'fill-rule': 'evenodd', stroke: 'none' }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
