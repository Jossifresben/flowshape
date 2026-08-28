# flowshape.art Part 2 — Contract Hardening, 11 Patterns, Compute Worker

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All 13 launch shapes live in the playground with a hardened pattern contract, shared noise/geometry cores, and heavy patterns computing in a Web Worker.

**Architecture:** Same foundation as Part 1 (pure `generate(params, seed, size) → SvgNode`, role tokens, URL state). This part adds: `generateSafe` as the only sanctioned entry point, `bool`/`enum` param kinds, shared `core/noise.ts` + `core/geometry.ts`, one pattern module per shape, and `workers/compute.worker.ts` for `heavy` patterns. Spec: `docs/superpowers/specs/2026-08-28-flowshape-design.md`; formulas: `docs/research/2026-08-28-*.md`.

**Tech Stack:** unchanged (Vite, TS strict, vitest, plain DOM, SVG).

**Deliberate deviation from spec §4.1:** patterns register through an eager barrel (`src/patterns/index.ts`), not lazy `import()`. Total pattern JS is tens of KB; lazy loading adds async complexity for no user-visible win at this scale. Revisit if the bundle ever exceeds ~300 KB.

**Conventions for every task:** repo root `/Users/jfresco16/Google Drive/Claude/shapeit`, work on branch `feat/part2-patterns` (create from main in Task 1). Commit per task with the given message. Never `git push` — Hermes authorizes pushes explicitly, per message. Pattern modules NEVER touch DOM/window/location and NEVER call `Math.random`/`Date` — all randomness via `mulberry32(deriveSeed(seed, '<name>'))`.

---

### Task 1: Branch + contract hardening

**Files:**
- Create: `src/core/reserved.ts`
- Modify: `src/core/url-state.ts`, `src/patterns/registry.ts`, `src/poster/palettes.ts`, `src/ui/playground.ts`
- Test: `tests/patterns/registry.test.ts` (extend)

- [ ] **Step 1: Create the branch**

Run: `git checkout main && git checkout -b feat/part2-patterns`

- [ ] **Step 2: Create `src/core/reserved.ts`**

```ts
/** Query keys owned by the app shell; pattern params may not use them.
 *  Includes Part 3's poster keys already so patterns can never collide. */
export const RESERVED = new Set([
  'v', 'seed', 'pal', 'bg', 'ink', 'acc', 'theme', 'lang',
  'layout', 'format', 'title', 'caption',
]);
```

- [ ] **Step 3: Point both consumers at it**

In `src/core/url-state.ts`: delete the local `export const RESERVED = ...` line and add `import { RESERVED } from './reserved';` plus `export { RESERVED } from './reserved';` (keeps the existing public re-export working).

In `src/patterns/registry.ts`: change `import { RESERVED } from '../core/url-state';` to `import { RESERVED } from '../core/reserved';`.

- [ ] **Step 4: Add `generateSafe` to `src/patterns/registry.ts`** (append at end)

```ts
/** The only sanctioned way to run a pattern: clamps raw (URL/worker) params first. */
export function generateSafe(
  def: PatternDef,
  raw: Params,
  seed: number,
  size: Size,
): SvgNode {
  return def.generate(clampParams(def, { ...defaultParams(def), ...raw }), seed, size);
}
```

In `src/ui/playground.ts`: replace both `clampParams(def, { ...defaultParams(def), ...state.params })` + `def.generate(params, ...)` call sites with `generateSafe(def, state.params, state.seed, { w: 600, h: 840 })` (imports: swap `clampParams, defaultParams` for `generateSafe`; keep `getPattern`). NOTE: the slider rows still need the clamped values to display — keep `clampParams`/`defaultParams` imports for the panel loop in `render()`, and use `generateSafe` only where SVG is produced (`render`'s stage fill and `renderStage`).

- [ ] **Step 5: Tidy `src/poster/palettes.ts`** — move the type re-export/import to the top of the file as:

```ts
import type { Palette } from '../core/svg';
import type { ColorState } from '../core/url-state';
export type { ColorState } from '../core/url-state';
```

(remove the duplicated mid-file lines; everything else unchanged.)

- [ ] **Step 6: Definite assignment in `src/ui/playground.ts`** — change `let stage: HTMLDivElement;` to `let stage!: HTMLDivElement;`.

- [ ] **Step 7: Add a generateSafe test** to `tests/patterns/registry.test.ts`:

```ts
import { generateSafe } from '../../src/patterns/registry';

describe('generateSafe', () => {
  it('clamps raw params before generating', () => {
    // dummy's n is 1..10; raw 99 must reach generate as 10 — assert via a spy pattern
    let seen: Record<string, number> = {};
    const probe = definePattern({
      id: 'probe-safe',
      family: 'curves',
      phase: 1,
      heavy: false,
      params: [{ key: 'n', kind: 'int', min: 1, max: 10, step: 1, default: 3, label: 'x' }],
      generate: (p, _s, size) => {
        seen = { ...p };
        return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` });
      },
    });
    generateSafe(probe, { n: 99 }, 1, { w: 10, h: 10 });
    expect(seen).toEqual({ n: 10 });
  });
});
```

- [ ] **Step 8: Verify** — `npm run test` (all pass; count grows by 1) and `npm run build` (pass).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "refactor: reserved keys module, generateSafe contract, tidy-ups"
```

---

### Task 2: `bool` and `enum` param kinds

Params stay `Record<string, number>` everywhere (URL schema untouched): a bool is 0/1, an enum is an index into `options`. Only the contract, clamping, and controls change.

**Files:**
- Modify: `src/patterns/registry.ts`, `src/ui/controls.ts`, `src/ui/playground.ts`, `src/patterns/maurer.ts`
- Test: `tests/patterns/registry.test.ts` (extend)

- [ ] **Step 1: Extend ParamDef in `src/patterns/registry.ts`**

```ts
export interface ParamDef {
  key: string;
  kind: 'int' | 'float' | 'bool' | 'enum';
  min: number;
  max: number;
  step: number;
  default: number;
  label: string; // i18n key
  /** enum only: option labels (i18n keys); value is the index. */
  options?: string[];
}
```

In `clampParams`, after the existing int rounding line add:

```ts
    if (p.kind === 'bool') v = v >= 0.5 ? 1 : 0;
    if (p.kind === 'enum') v = Math.round(Math.min(p.max, Math.max(0, v)));
```

- [ ] **Step 2: Add failing tests** to `tests/patterns/registry.test.ts`:

```ts
const kinds = definePattern({
  id: 'kinds-probe',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'flag', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'x' },
    { key: 'mode', kind: 'enum', min: 0, max: 2, step: 1, default: 0, label: 'x', options: ['a', 'b', 'c'] },
  ],
  generate: (_p, _s, size) => el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }),
});

describe('bool/enum kinds', () => {
  it('clamps bool to 0/1 and enum to option range', () => {
    expect(clampParams(kinds, { flag: 0.7, mode: 9 })).toEqual({ flag: 1, mode: 2 });
    expect(clampParams(kinds, { flag: 0.2, mode: -1 })).toEqual({ flag: 0, mode: 0 });
    expect(clampParams(kinds, {})).toEqual({ flag: 1, mode: 0 });
  });
});
```

Run: `npx vitest run tests/patterns/registry.test.ts` — the new describe FAILS before Step 1 is applied, PASSES after (apply TDD order: write test, see fail, apply Step 1, see pass).

- [ ] **Step 3: Render bool/enum controls in `src/ui/controls.ts`** (append two builders)

```ts
export function checkboxRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row ctl-inline';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value === 1;
  input.addEventListener('change', () => onChange(input.checked ? 1 : 0));
  row.append(label, input);
  return row;
}

export function selectRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const select = document.createElement('select');
  select.className = 'ctl-select';
  (def.options ?? []).forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = opt.split('.').pop()!;
    if (i === value) o.selected = true;
    select.append(o);
  });
  select.addEventListener('change', () => onChange(Number(select.value)));
  row.append(label, select);
  return row;
}
```

In `src/ui/playground.ts`, replace the panel param loop body with a kind dispatch (bool/enum are STRUCTURAL — they may change what other params do — so they use full `setState`, not `setParam`):

```ts
    for (const pd of def.params) {
      const v = params[pd.key]!;
      if (pd.kind === 'bool') {
        panel.append(checkboxRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else if (pd.kind === 'enum') {
        panel.append(selectRow(pd, v, (nv) => setState({ params: { ...state.params, [pd.key]: nv } })));
      } else {
        panel.append(sliderRow(pd, v, (nv) => setParam(pd.key, nv)));
      }
    }
```

(import `checkboxRow, selectRow` from './controls'.)

Append to `src/style.css`:

