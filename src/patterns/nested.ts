import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

type Vec2 = [number, number];

const f2 = (n: number): string => n.toFixed(2);

/** One closed 4-point subpath, appended to a shared `d` string. */
function quad(a: Vec2, b: Vec2, c: Vec2, d: Vec2): string {
  return `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}L${f2(c[0])} ${f2(c[1])}L${f2(d[0])} ${f2(d[1])}Z`;
}

/**
 * The three rhombi of a pointy-top hexagon, as indices into the corner array
 * V (V_k = C + S·(cos(-π/2 + kπ/3), sin(-π/2 + kπ/3))). Each entry is
 * [near, far, near'] so the rhombus is C, V[near], V[far], V[near'].
 *
 * Verified against voxel.ts:158-160: the union of that file's three unit-cube
 * faces, translated so the shared centre vertex sits at the origin, is exactly
 * this hexagon of circumradius = cube edge. Face 0 here is voxel's top, face 1
 * its right (+x), face 2 its left (-x); the tones below follow that identity so
 * a nested core cube shades the same way a voxel cube does.
 */
const FACES: readonly (readonly [number, number, number])[] = [
  [5, 0, 1], // top
  [1, 2, 3], // right
  [3, 4, 5], // left
];

/** Unit-circumradius pointy-top hexagon corners. */
const U: Vec2[] = Array.from({ length: 6 }, (_, k): Vec2 => {
  const a = -Math.PI / 2 + (k * Math.PI) / 3;
  return [Math.cos(a), Math.sin(a)];
});

/** sin 60° — the e₁/e₂ angle, used to convert hatch spacing into b-units. */
const SIN60 = Math.sqrt(3) / 2;

