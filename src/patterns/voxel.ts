import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

/** A kept lattice cell, plus the tie-break jitter drawn for it during scattering. */
interface Cell {
  i: number;
  j: number;
  k: number;
  jitter: number;
}

type Vec2 = [number, number];

const round2 = (n: number): number => Math.round(n * 100) / 100;

function centroid(pts: Vec2[]): Vec2 {
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  return [cx / pts.length, cy / pts.length];
}

/** Shrink a face polygon toward its own centroid by factor f = 1 - gap. */
function shrink(pts: Vec2[], f: number): Vec2[] {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]): Vec2 => [cx + (x - cx) * f, cy + (y - cy) * f]);
}

function pointsAttr(pts: Vec2[]): string {
  return pts.map(([x, y]) => `${round2(x)},${round2(y)}`).join(' ');
}

export const voxel = definePattern({
  id: 'voxel',
  family: 'isometric',
  phase: 1,
  heavy: true,
  usesSeed: true,
  params: [
    { key: 'shape', kind: 'enum', min: 0, max: 2, step: 1, default: 0, label: 'voxel.shape', options: ['voxel.sphere', 'voxel.cube', 'voxel.torus'] },
    { key: 'dimension', kind: 'int', min: 4, max: 18, step: 1, default: 12, label: 'voxel.dimension' },
    { key: 'gap', kind: 'float', min: 0, max: 0.4, step: 0.01, default: 0.08, label: 'voxel.gap' },
    { key: 'shellOnly', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'voxel.shellOnly' },
    { key: 'scatter', kind: 'float', min: 0, max: 0.6, step: 0.01, default: 0, label: 'voxel.scatter' },
    { key: 'faceShading', kind: 'float', min: 0, max: 1, step: 0.01, default: 0.75, label: 'voxel.faceShading' },
    { key: 'strokeWidth', kind: 'float', min: 0, max: 1.2, step: 0.05, default: 0.5, label: 'voxel.strokeWidth' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'voxel'));
    const shape = p['shape']!;
    const dimension = p['dimension']!;
    const gap = p['gap']!;
    const shellOnly = p['shellOnly']! >= 0.5;
    const scatter = p['scatter']!;
    const faceShading = p['faceShading']!;
    const strokeWidth = p['strokeWidth']!;

    const D = Math.floor(dimension / 2);
    const D2 = D * D;
    const R = D * 0.62;
    const rr = D * 0.3;

    const inShape = (i: number, j: number, k: number): boolean => {
      if (shape === 0) return i * i + j * j + k * k <= D2;
      if (shape === 1) return true;
      const d = Math.hypot(i, k) - R;
      return d * d + j * j <= rr * rr;
    };

    // 1. Base lattice, per the chosen bounding shape.
    const baseKeys = new Set<string>();
    const base: [number, number, number][] = [];
    for (let i = -D; i <= D; i++) {
      for (let j = -D; j <= D; j++) {
        for (let k = -D; k <= D; k++) {
          if (inShape(i, j, k)) {
            base.push([i, j, k]);
            baseKeys.add(`${i},${j},${k}`);
          }
        }
      }
    }

    const isShellCell = ([i, j, k]: [number, number, number]): boolean => {
      const full =
        baseKeys.has(`${i + 1},${j},${k}`) && baseKeys.has(`${i - 1},${j},${k}`) &&
        baseKeys.has(`${i},${j + 1},${k}`) && baseKeys.has(`${i},${j - 1},${k}`) &&
        baseKeys.has(`${i},${j},${k + 1}`) && baseKeys.has(`${i},${j},${k - 1}`);
      return !full;
    };

    // 2. One PRNG stream, drawn in deterministic (i,j,k) order over the FULL base
    //    lattice (not the shellOnly-filtered subset): every cell's random draw then
    //    depends only on its own coordinates, never on how many other cells happened
    //    to survive shellOnly. That draw doubles as a depth tie-break jitter (see step
    //    5), and keeping it population-independent is required for correctness: two
    //    shell cells can share both a screen-space edge and a depth key (i+j+k), so if
    //    their jitter values shifted depending on whether interior cells were also in
    //    the stream, shellOnly on vs off could pick a different winner at that shared
    //    edge and the two would no longer render identically for a solid form.
    const ordered = [...base].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    const cells: Cell[] = [];
    for (const [i, j, k] of ordered) {
      const r = rnd();
      if (shellOnly && !isShellCell([i, j, k])) continue;
      if (r < scatter) continue;
      cells.push({ i, j, k, jitter: r });
    }

    if (cells.length === 0) {
      return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, []);
    }

    // 4. Isometric projection at unit cube edge (s = 1); fit-to-frame scale applied after.
    const s = 1;
    const w = (s * Math.sqrt(3)) / 2;
    const h = s / 2;
    const v = s;
    const f = 1 - gap;

    interface Face { pts: Vec2[]; fillOpacity: number }
    interface Built { cell: Cell; faces: Face[] }

    const built: Built[] = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const cell of cells) {
      const { i, j, k } = cell;
      const px = (i - k) * w;
      const py = (i + k) * h - j * v;
      const top: Vec2[] = [[0, 0], [w, h], [0, 2 * h], [-w, h]];
      const left: Vec2[] = [[-w, h], [0, 2 * h], [0, 2 * h + v], [-w, h + v]];
      const right: Vec2[] = [[w, h], [0, 2 * h], [0, 2 * h + v], [w, h + v]];
      const faces: Face[] = [
        { pts: shrink(top, f).map(([x, y]): Vec2 => [px + x, py + y]), fillOpacity: 1 },
        { pts: shrink(left, f).map(([x, y]): Vec2 => [px + x, py + y]), fillOpacity: 1 - 0.45 * faceShading },
        { pts: shrink(right, f).map(([x, y]): Vec2 => [px + x, py + y]), fillOpacity: 1 - 0.75 * faceShading },
      ];
      for (const face of faces) {
        for (const [x, y] of face.pts) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      built.push({ cell, faces });
    }

    // 5. Fit the projected form inside the frame.
    const bw = Math.max(maxX - minX, 1e-6);
    const bh = Math.max(maxY - minY, 1e-6);
    const scale = (0.86 * Math.min(size.w, size.h)) / Math.max(bw, bh);
    const bcx = (minX + maxX) / 2, bcy = (minY + maxY) / 2;
    const fcx = size.w / 2, fcy = size.h / 2;
    const project = ([x, y]: Vec2): Vec2 => [(x - bcx) * scale + fcx, (y - bcy) * scale + fcy];

    // 6. Painter's algorithm: draw nearer cubes last. Depth axis is i+j+k (verified
    //    empirically — the only candidate under which a shellOnly=1 render is
    //    pixel-identical to the shellOnly=0 solid render). A cell's jitter breaks ties
    //    among cells sharing a depth value; those cells never share screen space (the
    //    (1,1,1) diagonal is the sole direction with zero screen displacement, and
    //    stepping along it changes i+j+k by 3), so the tie-break is visually inert but
    //    keeps output seed-dependent.
    built.sort((a, b) => {
      const da = a.cell.i + a.cell.j + a.cell.k + a.cell.jitter * 1e-6;
      const db = b.cell.i + b.cell.j + b.cell.k + b.cell.jitter * 1e-6;
      return da - db;
    });

    const children: SvgNode[] = [];
    for (const { faces } of built) {
      for (const face of faces) {
        children.push(el('polygon', {
          points: pointsAttr(face.pts.map(project)),
          fill: 'ink',
          'fill-opacity': face.fillOpacity,
          stroke: 'paper',
          'stroke-width': strokeWidth,
          'stroke-linejoin': 'round',
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