```css
.ctl-inline { flex-direction: row; justify-content: space-between; align-items: center; }
.ctl-select {
  font-family: var(--font-mono); font-size: 12px; padding: 6px 8px;
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
}
input[type='checkbox'] { accent-color: var(--ink); }
```

- [ ] **Step 4: Migrate Maurer's `envelope` to bool** — in `src/patterns/maurer.ts` change its ParamDef to `{ key: 'envelope', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'maurer.envelope' }` (generate code already checks `=== 1`; URL back-compat holds since values stay 0/1).

- [ ] **Step 5: Verify** — `npm run test` (all pass; maurer snapshot unchanged) and `npm run build`. Quick manual check: `#/p/maurer` shows ENVELOPE as a checkbox.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: bool and enum param kinds with checkbox/select controls"
```

---

### Task 3: Shared pattern test harness

**Files:**
- Create: `tests/patterns/harness.ts`

- [ ] **Step 1: Write `tests/patterns/harness.ts`** (imported by every new pattern test; not a test file itself — vitest only picks up `*.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import type { PatternDef } from '../../src/patterns/registry';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

export const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
export const SIZE = { w: 600, h: 840 };

export function render(def: PatternDef, params: Record<string, number>, seed: number): string {
  return serialize(def.generate(params, seed, SIZE), PAL);
}

/** The five invariants every flowshape pattern must satisfy. */
export function standardPatternTests(def: PatternDef, opts: { maxElements: number }): void {
  describe(`${def.id} · standard invariants`, () => {
    it('is deterministic', () => {
      const p = defaultParams(def);
      expect(render(def, p, 42)).toBe(render(def, p, 42));
    });

    it('matches the committed snapshot (URL permanence guarantee)', () => {
      expect(render(def, defaultParams(def), 1)).toMatchSnapshot();
    });

    it('emits no NaN/Infinity at any single-param extreme', () => {
      const combos: Record<string, number>[] = [defaultParams(def)];
      for (const pd of def.params) {
        combos.push({ ...defaultParams(def), [pd.key]: pd.min });
        combos.push({ ...defaultParams(def), [pd.key]: pd.max });
      }
      for (const c of combos) {
        const svg = render(def, c, 7);
        expect(svg).not.toContain('NaN');
        expect(svg).not.toContain('Infinity');
      }
    });

    it('respects its element budget at defaults', () => {
      const svg = render(def, defaultParams(def), 1);
      const n = (svg.match(/<(circle|path|line|rect|polygon)/g) ?? []).length;
      expect(n).toBeLessThanOrEqual(opts.maxElements);
    });

    it('varies with seed when usesSeed', () => {
      if (!def.usesSeed) return;
      const p = defaultParams(def);
      expect(render(def, p, 1)).not.toBe(render(def, p, 2));
    });
  });
}
```

- [ ] **Step 2: Verify it compiles** — `npm run build` passes (harness has no test of its own yet; the next tasks exercise it).

- [ ] **Step 3: Commit**

```bash
git add tests/patterns/harness.ts && git commit -m "test: shared pattern invariant harness"
```

---

### Task 4: `core/noise.ts` — seeded value noise + fBm

**Files:**
- Create: `src/core/noise.ts`
- Test: `tests/core/noise.test.ts`

- [ ] **Step 1: Failing test** `tests/core/noise.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeNoise2D, fbm2D } from '../../src/core/noise';