export const nested = definePattern({
  id: 'nested',
  family: 'isometric',
  phase: 1,
  heavy: false,
  // Strictly periodic by construction: no PRNG is imported, let alone called.
  // Every cell of the rhombille lattice carries the identical nest of frames,
  // so a seed could only ever be a lie. Randomize varies the params instead.
  usesSeed: false,
  anim: { continuous: ['faceShading', 'strokeWidth', 'size'] },
  params: [
    // Defaulted large on purpose: the nesting is the subject, and below ~40 the
    // rings collapse into each other and the field reads as riveted plate
    // rather than as shafts receding into the page.
    { key: 'cell', kind: 'int', min: 14, max: 70, step: 1, default: 46, label: 'nested.cell' },
    { key: 'depth', kind: 'int', min: 1, max: 5, step: 1, default: 3, label: 'nested.depth' },
    { key: 'stepRatio', kind: 'float', min: 0.45, max: 0.88, step: 0.01, default: 0.66, label: 'nested.stepRatio' },
    { key: 'coreSize', kind: 'float', min: 0, max: 0.5, step: 0.01, default: 0.22, label: 'nested.coreSize' },
    { key: 'render', kind: 'enum', min: 0, max: 2, step: 1, default: 0, label: 'nested.render', options: ['nested.frames', 'nested.outline', 'nested.hatch'] },
    { key: 'twist', kind: 'bool', min: 0, max: 1, step: 1, default: 0, label: 'nested.twist' },
    { key: 'faceShading', kind: 'float', min: 0.15, max: 1, step: 0.01, default: 0.7, label: 'nested.faceShading' },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 2, step: 0.05, default: 0.6, label: 'nested.strokeWidth' },
  ],
  generate(p, _seed, size) {
    const S = p['cell']!;
    const depth = p['depth']!;
    const ratio = p['stepRatio']!;
    const mode = p['render']!;
    const twist = p['twist']! >= 0.5;
    const fs = p['faceShading']!;
    const sw = p['strokeWidth']!;

    // Degeneracy 1: coreSize and stepRatio^depth can cross (at depth 5 /
    // stepRatio 0.88 the innermost ring's inner edge sits at 0.53 while
    // coreSize reaches 0.5), which fuses the core into the last frame and
    // muddles the centre. Keep the core strictly inside the innermost hole.
    const core = Math.min(p['coreSize']!, Math.pow(ratio, depth) * 0.8);

    // Degeneracy 2: at stepRatio ≈ 0.45 with depth 5 the inner rings collapse
    // below a hairline. Stop once a ring's circumradius is under one stroke
    // diameter — the ring would be pure stroke and no fill would show.
    const scales: number[] = [];
    for (let n = 0; n < depth; n++) {
      const s = Math.pow(ratio, n);
      if (S * s < 2 * sw) break;
      scales.push(s);
    }

    // voxel.ts:162-164's orientation tones, by face identity (top/right/left).
    const TONE = [1, 1 - 0.75 * fs, 1 - 0.45 * fs];

    // One shared `d` string per material. Every subpath below is disjoint from
    // every other in its own bucket, so under fill-rule="nonzero" they fill
    // independently and the whole image costs a handful of elements at any
    // density. The one deliberate exception is the frame pairs: an outer
    // rhombus plus its inner rhombus wound backwards, which cancels to a hole.
    let dPaper = '';
    let dInk = '';
    let dHatch = '';
    let dStroke = '';
    const dCore = ['', '', ''];

    // Rings are concentric scalings of the whole hexagon about its centre, so
    // ring n+1 completely covers ring n's middle: painted as solid rhombi in
    // order, only the band between scale^n and scale^(n+1) of each ring ever
    // stays visible. Emitting those bands directly (outer rhombus + reversed
    // inner rhombus = a hole) gives pixel-for-pixel the same picture while
    // making every subpath in a bucket disjoint — which is what lets ink and
    // paper share two paths instead of needing one element per ring in
    // painter order. The inner rhombus shares the centre vertex C with the
    // outer, so each band is an L-shaped hexagon; the three of them close up
    // into a hexagonal annulus.
    const rMax = Math.ceil(size.h / (S * 1.5)) + 1;
    const qMax = Math.ceil(size.w / (S * Math.sqrt(3))) + 2;
    for (let r = -1; r <= rMax; r++) {
      for (let q = -qMax; q <= qMax; q++) {
        const hx = S * Math.sqrt(3) * (q + r / 2);
        const hy = S * 1.5 * r;
        if (hx < -S || hx > size.w + S || hy < -S || hy > size.h + S) continue;

        for (let n = 0; n < scales.length; n++) {
          const s = scales[n]!;
          const si = s * ratio;
          for (let f = 0; f < 3; f++) {
            const [ka, km, kb] = FACES[f]!;
            const ua = U[ka]!, um = U[km]!, ub = U[kb]!;
            const C: Vec2 = [hx, hy];
            const oa: Vec2 = [hx + S * s * ua[0], hy + S * s * ua[1]];
            const om: Vec2 = [hx + S * s * um[0], hy + S * s * um[1]];
            const ob: Vec2 = [hx + S * s * ub[0], hy + S * s * ub[1]];
            const outline = quad(C, oa, om, ob);

            if (mode === 1) {
              // outline: pure line art, no fills at all. A paper fill here
              // would be indistinguishable from the paper background.
              dStroke += outline;
              continue;
            }

            const isInk = (n + (twist ? f : 0)) % 2 === 0;
            if (!isInk || mode === 0) {
              const ia: Vec2 = [hx + S * si * ua[0], hy + S * si * ua[1]];
              const im: Vec2 = [hx + S * si * um[0], hy + S * si * um[1]];
              const ib: Vec2 = [hx + S * si * ub[0], hy + S * si * ub[1]];
              // Reversed winding ⇒ the inner rhombus punches a hole.
              const band = outline + quad(C, ib, im, ia);
              if (isInk) dInk += band;
              else dPaper += band;
            } else {
              // hatch: parameterise the rhombus as C + a·e₁ + b·e₂ with
              // a,b ∈ [0,1]; the hole is exactly a,b < ratio, so a hatch line
              // at b = const runs a: ratio→1 below the hole and a: 0→1 above
              // it. Exact — no clip path, no overdraw.
              const e1: Vec2 = [S * s * ua[0], S * s * ua[1]];
              const e2: Vec2 = [S * s * ub[0], S * s * ub[1]];
              const edge = S * s * SIN60; // perpendicular span across b
              const gap = Math.max(2 * sw, edge / 7);
              const lines = Math.min(40, Math.floor(edge / gap));
              for (let i = 0; i < lines; i++) {
                const b = (i + 0.5) / lines;
                const a0 = b < ratio ? ratio : 0;
                const x0 = hx + a0 * e1[0] + b * e2[0];
                const y0 = hy + a0 * e1[1] + b * e2[1];
                const x1 = hx + e1[0] + b * e2[0];
                const y1 = hy + e1[1] + b * e2[1];
                dHatch += `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}`;
              }
            }
            dStroke += outline;
          }
        }

        // A small solid cube at the dead centre, so each shaft bottoms out in
        // an object rather than a hole.
        if (core > 0) {
          for (let f = 0; f < 3; f++) {
            const [ka, km, kb] = FACES[f]!;
            const ua = U[ka]!, um = U[km]!, ub = U[kb]!;
            const C: Vec2 = [hx, hy];
            const ca: Vec2 = [hx + S * core * ua[0], hy + S * core * ua[1]];
            const cm: Vec2 = [hx + S * core * um[0], hy + S * core * um[1]];
            const cb: Vec2 = [hx + S * core * ub[0], hy + S * core * ub[1]];
            const face = quad(C, ca, cm, cb);
            // In line-art mode the core joins the strokes rather than
            // introducing the only solid in the image.
            if (mode === 1) dStroke += face;
            else dCore[f] += face;
          }
        }
      }
    }

    const children: SvgNode[] = [];
    if (dPaper) children.push(el('path', { d: dPaper, 'fill-rule': 'nonzero', fill: 'paper' }));
    if (dInk) children.push(el('path', { d: dInk, 'fill-rule': 'nonzero', fill: 'ink' }));
    if (dHatch) {
      children.push(el('path', {
        d: dHatch, fill: 'none', stroke: 'ink', 'stroke-width': sw, 'stroke-linecap': 'butt',
      }));
    }
    for (let f = 0; f < 3; f++) {
      const d = dCore[f]!;
      if (d) {
        children.push(el('path', {
          d, 'fill-rule': 'nonzero', fill: 'ink', 'fill-opacity': Math.max(0.06, TONE[f]!),
        }));
      }
    }
    if (dStroke) {
      children.push(el('path', {
        d: dStroke, fill: 'none', stroke: 'ink', 'stroke-width': sw, 'stroke-linejoin': 'round',
      }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