describe('value noise', () => {
  it('is deterministic per seed and varies across seeds', () => {
    const a = makeNoise2D(7);
    const b = makeNoise2D(7);
    const c = makeNoise2D(8);
    expect(a(1.3, 4.2)).toBe(b(1.3, 4.2));
    expect(a(1.3, 4.2)).not.toBe(c(1.3, 4.2));
  });

  it('stays within [-1, 1] and is continuous-ish', () => {
    const n = makeNoise2D(3);
    for (let i = 0; i < 500; i++) {
      const x = i * 0.173, y = i * 0.291;
      const v = n(x, y);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
      expect(Math.abs(n(x + 0.001, y) - v)).toBeLessThan(0.05);
    }
  });

  it('fbm blends octaves deterministically within [-1, 1]', () => {
    const f = fbm2D(5, 2);
    expect(f(0.4, 0.9)).toBe(fbm2D(5, 2)(0.4, 0.9));
    for (let i = 0; i < 200; i++) {
      const v = f(i * 0.37, i * 0.11);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run** `npx vitest run tests/core/noise.test.ts` — FAIL (module not found).

- [ ] **Step 3: Implement `src/core/noise.ts`**

```ts
import { mulberry32 } from './prng';

/** Seeded 2D value noise in [-1, 1] with smoothstep interpolation. */
export function makeNoise2D(seed: number): (x: number, y: number) => number {
  // Lattice hash: one PRNG stream hashed by cell coords — deterministic, seed-isolated.
  const base = mulberry32(seed)() * 43758.5453 + 17.17;
  const hash = (i: number, j: number): number => {
    const v = Math.sin(i * 127.1 + j * 311.7 + base) * 43758.5453;
    return v - Math.floor(v);
  };
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y);
    let fx = x - i, fy = y - j;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const v =
      hash(i, j) * (1 - fx) * (1 - fy) +
      hash(i + 1, j) * fx * (1 - fy) +
      hash(i, j + 1) * (1 - fx) * fy +
      hash(i + 1, j + 1) * fx * fy;
    return v * 2 - 1;
  };
}

/** Fractional Brownian motion over `octaves` layers of value noise; output in [-1, 1]. */
export function fbm2D(seed: number, octaves: number): (x: number, y: number) => number {
  const layers = Array.from({ length: octaves }, (_, o) => makeNoise2D(seed + o * 1013));
  let norm = 0;
  for (let o = 0; o < octaves; o++) norm += 1 / 2 ** o;
  return (x, y) => {
    let sum = 0;
    for (let o = 0; o < octaves; o++) {
      const f = 2 ** o;
      sum += layers[o]!(x * f, y * f) / f;
    }
    return sum / norm;
  };
}
```

- [ ] **Step 4: Run** the test — PASS (3 tests). Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/core/noise.ts tests/core/noise.test.ts && git commit -m "feat: seeded value noise and fbm"
```

---

### Task 5: `core/geometry.ts` — Delaunay, polygon clipping, centroid

**Files:**
- Create: `src/core/geometry.ts`
- Test: `tests/core/geometry.test.ts`

- [ ] **Step 1: Failing test** `tests/core/geometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { delaunay, voronoiCell, centroid, type Pt } from '../../src/core/geometry';

describe('delaunay', () => {
  it('triangulates a square into 2 triangles covering all 4 points', () => {
    const pts: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const tris = delaunay(pts);
    expect(tris.length).toBe(2);
    const used = new Set(tris.flat());
    expect([...used].sort()).toEqual([0, 1, 2, 3]);
  });

  it('is deterministic and only references real points', () => {
    const pts: Pt[] = Array.from({ length: 60 }, (_, i) => [
      (i * 97) % 200, (i * 61) % 280,
    ]);
    const a = delaunay(pts);
    expect(delaunay(pts)).toEqual(a);
    for (const t of a) for (const idx of t) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(60);
    }
  });
});

describe('voronoiCell', () => {
  it('clips the center site of a 3x3 grid to its unit cell', () => {
    const sites: Pt[] = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) sites.push([x * 10, y * 10]);
    const cell = voronoiCell(sites, 4, [[-5, -5], [25, -5], [25, 25], [-5, 25]]);
    const c = centroid(cell);
    expect(c[0]).toBeCloseTo(10, 5);
    expect(c[1]).toBeCloseTo(10, 5);
    // the middle cell is the square 5..15 x 5..15
    for (const [x, y] of cell) {
      expect(x).toBeGreaterThanOrEqual(4.999);
      expect(x).toBeLessThanOrEqual(15.001);
      expect(y).toBeGreaterThanOrEqual(4.999);
      expect(y).toBeLessThanOrEqual(15.001);
    }
  });
});
```

- [ ] **Step 2: Run** `npx vitest run tests/core/geometry.test.ts` — FAIL (module not found).

- [ ] **Step 3: Implement `src/core/geometry.ts`**

```ts
export type Pt = [number, number];

/** Bowyer-Watson Delaunay triangulation. Returns triangles as index triples into pts. */
export function delaunay(pts: Pt[]): [number, number, number][] {
  const n = pts.length;
  if (n < 3) return [];
  // Super-triangle far outside any realistic canvas.
  const P: Pt[] = [...pts, [-1e5, -1e5], [3e5, -1e5], [-1e5, 3e5]];
  let tris: [number, number, number][] = [[n, n + 1, n + 2]];

  const circum = (t: [number, number, number]): [number, number, number] => {
    const [a, b, c] = [P[t[0]]!, P[t[1]]!, P[t[2]]!];
    const [ax, ay] = a, [bx, by] = b, [cx, cy] = c;
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    return [ux, uy, (ux - ax) ** 2 + (uy - ay) ** 2];
  };

  for (let i = 0; i < n; i++) {
    const p = P[i]!;
    const bad = new Set<number>();
    const edges: [number, number][] = [];
    tris.forEach((t, ti) => {
      const cc = circum(t);
      if ((p[0] - cc[0]) ** 2 + (p[1] - cc[1]) ** 2 < cc[2]) {
        bad.add(ti);
        edges.push([t[0], t[1]], [t[1], t[2]], [t[2], t[0]]);
      }
    });
    tris = tris.filter((_, ti) => !bad.has(ti));
    const count = new Map<string, number>();
    const key = (e: [number, number]) => `${Math.min(e[0], e[1])}_${Math.max(e[0], e[1])}`;
    for (const e of edges) count.set(key(e), (count.get(key(e)) ?? 0) + 1);
    for (const e of edges) if (count.get(key(e)) === 1) tris.push([e[0], e[1], i]);
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n);
}

/** Voronoi cell of sites[i] by half-plane clipping against the k nearest sites. */
export function voronoiCell(sites: Pt[], i: number, bounds: Pt[], k = 24): Pt[] {
  const s = sites[i]!;
  let poly = bounds;
  const others = sites
    .map((p, j) => [j, (p[0] - s[0]) ** 2 + (p[1] - s[1]) ** 2] as [number, number])
    .filter(([j]) => j !== i)
    .sort((a, b) => a[1] - b[1])
    .slice(0, k);
  for (const [j] of others) {
    if (poly.length === 0) break;
    const o = sites[j]!;
    const mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2;
    const nx = o[0] - s[0], ny = o[1] - s[1];
    const next: Pt[] = [];
    for (let q = 0; q < poly.length; q++) {
      const a = poly[q]!, b = poly[(q + 1) % poly.length]!;
      const da = (a[0] - mx) * nx + (a[1] - my) * ny;
      const db = (b[0] - mx) * nx + (b[1] - my) * ny;
      if (da <= 0) next.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    poly = next;
  }
  return poly;
}

export function centroid(poly: Pt[]): Pt {
  let cx = 0, cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  return poly.length ? [cx / poly.length, cy / poly.length] : [0, 0];
}
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/core/geometry.ts tests/core/geometry.test.ts && git commit -m "feat: delaunay triangulation and voronoi cell clipping"
```

---

### Task 6: Stipple Field (`patterns/stipple.ts`) — usesSeed

Variable-density blue noise: dart throwing with a density-driven exclusion radius (research: fields catalog §12, Poisson-disc note). Density = radial vignette blended with seeded fBm.

**Files:**
- Create: `src/patterns/stipple.ts`
- Test: `tests/patterns/stipple.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/stipple.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stipple } from '../../src/patterns/stipple';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(stipple, { maxElements: 9000 });

describe('stipple specifics', () => {
  it('emits only circles, denser center than corners at defaults', () => {
    const svg = render(stipple, defaultParams(stipple), 3);
    expect(svg).toContain('<circle');
    expect(svg).not.toContain('<path');
  });
});
```

- [ ] **Step 2: Run** — FAIL (module not found).

- [ ] **Step 3: Implement `src/patterns/stipple.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';
import { fbm2D } from '../core/noise';

export const stipple = definePattern({
  id: 'stipple',
  family: 'points',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'minGap', kind: 'float', min: 2, max: 8, step: 0.1, default: 2.5, label: 'stipple.minGap' },
    { key: 'maxGap', kind: 'float', min: 8, max: 30, step: 0.5, default: 16, label: 'stipple.maxGap' },
    { key: 'noiseScale', kind: 'float', min: 0.5, max: 4, step: 0.05, default: 1.6, label: 'stipple.noiseScale' },
    { key: 'contrast', kind: 'float', min: 0, max: 1, step: 0.01, default: 0.6, label: 'stipple.contrast' },
    { key: 'dotSize', kind: 'float', min: 0.5, max: 3, step: 0.1, default: 1.1, label: 'stipple.dotSize' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 300, step: 1, default: 173, label: 'stipple.accentEvery' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'stipple'));
    const noise = fbm2D(deriveSeed(seed, 'stipple-density'), 2);
    const m = 20;
    const cx = size.w / 2, cy = size.h / 2;
    const maxDist = Math.hypot(cx - m, cy - m);
    const density = (x: number, y: number): number => {
      const vignette = 1 - Math.hypot(x - cx, y - cy) / maxDist; // 1 center → 0 corner
      const n = (noise((x / size.w) * p['noiseScale']! * 4, (y / size.h) * p['noiseScale']! * 4) + 1) / 2;
      const d = vignette * (1 - p['contrast']!) + vignette * n * 2 * p['contrast']!;
      return Math.max(0, Math.min(1, d));
    };
    const CELL = p['maxGap']!;
    const gw = Math.ceil(size.w / CELL), gh = Math.ceil(size.h / CELL);
    const grid: number[][][] = Array.from({ length: gw * gh }, () => []);
    const placed: [number, number][] = [];
    const children: SvgNode[] = [];
    for (let t = 0; t < 40000; t++) {
      const x = m + rnd() * (size.w - 2 * m);
      const y = m + rnd() * (size.h - 2 * m);
      const d = density(x, y);
      if (d < 0.03) continue;
      const gap = p['minGap']! + (1 - d) * (p['maxGap']! - p['minGap']!);
      const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
      let ok = true;
      const R = Math.ceil(gap / CELL);
      for (let dx = -R; dx <= R && ok; dx++) for (let dy = -R; dy <= R && ok; dy++) {
        const xx = gx + dx, yy = gy + dy;
        if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
        for (const pi of grid[xx + yy * gw]!) {
          const q = placed[pi[0]!]!;
          if ((x - q[0]) ** 2 + (y - q[1]) ** 2 < gap * gap) { ok = false; break; }
        }
      }
      if (!ok) continue;
      grid[gx + gy * gw]!.push([placed.length]);
      placed.push([x, y]);
      const accent = p['accentEvery']! > 0 && placed.length % p['accentEvery']! === 0;
      children.push(el('circle', { cx: x, cy: y, r: p['dotSize']!, fill: accent ? 'accent' : 'ink' }));
      if (placed.length >= 8000) break;
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS (6 tests incl. harness). Full suite + build pass. Snapshot file committed with the test.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/stipple.ts tests/patterns/stipple.test.ts tests/patterns/__snapshots__ && git commit -m "feat: stipple field pattern"
```

---

### Task 7: Delaunay Mesh (`patterns/delaunay.ts`) — usesSeed

**Files:**
- Create: `src/patterns/delaunay.ts`
- Test: `tests/patterns/delaunay.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/delaunay.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { delaunayMesh } from '../../src/patterns/delaunay';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(delaunayMesh, { maxElements: 1600 });

describe('delaunay specifics', () => {
  it('mosaic mode fills polygons; edges mode strokes paths only', () => {
    const base = defaultParams(delaunayMesh);
    expect(render(delaunayMesh, { ...base, mode: 1 }, 1)).toContain('<polygon');
    const edges = render(delaunayMesh, { ...base, mode: 0 }, 1);
    expect(edges).toContain('<path');
    expect(edges).not.toContain('<polygon');
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/delaunay.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';
import { delaunay, type Pt } from '../core/geometry';

export const delaunayMesh = definePattern({
  id: 'delaunay',
  family: 'points',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'points', kind: 'int', min: 40, max: 500, step: 5, default: 220, label: 'delaunay.points' },
    { key: 'mode', kind: 'enum', min: 0, max: 1, step: 1, default: 0, label: 'delaunay.mode', options: ['delaunay.edges', 'delaunay.mosaic'] },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 3, step: 0.1, default: 0.8, label: 'delaunay.strokeWidth' },
    { key: 'vertexSize', kind: 'float', min: 0, max: 4, step: 0.1, default: 1.6, label: 'delaunay.vertexSize' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 60, step: 1, default: 23, label: 'delaunay.accentEvery' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'delaunay'));
    const m = 18;
    const pts: Pt[] = [];
    for (let i = 0; i < p['points']!; i++) {
      pts.push([m + rnd() * (size.w - 2 * m), m + rnd() * (size.h - 2 * m)]);
    }
    const tris = delaunay(pts);
    const children: SvgNode[] = [];
    const f2 = (n: number) => Math.round(n * 100) / 100;
    if (p['mode']! === 1) {
      tris.forEach((t, i) => {
        const fill = p['accentEvery']! > 0 && i % p['accentEvery']! === 0
          ? (i % (p['accentEvery']! * 2) === 0 ? 'accent' : 'ink')
          : 'paper';
        children.push(el('polygon', {
          points: t.map((idx) => `${f2(pts[idx]![0])},${f2(pts[idx]![1])}`).join(' '),
          fill,
          stroke: 'ink',
          'stroke-width': p['strokeWidth']!,
        }));
      });
    } else {
      let d = '';
      for (const t of tris) {
        const [a, b, c] = [pts[t[0]]!, pts[t[1]]!, pts[t[2]]!];
        d += `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}L${f2(c[0])} ${f2(c[1])}Z`;
      }
      children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']! }));
      if (p['vertexSize']! > 0) {
        for (const [x, y] of pts) children.push(el('circle', { cx: x, cy: y, r: p['vertexSize']!, fill: 'ink' }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/delaunay.ts tests/patterns/delaunay.test.ts tests/patterns/__snapshots__ && git commit -m "feat: delaunay mesh pattern"
```

---

### Task 8: Voronoi Cells (`patterns/voronoi.ts`) — usesSeed

**Files:**
- Create: `src/patterns/voronoi.ts`
- Test: `tests/patterns/voronoi.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/voronoi.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { voronoiCells } from '../../src/patterns/voronoi';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(voronoiCells, { maxElements: 400 });

describe('voronoi specifics', () => {
  it('emits one polygon per site (minus degenerate cells)', () => {
    const svg = render(voronoiCells, { ...defaultParams(voronoiCells), sites: 80 }, 5);
    const count = (svg.match(/<polygon/g) ?? []).length;
    expect(count).toBeGreaterThan(70);
    expect(count).toBeLessThanOrEqual(80);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/voronoi.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';
import { voronoiCell, centroid, type Pt } from '../core/geometry';

export const voronoiCells = definePattern({
  id: 'voronoi',
  family: 'points',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'sites', kind: 'int', min: 30, max: 300, step: 5, default: 150, label: 'voronoi.sites' },
    { key: 'inset', kind: 'float', min: 0.5, max: 0.98, step: 0.01, default: 0.86, label: 'voronoi.inset' },
    { key: 'strokeWidth', kind: 'float', min: 0.3, max: 3, step: 0.1, default: 1, label: 'voronoi.strokeWidth' },
    { key: 'inkEvery', kind: 'int', min: 0, max: 40, step: 1, default: 13, label: 'voronoi.inkEvery' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 40, step: 1, default: 19, label: 'voronoi.accentEvery' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'voronoi'));
    const m = 8;
    const sites: Pt[] = [];
    for (let i = 0; i < p['sites']!; i++) {
      sites.push([m + rnd() * (size.w - 2 * m), m + rnd() * (size.h - 2 * m)]);
    }
    const bounds: Pt[] = [[4, 4], [size.w - 4, 4], [size.w - 4, size.h - 4], [4, size.h - 4]];
    const children: SvgNode[] = [];
    const f2 = (n: number) => Math.round(n * 100) / 100;
    for (let i = 0; i < sites.length; i++) {
      const poly = voronoiCell(sites, i, bounds);
      if (poly.length < 3) continue;
      const c = centroid(poly);
      const inset = poly.map(([x, y]) => [
        c[0] + (x - c[0]) * p['inset']!,
        c[1] + (y - c[1]) * p['inset']!,
      ] as Pt);
      let fill = 'paper';
      if (p['accentEvery']! > 0 && i % p['accentEvery']! === 0) fill = 'accent';
      else if (p['inkEvery']! > 0 && i % p['inkEvery']! === 0) fill = 'ink';
      children.push(el('polygon', {
        points: inset.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' '),
        fill,
        stroke: 'ink',
        'stroke-width': p['strokeWidth']!,
      }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/voronoi.ts tests/patterns/voronoi.test.ts tests/patterns/__snapshots__ && git commit -m "feat: voronoi cells pattern"
```

---

### Task 9: Harmonograph (`patterns/harmonograph.ts`) — usesSeed

Formula (research: analytic catalog §5): damped double-pendulum sums per axis; frequency ratio presets with detune; phases from the seed.

**Files:**
- Create: `src/patterns/harmonograph.ts`
- Test: `tests/patterns/harmonograph.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/harmonograph.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { harmonograph } from '../../src/patterns/harmonograph';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(harmonograph, { maxElements: 2 });

describe('harmonograph specifics', () => {
  it('is one path whose length grows with duration', () => {
    const base = defaultParams(harmonograph);
    const short = render(harmonograph, { ...base, duration: 100 }, 1);
    const long = render(harmonograph, { ...base, duration: 480 }, 1);
    expect((short.match(/<path/g) ?? []).length).toBe(1);
    expect(long.length).toBeGreaterThan(short.length);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/harmonograph.ts`**

```ts
import { el } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

const RATIOS: [number, number][] = [[2, 3], [3, 4], [1, 2], [3, 5]];

export const harmonograph = definePattern({
  id: 'harmonograph',
  family: 'curves',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'ratio', kind: 'enum', min: 0, max: 3, step: 1, default: 0, label: 'harmonograph.ratio', options: ['harmonograph.r23', 'harmonograph.r34', 'harmonograph.r12', 'harmonograph.r35'] },
    { key: 'detune', kind: 'float', min: 0, max: 0.02, step: 0.0005, default: 0.007, label: 'harmonograph.detune' },
    { key: 'damping', kind: 'float', min: 0.001, max: 0.02, step: 0.0005, default: 0.0045, label: 'harmonograph.damping' },
    { key: 'duration', kind: 'int', min: 100, max: 600, step: 10, default: 480, label: 'harmonograph.duration' },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 2, step: 0.05, default: 0.6, label: 'harmonograph.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.32, label: 'harmonograph.opacity' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'harmonograph'));
    const [fa, fb] = RATIOS[p['ratio']!]!;
    const ph = [rnd() * 2 * Math.PI, rnd() * 2 * Math.PI, rnd() * 2 * Math.PI, rnd() * 2 * Math.PI] as const;
    const d1 = p['damping']!, d2 = d1 * 0.75;
    const det = p['detune']!;
    const cx = size.w / 2, cy = size.h / 2;
    const A = Math.min(size.w, size.h) * 0.22;
    const dt = 0.02;
    const steps = Math.floor(p['duration']! / dt);
    let d = '';
    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      const x = cx + A * (1.2 * Math.sin(fa * t + ph[0]) * Math.exp(-d1 * t) + 0.8 * Math.sin((fb + det) * t + ph[1]) * Math.exp(-d2 * t));
      const y = cy + A * (1.2 * Math.sin((fb + det * 0.5) * t + ph[2]) * Math.exp(-d1 * t) + 0.8 * Math.sin(fa * t + ph[3]) * Math.exp(-d2 * t));
      d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, [
      el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: p['opacity']! }),
    ]);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/harmonograph.ts tests/patterns/harmonograph.test.ts tests/patterns/__snapshots__ && git commit -m "feat: harmonograph pattern"
```

---

### Task 10: Times-Table Chords (`patterns/timestable.ts`)

Formula (research: analytic catalog §9): N points on a circle, chord k → (k·M mod N); M continuous.

**Files:**
- Create: `src/patterns/timestable.ts`
- Test: `tests/patterns/timestable.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/timestable.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { timestable } from '../../src/patterns/timestable';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(timestable, { maxElements: 3 });

describe('timestable specifics', () => {
  it('showCircle toggles the rim', () => {
    const base = defaultParams(timestable);
    expect((render(timestable, { ...base, showCircle: 1 }, 1).match(/<circle/g) ?? []).length).toBe(1);
    expect((render(timestable, { ...base, showCircle: 0 }, 1).match(/<circle/g) ?? []).length).toBe(0);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/timestable.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

export const timestable = definePattern({
  id: 'timestable',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'chords', kind: 'int', min: 100, max: 600, step: 10, default: 400, label: 'timestable.chords' },
    { key: 'multiplier', kind: 'float', min: 2, max: 100, step: 0.05, default: 34, label: 'timestable.multiplier' },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 2, step: 0.05, default: 0.6, label: 'timestable.strokeWidth' },
    { key: 'opacity', kind: 'float', min: 0.05, max: 1, step: 0.01, default: 0.28, label: 'timestable.opacity' },
    { key: 'showCircle', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'timestable.showCircle' },
  ],
  generate(p, _seed, size) {
    const N = p['chords']!;
    const M = p['multiplier']!;
    const cx = size.w / 2, cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.42;
    const pt = (k: number): [number, number] => {
      const a = (2 * Math.PI * k) / N - Math.PI / 2;
      return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    };
    let d = '';
    for (let k = 0; k < N; k++) {
      const [x1, y1] = pt(k);
      const [x2, y2] = pt((k * M) % N);
      d += `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }
    const children: SvgNode[] = [
      el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: p['opacity']! }),
    ];
    if (p['showCircle']! === 1) {
      children.push(el('circle', { cx, cy, r: R, fill: 'none', stroke: 'ink', 'stroke-width': 1, opacity: 0.5 }));
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/timestable.ts tests/patterns/timestable.test.ts tests/patterns/__snapshots__ && git commit -m "feat: times-table chords pattern"
```

---

### Task 11: Flow Field (`patterns/flowfield.ts`) — usesSeed

Formula (research: fields catalog §5): angle field from fBm; streamlines with an occupancy grid so lines never cross.

**Files:**
- Create: `src/patterns/flowfield.ts`
- Test: `tests/patterns/flowfield.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/flowfield.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { flowfield } from '../../src/patterns/flowfield';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(flowfield, { maxElements: 4000 });

describe('flowfield specifics', () => {
  it('denser spacing produces more streamline paths', () => {
    const base = defaultParams(flowfield);
    const sparse = (render(flowfield, { ...base, spacing: 20 }, 3).match(/<path/g) ?? []).length;
    const dense = (render(flowfield, { ...base, spacing: 7 }, 3).match(/<path/g) ?? []).length;
    expect(dense).toBeGreaterThan(sparse);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/flowfield.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';
import { fbm2D } from '../core/noise';

export const flowfield = definePattern({
  id: 'flowfield',
  family: 'fields',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'freq', kind: 'float', min: 0.004, max: 0.03, step: 0.001, default: 0.011, label: 'flowfield.freq' },
    { key: 'curl', kind: 'float', min: 0.5, max: 3, step: 0.05, default: 1.9, label: 'flowfield.curl' },
    { key: 'spacing', kind: 'int', min: 6, max: 20, step: 1, default: 9, label: 'flowfield.spacing' },
    { key: 'steps', kind: 'int', min: 50, max: 400, step: 10, default: 300, label: 'flowfield.steps' },
    { key: 'strokeWidth', kind: 'float', min: 0.4, max: 2.5, step: 0.05, default: 1.1, label: 'flowfield.strokeWidth' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 40, step: 1, default: 17, label: 'flowfield.accentEvery' },
  ],
  generate(p, seed, size) {
    const noise = fbm2D(deriveSeed(seed, 'flow'), 2);
    const rnd = mulberry32(deriveSeed(seed, 'flow-seeds'));
    const angle = (x: number, y: number): number =>
      noise(x * p['freq']!, y * p['freq']!) * Math.PI * p['curl']!;
    const m = 20;
    const CELL = 4;
    const gw = Math.ceil(size.w / CELL), gh = Math.ceil(size.h / CELL);
    const occ = new Int16Array(gw * gh);
    let id = 0;
    const children: SvgNode[] = [];
    for (let gy = m; gy < size.h - m; gy += p['spacing']!) {
      for (let gx = m; gx < size.w - m; gx += p['spacing']!) {
        if (rnd() < 0.35) continue;
        id++;
        let x = gx + rnd() * 4, y = gy + rnd() * 4;
        let d = `M${x.toFixed(2)} ${y.toFixed(2)}`;
        let n = 0;
        for (let k = 0; k < p['steps']!; k++) {
          const a = angle(x, y);
          x += Math.cos(a) * 2;
          y += Math.sin(a) * 2;
          if (x < m || x > size.w - m || y < m || y > size.h - m) break;
          const ci = Math.floor(x / CELL) + Math.floor(y / CELL) * gw;
          if (occ[ci] && occ[ci] !== id) break;
          occ[ci] = id;
          d += `L${x.toFixed(2)} ${y.toFixed(2)}`;
          n++;
        }
        if (n < 5) continue;
        const accent = p['accentEvery']! > 0 && id % p['accentEvery']! === 0;
        children.push(el('path', {
          d,
          fill: 'none',
          stroke: accent ? 'accent' : 'ink',
          'stroke-width': p['strokeWidth']!,
          'stroke-linecap': 'round',
          opacity: 0.85,
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/flowfield.ts tests/patterns/flowfield.test.ts tests/patterns/__snapshots__ && git commit -m "feat: flow field pattern"
```

---

### Task 12: Clifford Attractor (`patterns/clifford.ts`)

Formula (research: fields catalog §1a, verified Bourke): `x' = sin(a·y) + c·cos(a·x); y' = sin(b·x) + d·cos(b·y)`. Curated known-good parameter sets as an enum; dots subsampled to a budget.

**Files:**
- Create: `src/patterns/clifford.ts`
- Test: `tests/patterns/clifford.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/clifford.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clifford } from '../../src/patterns/clifford';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(clifford, { maxElements: 12500 });

describe('clifford specifics', () => {
  it('different variants produce different images', () => {
    const base = defaultParams(clifford);
    expect(render(clifford, { ...base, variant: 0 }, 1)).not.toBe(
      render(clifford, { ...base, variant: 3 }, 1),
    );
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/clifford.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

/** Known-good sets from paulbourke.net/fractals/clifford. */
const SETS: [number, number, number, number][] = [
  [-1.4, 1.6, 1.0, 0.7],
  [1.6, -0.6, -1.2, 1.6],
  [1.7, 1.7, 0.6, 1.2],
  [1.5, -1.8, 1.6, 0.9],
  [-1.7, 1.3, -0.1, -1.2],
  [-1.7, 1.8, -1.9, -0.4],
  [-1.8, -2.0, -0.5, -0.9],
];

export const clifford = definePattern({
  id: 'clifford',
  family: 'attractors',
  phase: 1,
  heavy: false,
  params: [
    { key: 'variant', kind: 'enum', min: 0, max: 6, step: 1, default: 4, label: 'clifford.variant', options: ['clifford.v1', 'clifford.v2', 'clifford.v3', 'clifford.v4', 'clifford.v5', 'clifford.v6', 'clifford.v7'] },
    { key: 'iterations', kind: 'int', min: 20000, max: 200000, step: 5000, default: 120000, label: 'clifford.iterations' },
    { key: 'maxDots', kind: 'int', min: 4000, max: 12000, step: 500, default: 12000, label: 'clifford.maxDots' },
    { key: 'dotSize', kind: 'float', min: 0.3, max: 1.5, step: 0.05, default: 0.55, label: 'clifford.dotSize' },
    { key: 'opacity', kind: 'float', min: 0.1, max: 1, step: 0.02, default: 0.45, label: 'clifford.opacity' },
  ],
  generate(p, _seed, size) {
    const [a, b, c, d] = SETS[p['variant']!]!;
    const iters = p['iterations']!;
    const keepEvery = Math.max(1, Math.floor(iters / p['maxDots']!));
    const sx = (size.w * 0.44) / (1 + Math.abs(c));
    const sy = (size.h * 0.44) / (1 + Math.abs(d));
    const cx = size.w / 2, cy = size.h / 2;
    let x = 0.1, y = 0.1;
    const children: SvgNode[] = [];
    for (let i = 0; i < iters; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx; y = ny;
      if (i > 100 && i % keepEvery === 0) {
        children.push(el('circle', {
          cx: cx + x * sx,
          cy: cy + y * sy,
          r: p['dotSize']!,
          fill: 'ink',
          opacity: p['opacity']!,
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/clifford.ts tests/patterns/clifford.test.ts tests/patterns/__snapshots__ && git commit -m "feat: clifford attractor pattern"
```

---

### Task 13: Truchet Arcs (`patterns/truchet.ts`) — usesSeed

Formula (research: tilings catalog §1, Smith 1987): per cell, one of two arc orientations; arcs always connect across tiles. `bold` probability gives seeded stroke-weight variety.

**Files:**
- Create: `src/patterns/truchet.ts`
- Test: `tests/patterns/truchet.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/truchet.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { truchet } from '../../src/patterns/truchet';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(truchet, { maxElements: 1200 });

describe('truchet specifics', () => {
  it('smaller cells produce more arc paths', () => {
    const base = defaultParams(truchet);
    const coarse = (render(truchet, { ...base, cell: 60 }, 2).match(/<path/g) ?? []).length;
    const fine = (render(truchet, { ...base, cell: 24 }, 2).match(/<path/g) ?? []).length;
    expect(fine).toBeGreaterThan(coarse);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/truchet.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

export const truchet = definePattern({
  id: 'truchet',
  family: 'tilings',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'cell', kind: 'int', min: 20, max: 80, step: 2, default: 30, label: 'truchet.cell' },
    { key: 'variant', kind: 'enum', min: 0, max: 1, step: 1, default: 0, label: 'truchet.variant', options: ['truchet.arcs', 'truchet.diagonals'] },
    { key: 'strokeWidth', kind: 'float', min: 0.8, max: 6, step: 0.1, default: 2.2, label: 'truchet.strokeWidth' },
    { key: 'boldChance', kind: 'float', min: 0, max: 0.3, step: 0.01, default: 0.12, label: 'truchet.boldChance' },
    { key: 'accentChance', kind: 'float', min: 0, max: 0.2, step: 0.01, default: 0.04, label: 'truchet.accentChance' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'truchet'));
    const s = p['cell']!;
    const cols = Math.floor(size.w / s);
    const rows = Math.floor(size.h / s);
    const ox = (size.w - cols * s) / 2;
    const oy = (size.h - rows * s) / 2;
    const h = s / 2;
    const children: SvgNode[] = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = ox + i * s, y = oy + j * s;
        const flip = rnd() > 0.5;
        const bold = rnd() < p['boldChance']!;
        const accent = rnd() < p['accentChance']!;
        let d: string;
        if (p['variant']! === 0) {
          d = flip
            ? `M${x} ${y + h}A${h} ${h} 0 0 1 ${x + h} ${y}M${x + h} ${y + s}A${h} ${h} 0 0 1 ${x + s} ${y + h}`
            : `M${x} ${y + h}A${h} ${h} 0 0 0 ${x + h} ${y + s}M${x + h} ${y}A${h} ${h} 0 0 0 ${x + s} ${y + h}`;
        } else {
          d = flip ? `M${x} ${y}L${x + s} ${y + s}` : `M${x + s} ${y}L${x} ${y + s}`;
        }
        children.push(el('path', {
          d,
          fill: 'none',
          stroke: accent ? 'accent' : 'ink',
          'stroke-width': bold ? p['strokeWidth']! * 2 : p['strokeWidth']!,
          'stroke-linecap': 'round',
        }));
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/truchet.ts tests/patterns/truchet.test.ts tests/patterns/__snapshots__ && git commit -m "feat: truchet arcs pattern"
```

---

### Task 14: Hitomezashi (`patterns/hitomezashi.ts`) — usesSeed

Formula (research: tilings catalog §14a): column bits c[i], row bits r[j]; vertical dash at (i,j) iff (j+c[i]) even, horizontal iff (i+r[j]) even; region parity = prefixXor(c,i) ⊕ prefixXor(r,j).

**Files:**
- Create: `src/patterns/hitomezashi.ts`
- Test: `tests/patterns/hitomezashi.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/hitomezashi.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hitomezashi } from '../../src/patterns/hitomezashi';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(hitomezashi, { maxElements: 2600 });

describe('hitomezashi specifics', () => {
  it('fillParity toggles the rect fills', () => {
    const base = defaultParams(hitomezashi);
    expect(render(hitomezashi, { ...base, fillParity: 1 }, 4)).toContain('<rect');
    expect(render(hitomezashi, { ...base, fillParity: 0 }, 4)).not.toContain('<rect');
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/hitomezashi.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

export const hitomezashi = definePattern({
  id: 'hitomezashi',
  family: 'tilings',
  phase: 1,
  heavy: false,
  usesSeed: true,
  params: [
    { key: 'cell', kind: 'int', min: 8, max: 30, step: 1, default: 12, label: 'hitomezashi.cell' },
    { key: 'bitChance', kind: 'float', min: 0.2, max: 0.8, step: 0.01, default: 0.5, label: 'hitomezashi.bitChance' },
    { key: 'strokeWidth', kind: 'float', min: 0.6, max: 4, step: 0.1, default: 1.6, label: 'hitomezashi.strokeWidth' },
    { key: 'fillParity', kind: 'bool', min: 0, max: 1, step: 1, default: 1, label: 'hitomezashi.fillParity' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'hitomezashi'));
    const cell = p['cell']!;
    const cols = Math.floor(size.w / cell);
    const rows = Math.floor(size.h / cell);
    const ox = (size.w - cols * cell) / 2;
    const oy = (size.h - rows * cell) / 2;
    const cb: number[] = [], rb: number[] = [];
    for (let i = 0; i <= cols; i++) cb.push(rnd() < p['bitChance']! ? 1 : 0);
    for (let j = 0; j <= rows; j++) rb.push(rnd() < p['bitChance']! ? 1 : 0);
    const children: SvgNode[] = [];
    if (p['fillParity']! === 1) {
      const xc = [0]; for (let i = 0; i < cols; i++) xc.push(xc[i]! ^ cb[i]!);
      const yr = [0]; for (let j = 0; j < rows; j++) yr.push(yr[j]! ^ rb[j]!);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if ((xc[i]! ^ yr[j]!) === 1) {
          children.push(el('rect', { x: ox + i * cell, y: oy + j * cell, width: cell, height: cell, fill: 'accent', opacity: 0.25 }));
        }
      }
    }
    let d = '';
    for (let i = 0; i <= cols; i++) for (let j = 0; j < rows; j++) {
      if ((j + cb[i]!) % 2 === 0) {
        d += `M${ox + i * cell} ${oy + j * cell + 1}V${oy + (j + 1) * cell - 1}`;
      }
    }
    for (let j = 0; j <= rows; j++) for (let i = 0; i < cols; i++) {
      if ((i + rb[j]!) % 2 === 0) {
        d += `M${ox + i * cell + 1} ${oy + j * cell}H${ox + (i + 1) * cell - 1}`;
      }
    }
    children.push(el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, 'stroke-linecap': 'round' }));
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/hitomezashi.ts tests/patterns/hitomezashi.test.ts tests/patterns/__snapshots__ && git commit -m "feat: hitomezashi pattern"
```

---

### Task 15: Girih Stars (`patterns/girih.ts`)

Formula (research: tilings catalog §5, Hankin's method): hex grid; from each edge midpoint two rays at ±contact angle into the polygon; segments meet rays from adjacent edges. The contact-angle slider makes stars bloom.

**Files:**
- Create: `src/patterns/girih.ts`
- Test: `tests/patterns/girih.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/girih.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { girih } from '../../src/patterns/girih';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(girih, { maxElements: 3 });

describe('girih specifics', () => {
  it('contact angle changes the geometry', () => {
    const base = defaultParams(girih);
    expect(render(girih, { ...base, contactAngle: 30 }, 1)).not.toBe(
      render(girih, { ...base, contactAngle: 72 }, 1),
    );
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/girih.ts`**

```ts
import { el } from '../core/svg';
import { definePattern } from './registry';

export const girih = definePattern({
  id: 'girih',
  family: 'tilings',
  phase: 1,
  heavy: false,
  params: [
    { key: 'hexSize', kind: 'int', min: 20, max: 80, step: 2, default: 30, label: 'girih.hexSize' },
    { key: 'contactAngle', kind: 'float', min: 15, max: 80, step: 0.5, default: 60, label: 'girih.contactAngle' },
    { key: 'strokeWidth', kind: 'float', min: 0.6, max: 5, step: 0.1, default: 2, label: 'girih.strokeWidth' },
  ],
  generate(p, _seed, size) {
    const S = p['hexSize']!;
    const TH = (p['contactAngle']! * Math.PI) / 180;
    const ct = Math.cos(TH), st = Math.sin(TH);
    const cross = (a: [number, number], b: [number, number]) => a[0] * b[1] - a[1] * b[0];
    let d = '';
    const f2 = (n: number) => n.toFixed(2);
    const rMax = Math.ceil(size.h / (S * 1.5)) + 1;
    const qMax = Math.ceil(size.w / (S * Math.sqrt(3))) + 2;
    for (let r = -1; r <= rMax; r++) {
      for (let q = -qMax; q <= qMax; q++) {
        const hx = S * Math.sqrt(3) * (q + r / 2);
        const hy = S * 1.5 * r;
        if (hx < -S || hx > size.w + S || hy < -S || hy > size.h + S) continue;
        const V: [number, number][] = [];
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          V.push([hx + S * Math.cos(a), hy + S * Math.sin(a)]);
        }
        const M: [number, number][] = [], E: [number, number][] = [], N: [number, number][] = [];
        for (let k = 0; k < 6; k++) {
          const v1 = V[k]!, v2 = V[(k + 1) % 6]!;
          const mx = (v1[0] + v2[0]) / 2, my = (v1[1] + v2[1]) / 2;
          M.push([mx, my]);
          const elen = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]);
          E.push([(v2[0] - v1[0]) / elen, (v2[1] - v1[1]) / elen]);
          const nlen = Math.hypot(hx - mx, hy - my);
          N.push([(hx - mx) / nlen, (hy - my) / nlen]);
        }
        for (let k = 0; k < 6; k++) {
          const k2 = (k + 1) % 6;
          const d1: [number, number] = [E[k]![0] * ct + N[k]![0] * st, E[k]![1] * ct + N[k]![1] * st];
          const d2: [number, number] = [-E[k2]![0] * ct + N[k2]![0] * st, -E[k2]![1] * ct + N[k2]![1] * st];
          const dm: [number, number] = [M[k2]![0] - M[k]![0], M[k2]![1] - M[k]![1]];
          const den = cross(d1, d2);
          if (Math.abs(den) < 1e-9) continue;
          const t = cross(dm, d2) / den;
          if (t <= 0 || t > S * 2) continue;
          const P: [number, number] = [M[k]![0] + d1[0] * t, M[k]![1] + d1[1] * t];
          d += `M${f2(M[k]![0])} ${f2(M[k]![1])}L${f2(P[0])} ${f2(P[1])}L${f2(M[k2]![0])} ${f2(M[k2]![1])}`;
        }
      }
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, [
      el('path', { d, fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, 'stroke-linecap': 'round' }),
    ]);
  },
});
```

- [ ] **Step 4: Run** the test — PASS. Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/girih.ts tests/patterns/girih.test.ts tests/patterns/__snapshots__ && git commit -m "feat: girih stars pattern"
```

---

### Task 16: Differential Growth (`patterns/diffgrowth.ts`) — usesSeed, heavy

Formula (research: fields catalog §9): closed polyline; per iteration neighbor attraction + hash-grid repulsion + seeded jitter + forced node insertion; ring snapshots. `heavy: true` — this is the pattern the worker exists for.

**Files:**
- Create: `src/patterns/diffgrowth.ts`
- Test: `tests/patterns/diffgrowth.test.ts`

- [ ] **Step 1: Failing test** `tests/patterns/diffgrowth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { diffgrowth } from '../../src/patterns/diffgrowth';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(diffgrowth, { maxElements: 8 });

describe('diffgrowth specifics', () => {
  it('is flagged heavy and emits rings+final paths', () => {
    expect(diffgrowth.heavy).toBe(true);
    const base = defaultParams(diffgrowth);
    const svg = render(diffgrowth, { ...base, rings: 2 }, 9);
    expect((svg.match(/<path/g) ?? []).length).toBe(3); // 2 rings + final
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `src/patterns/diffgrowth.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';
import { mulberry32, deriveSeed } from '../core/prng';

export const diffgrowth = definePattern({
  id: 'diffgrowth',
  family: 'growth',
  phase: 1,
  heavy: true,
  usesSeed: true,
  params: [
    { key: 'iterations', kind: 'int', min: 50, max: 500, step: 10, default: 340, label: 'diffgrowth.iterations' },
    { key: 'repulsion', kind: 'float', min: 8, max: 20, step: 0.5, default: 13, label: 'diffgrowth.repulsion' },
    { key: 'rings', kind: 'int', min: 0, max: 4, step: 1, default: 2, label: 'diffgrowth.rings' },
    { key: 'strokeWidth', kind: 'float', min: 0.5, max: 3, step: 0.1, default: 1.4, label: 'diffgrowth.strokeWidth' },
  ],
  generate(p, seed, size) {
    const rnd = mulberry32(deriveSeed(seed, 'diffgrowth'));
    const R = p['repulsion']!;
    const ITER = p['iterations']!;
    const CAP = 1500;
    const DMAX = 5.5, DMIN = 1.9;
    const m = 26;
    const cx = size.w / 2, cy = size.h / 2;
    let nodes: [number, number][] = [];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * 2 * Math.PI;
      nodes.push([cx + 30 * Math.cos(a), cy + 30 * Math.sin(a)]);
    }
    const paths: string[] = [];
    const snapshot = (): string => {
      let d = `M${nodes[0]![0].toFixed(2)} ${nodes[0]![1].toFixed(2)}`;
      for (let j = 1; j < nodes.length; j++) d += `L${nodes[j]![0].toFixed(2)} ${nodes[j]![1].toFixed(2)}`;
      return d + 'Z';
    };
    const ringAt: number[] = [];
    for (let r = 1; r <= p['rings']!; r++) ringAt.push(Math.floor((ITER * r) / (p['rings']! + 1)));
    for (let k = 1; k <= ITER; k++) {
      const grid = new Map<string, number[]>();
      nodes.forEach(([x, y], i) => {
        const key = `${Math.floor(x / R)},${Math.floor(y / R)}`;
        const cell = grid.get(key);
        if (cell) cell.push(i); else grid.set(key, [i]);
      });
      const moves: [number, number][] = [];
      const len = nodes.length;
      for (let i = 0; i < len; i++) {
        const n = nodes[i]!;
        const prev = nodes[(i - 1 + len) % len]!;
        const next = nodes[(i + 1) % len]!;
        let fx = ((prev[0] + next[0]) / 2 - n[0]) * 0.22;
        let fy = ((prev[1] + next[1]) / 2 - n[1]) * 0.22;
        const gx = Math.floor(n[0] / R), gy = Math.floor(n[1] / R);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(`${gx + dx},${gy + dy}`);
          if (!cell) continue;
          for (const oi of cell) {
            const di = Math.abs(oi - i);
            if (di < 2 || di > len - 2) continue;
            const ox = n[0] - nodes[oi]![0], oy = n[1] - nodes[oi]![1];
            const dist = Math.hypot(ox, oy);
            if (dist < R && dist > 0.001) {
              const f = ((1 - dist / R) * 0.95) / dist;
              fx += ox * f; fy += oy * f;
            }
          }
        }
        fx += (rnd() - 0.5) * 0.6;
        fy += (rnd() - 0.5) * 0.6;
        moves.push([Math.max(-2, Math.min(2, fx)), Math.max(-2, Math.min(2, fy))]);
      }
      for (let i = 0; i < len; i++) {
        nodes[i]![0] = Math.max(m, Math.min(size.w - m, nodes[i]![0] + moves[i]![0]));
        nodes[i]![1] = Math.max(m, Math.min(size.h - m, nodes[i]![1] + moves[i]![1]));
      }
      if (nodes.length < CAP) {
        const grown: [number, number][] = [];
        let grow = Math.max(1, Math.floor(nodes.length * 0.02));
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i]!, n2 = nodes[(i + 1) % nodes.length]!;
          grown.push(n1);
          const gap = Math.hypot(n2[0] - n1[0], n2[1] - n1[1]);
          const force = gap > DMAX;
          const opportunistic = grow > 0 && rnd() < 0.03 && gap > DMIN * 1.5;
          if ((force || opportunistic) && grown.length < CAP) {
            if (opportunistic && !force) grow--;
            grown.push([(n1[0] + n2[0]) / 2 + (rnd() - 0.5) * 0.6, (n1[1] + n2[1]) / 2 + (rnd() - 0.5) * 0.6]);
          }
        }
        nodes = grown;
      }
      const merged: [number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n2 = nodes[(i + 1) % nodes.length]!;
        if (Math.hypot(n2[0] - nodes[i]![0], n2[1] - nodes[i]![1]) > DMIN || merged.length < 8) merged.push(nodes[i]!);
      }
      nodes = merged;
      if (ringAt.includes(k)) paths.push(snapshot());
    }
    paths.push(snapshot());
    const children: SvgNode[] = paths.map((d, i) =>
      el('path', {
        d,
        fill: 'none',
        stroke: 'ink',
        'stroke-width': i === paths.length - 1 ? p['strokeWidth']! : p['strokeWidth']! * 0.7,
        'stroke-linejoin': 'round',
        opacity: i === paths.length - 1 ? 0.95 : 0.18 + 0.14 * i,
      }),
    );
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run** the test — PASS (this test file is the slowest; expect a few seconds). Full suite + build pass.

- [ ] **Step 5: Commit**

```bash
git add src/patterns/diffgrowth.ts tests/patterns/diffgrowth.test.ts tests/patterns/__snapshots__ && git commit -m "feat: differential growth pattern"
```

---

### Task 17: Compute worker for heavy patterns

**Files:**
- Create: `src/patterns/index.ts`, `src/workers/compute.worker.ts`
- Modify: `src/ui/playground.ts`, `src/main.ts`, `src/style.css`

- [ ] **Step 1: Create the barrel `src/patterns/index.ts`** (registration side effects, one place)

```ts
import './phyllotaxis';
import './maurer';
import './stipple';
import './delaunay';
import './voronoi';
import './harmonograph';
import './timestable';
import './flowfield';
import './clifford';
import './truchet';
import './hitomezashi';
import './girih';
import './diffgrowth';
```

- [ ] **Step 2: Create `src/workers/compute.worker.ts`**

```ts
import '../patterns/index';
import { getPattern, generateSafe } from '../patterns/registry';
import type { Params, Size } from '../patterns/registry';

interface Req { id: number; patternId: string; params: Params; seed: number; size: Size }

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, patternId, params, seed, size } = e.data;
  const def = getPattern(patternId);
  const node = def ? generateSafe(def, params, seed, size) : null;
  (self as unknown as Worker).postMessage({ id, node });
};
```

- [ ] **Step 3: Wire the worker into `src/ui/playground.ts`**

Add to the module (top of `mountPlayground`'s closure):

```ts
  let worker: Worker | null = null;
  let workerReq = 0;
  function computeInWorker(onNode: (node: import('../core/svg').SvgNode) => void): void {
    worker ??= new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
    const id = ++workerReq;
    worker.onmessage = (e: MessageEvent<{ id: number; node: import('../core/svg').SvgNode | null }>) => {
      if (e.data.id !== workerReq || !e.data.node) return;
      onNode(e.data.node);
    };
    worker.postMessage({ id, patternId: state.patternId, params: state.params, seed: state.seed, size: { w: 600, h: 840 } });
  }
```

Change `renderStage()` (and the stage fill inside `render()`) to branch on `def.heavy`:

```ts
    const pal = resolvePalette(state.color, state.theme);
    stage.style.background = pal.paper;
    if (def.heavy) {
      stage.classList.add('computing');
      computeInWorker((node) => {
        stage.classList.remove('computing');
        stage.innerHTML = serialize(node, resolvePalette(state.color, state.theme));
      });
    } else {
      stage.innerHTML = serialize(generateSafe(def, state.params, state.seed, { w: 600, h: 840 }), pal);
    }
```

(Both call sites share this logic — extract it as a closure function `fillStage(def)` used by `render()` and `renderStage()` so it exists once.)

Append to `src/style.css`:

```css
.stage.computing { opacity: 0.55; transition: opacity 0.15s; }
```

- [ ] **Step 4: Simplify `src/main.ts`** to use the barrel:

```ts
import './style.css';
import './patterns/index';
import { mountPlayground } from './ui/playground';

mountPlayground(document.querySelector<HTMLDivElement>('#app')!);
```

- [ ] **Step 5: Verify** — `npm run test` (all pass) and `npm run build` (pass; Vite emits a separate worker chunk). Manual: `#/p/diffgrowth` renders via the worker (stage dims briefly, UI stays responsive while dragging ITERATIONS).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: pattern barrel and compute worker for heavy patterns"
```

---

### Task 18: Pattern switcher + final verification

**Files:**
- Modify: `src/ui/playground.ts`

- [ ] **Step 1: Add a pattern select at the top of the panel** (in `render()`, before the seed row):

```ts
    const patternSel = document.createElement('select');
    patternSel.className = 'ctl-select';
    for (const def2 of listPatterns().filter((x) => x.phase === 1).sort((a, b) => a.id.localeCompare(b.id))) {
      const o = document.createElement('option');
      o.value = def2.id;
      o.textContent = def2.id;
      if (def2.id === state.patternId) o.selected = true;
      patternSel.append(o);
    }
    patternSel.addEventListener('change', () =>
      setState({ patternId: patternSel.value, params: {} }),
    );
    panel.append(patternSel);
```

(import `listPatterns` from '../patterns/registry'. Resetting `params: {}` on switch is deliberate — each pattern starts at its defaults.)

- [ ] **Step 2: Full verification**

Run: `npm run test` — all suites pass (expect ~80+ tests across 16 files).
Run: `npm run build` — passes.
Manual sweep: visit all 13 pattern routes (`phyllotaxis, maurer, stipple, delaunay, voronoi, harmonograph, timestable, flowfield, clifford, truchet, hitomezashi, girih, diffgrowth`); each renders in < 1s (diffgrowth via worker), sliders live-update, palettes/theme work, every URL reloads to the identical image.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: pattern switcher; all 13 launch patterns wired"
```

---

## Post-implementation tuning (commit de74904)

Visual QA in a real browser after Task 18 found three patterns weak at their planned defaults. Fixed by changing default values and two slider ranges only — no algorithm changes. If you re-run this plan from scratch, apply these instead of the values written above:

- **stipple**: `maxGap` default 16 → **22**, `contrast` default 0.6 → **0.15**. At 0.6 the fBm swamped the radial vignette and the field read as a muddy blotch; at 0.15 it reads as a clean radial density gradient with subtle organic variation.
- **clifford**: `dotSize` default 0.55 → **0.85**, `opacity` default 0.45 → **0.7**. 12k subsampled dots at 0.55px read as a thin wireframe rather than the attractor's characteristic dense veil.
- **diffgrowth**: `iterations` default 340 → **500** with `max` 500 → **600**; `repulsion` default 13 → **18** with `max` 20 → **26**. At 340/13 the coral filled barely a third of the poster. The ranges were raised alongside the defaults so neither slider sits pinned at its own maximum.
- **`tests/patterns/harness.ts`**: added `INVARIANT_TIMEOUT_MS = 60_000` passed as the third argument to all five `it(...)` calls. A `heavy` pattern runs a full simulation per invariant (defaults plus every single-param extreme), which exceeds vitest's 5 s default once diffgrowth's ceiling rises. This is a property of the harness, not of one pattern. diffgrowth's test file now takes ~12 s; the rest of the suite is unaffected.

## Part 3 kickoff items (from the final adversarial review, commit e876866)

Fixed before merge: stale worker responses painting over a switched-to pattern (versioned on state generation + stage identity); worker error path (try/catch in the worker, error field, `onerror`, `.computing` always cleared); self-describing URLs (see spec §4.3). Deliberately deferred, in priority order:

1. **Extract `src/core/render.ts`** exposing `renderToNode(state, size): SvgNode | Promise<SvgNode>` that owns the worker, a result cache and the generation counter. The playground, the poster composer and the exporter all call it. This single refactor closes the next three items together.
2. **Cache the generated `SvgNode`** — a palette or theme change currently re-runs the whole simulation (~0.8 s on diffgrowth) even though role tokens resolve at serialize time. The composer will change colors constantly.
3. **Coalesce/cancel worker requests** — a slider drag on a heavy pattern can enqueue dozens of superseded simulations; results are discarded but the CPU still burns them.
4. **Emit the paper background inside the SVG** (`<rect fill="paper">` as child 0, added in `generateSafe` so no pattern can forget). Today the paper color lives on a `<div>`, so SVG/PNG exports would be transparent. Changes all 13 snapshots and the element budgets — do it as its own task.
5. **Decide what `size` means** — 9 patterns scale their artwork with the canvas while 4 tile it (element counts grow ~3.7× at print size, untested). Either generate at a canonical art size and scale via `viewBox`, or make density a param and assert budgets at the largest supported format.
6. **Panel rebuild on every `setState`** drops focus and scroll; it gets worse as the panel grows.

Smaller notes worth carrying: enum indices are positional public API (mark the backing arrays append-only — the new `all.test.ts` options-length assertion guards the crash case); `clifford` is the one pattern whose exact bytes are not portable across JS engines under 1-ulp math differences (its shape is invariant, so don't advertise byte-exact permanence for it); `core/noise.ts` uses the GLSL `fract(sin·k)` hash where the existing FNV-1a `deriveSeed` would be exactly portable; 2-decimal coordinate rounding is load-bearing for determinism but implemented in four ad-hoc idioms — export one `n2()` from `core/svg` and assert it in the harness; `decodeState` admits and re-emits foreign params from hand-edited URLs.

## Self-Review (done at write time)

- **Spec coverage (Part 2 scope):** 13 launch shapes ✓ (2 from Part 1 + Tasks 6–16 = 13); hardening items a/b-partial/c-deviation/d/f/g/h ✓ (Task 1–2; generic-params (b) deliberately dropped — bracket access with `!` is established style across 13 modules now, revisit only if it actually bites; lazy manifest (c) documented deviation in header); worker (e) ✓ Task 17; RESERVED future keys (i) ✓ Task 1 includes Part 3 keys.
- **Placeholder scan:** none; every code step complete.
- **Type consistency:** `ParamDef.options` optional field used by delaunay/harmonograph/clifford/truchet enums ✓; `usesSeed` set on stipple/delaunay/voronoi/harmonograph/flowfield/truchet/hitomezashi/diffgrowth, absent on timestable/clifford/girih (deterministic-by-params) ✓; harness `render` helper signature matches all uses ✓; worker message shape matches both sides ✓; `standardPatternTests` reads `def.usesSeed` which exists on PatternDef after Task 1 of Part 1's fix commit (`usesSeed?: boolean`) ✓.
- **Budgets:** stipple 9000 (cap 8000 dots + margin), clifford 12500 (maxDots 12000), flowfield 4000, others small — all within the research ≤50k guidance.




