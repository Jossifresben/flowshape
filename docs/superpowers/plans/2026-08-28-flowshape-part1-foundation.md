# flowshape.art Part 1 — Foundation, Core Engine, First Patterns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Vite + vanilla TypeScript site where two patterns (Phyllotaxis, Maurer Rose) render deterministically from URL state with working parameter sliders, seed control, palettes, and light/dark themes.

**Architecture:** Pure deterministic pattern modules (`(params, seed, size) → SVG node tree` with role-token colors) behind a registry; a thin DOM playground renders them and mirrors every change into the URL hash. No framework. Spec: `docs/superpowers/specs/2026-08-28-flowshape-design.md`.

**Tech Stack:** Vite, TypeScript (strict), vitest, plain DOM, SVG.

**Roadmap (separate plans, in order):** Part 2 = remaining 11 launch patterns + workers. Part 3 = poster composer, formats, SVG/PNG export, gallery with build-time thumbnails. Part 4 = explain-the-math content EN/ES, i18n pass, Netlify deploy. Do not build ahead of the current plan.

**Conventions for every task:** run commands from the repo root `/Users/jfresco16/Google Drive/Claude/shapeit`. Commit after each task with the message given. Never `git push` — Hermes authorizes pushes explicitly, per message.

---

### Task 1: Vite + TypeScript + vitest scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/style.css`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "flowshape",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "isolatedModules": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: { target: 'es2022' },
});
```

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <title>flowshape.art</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `src/style.css`** (theme tokens — the light/dark foundation)

```css
:root {
  --paper: #ffffff;
  --fog: #f2f2f0;
  --line: #e0e0dc;
  --ink: #1c1b22;
  --gray: #8a8a86;
  --accent: #e3261a;
  --font-ui: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'IBM Plex Mono', Menlo, monospace;
}
[data-theme='dark'] {
  --paper: #17171a;
  --fog: #101012;
  --line: #2e2e33;
  --ink: #ececea;
  --gray: #8e8e90;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-ui);
  background: var(--paper);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 6: Write `src/main.ts`** (placeholder until Task 8 wires the app)

```ts
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.textContent = 'flowshape.art';
```

- [ ] **Step 7: Install and verify**

Run: `npm install && npm run build`
Expected: build succeeds, `dist/` created.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: Vite + TypeScript + vitest scaffold"
```

---

### Task 2: Seeded PRNG (`core/prng.ts`)

**Files:**
- Create: `src/core/prng.ts`
- Test: `tests/core/prng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/core/prng.test.ts
import { describe, it, expect } from 'vitest';
import { mulberry32, deriveSeed } from '../../src/core/prng';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('yields values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('deriveSeed', () => {
  it('is stable per (seed, name) and differs across names', () => {
    expect(deriveSeed(42, 'points')).toBe(deriveSeed(42, 'points'));
    expect(deriveSeed(42, 'points')).not.toBe(deriveSeed(42, 'angle'));
    expect(deriveSeed(42, 'points')).not.toBe(deriveSeed(43, 'points'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/prng.test.ts`
Expected: FAIL — cannot resolve `../../src/core/prng`.

- [ ] **Step 3: Implement `src/core/prng.ts`**

```ts
/** Deterministic PRNG. Same seed ⇒ same sequence, on every platform. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a name, mixed into a seed — stable sub-streams per subsystem. */
export function deriveSeed(seed: number, name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (seed ^ h) >>> 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/prng.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/prng.ts tests/core/prng.test.ts && git commit -m "feat: seeded PRNG with derived sub-streams"
```

---

### Task 3: SVG node tree (`core/svg.ts`)

Patterns emit a plain-object node tree (worker-serializable), with colors as **role tokens** (`"ink" | "paper" | "accent"`), resolved to hex only at render time.

**Files:**
- Create: `src/core/svg.ts`
- Test: `tests/core/svg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/core/svg.test.ts
import { describe, it, expect } from 'vitest';
import { el, serialize, type SvgNode, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#1c1b22', accent: '#e3261a' };

describe('serialize', () => {
  it('renders a node tree with resolved role colors', () => {
    const tree: SvgNode = el('svg', { viewBox: '0 0 100 100' }, [
      el('circle', { cx: 50, cy: 50, r: 10, fill: 'ink' }),
      el('path', { d: 'M0 0L10 10', stroke: 'accent', fill: 'none' }),
    ]);
    expect(serialize(tree, pal)).toBe(
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="50" cy="50" r="10" fill="#1c1b22"/>' +
        '<path d="M0 0L10 10" stroke="#e3261a" fill="none"/>' +
        '</svg>',
    );
  });

  it('escapes attribute values', () => {
    const tree = el('svg', { 'data-x': 'a"<b>&' });
    expect(serialize(tree, pal)).toContain('data-x="a&quot;&lt;b&gt;&amp;"');
  });

  it('rounds numeric attributes to 2 decimals', () => {
    const tree = el('svg', {}, [el('circle', { cx: 1.23456, cy: 2, r: 0.100001 })]);
    expect(serialize(tree, pal)).toContain('cx="1.23"');
    expect(serialize(tree, pal)).toContain('r="0.1"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/svg.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/core/svg.ts`**

```ts
export type Role = 'ink' | 'paper' | 'accent';
export interface Palette { paper: string; ink: string; accent: string }

export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: SvgNode[];
}

export function el(
  tag: string,
  attrs: Record<string, string | number> = {},
  children: SvgNode[] = [],
): SvgNode {
  return { tag, attrs, children };
}

const ROLE_ATTRS = new Set(['fill', 'stroke']);
const ROLES = new Set<string>(['ink', 'paper', 'accent']);

function fmt(v: string | number): string {
  if (typeof v === 'number') {
    const r = Math.round(v * 100) / 100;
    return String(r);
  }
  return v;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function serialize(node: SvgNode, pal: Palette): string {
  const attrs = { ...node.attrs };
  if (node.tag === 'svg' && attrs['xmlns'] === undefined) {
    attrs['xmlns'] = 'http://www.w3.org/2000/svg';
  }
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    let out = fmt(v);
    if (ROLE_ATTRS.has(k) && ROLES.has(out)) out = pal[out as Role];
    parts.push(`${k}="${esc(out)}"`);
  }
  const open = `<${node.tag}${parts.length ? ' ' + parts.join(' ') : ''}`;
  if (node.children.length === 0) return `${open}/>`;
  return `${open}>${node.children.map((c) => serialize(c, pal)).join('')}</${node.tag}>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/svg.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/svg.ts tests/core/svg.test.ts && git commit -m "feat: serializable SVG node tree with role-token colors"
```

---

### Task 4: Pattern contract and registry (`patterns/registry.ts`)

**Files:**
- Create: `src/patterns/registry.ts`
- Test: `tests/patterns/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/patterns/registry.test.ts
import { describe, it, expect } from 'vitest';
import { definePattern, getPattern, listPatterns, defaultParams } from '../../src/patterns/registry';
import { el } from '../../src/core/svg';

const dummy = definePattern({
  id: 'dummy',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'n', kind: 'int', min: 1, max: 10, step: 1, default: 3, label: 'param.n' },
    { key: 'wobble', kind: 'float', min: 0, max: 1, step: 0.01, default: 0.5, label: 'param.wobble' },
  ],
  generate: (p, _seed, size) => el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }),
});

describe('registry', () => {
  it('registers and retrieves by id', () => {
    expect(getPattern('dummy')).toBe(dummy);
    expect(listPatterns().map((p) => p.id)).toContain('dummy');
  });

  it('returns undefined for unknown ids', () => {
    expect(getPattern('nope')).toBeUndefined();
  });

  it('builds default params from defs', () => {
    expect(defaultParams(dummy)).toEqual({ n: 3, wobble: 0.5 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/patterns/registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/patterns/registry.ts`**

```ts
import type { SvgNode } from '../core/svg';

export type Family = 'points' | 'curves' | 'fields' | 'attractors' | 'tilings' | 'growth';

export interface ParamDef {
  key: string;
  kind: 'int' | 'float';
  min: number;
  max: number;
  step: number;
  default: number;
  label: string; // i18n key
}

export type Params = Record<string, number>;
export interface Size { w: number; h: number }

export interface PatternDef {
  id: string;
  family: Family;
  phase: 1 | 2;
  heavy: boolean;
  params: ParamDef[];
  /** Pure and deterministic: same inputs ⇒ identical tree. Colors as role tokens. */
  generate(params: Params, seed: number, size: Size): SvgNode;
}

const registry = new Map<string, PatternDef>();

export function definePattern(def: PatternDef): PatternDef {
  if (registry.has(def.id)) throw new Error(`duplicate pattern id: ${def.id}`);
  registry.set(def.id, def);
  return def;
}

export function getPattern(id: string): PatternDef | undefined {
  return registry.get(id);
}

export function listPatterns(): PatternDef[] {
  return [...registry.values()];
}

export function defaultParams(def: PatternDef): Params {
  return Object.fromEntries(def.params.map((p) => [p.key, p.default]));
}

/** Clamp arbitrary (URL-supplied) values into the param's legal range. */
export function clampParams(def: PatternDef, raw: Params): Params {
  const out: Params = {};
  for (const p of def.params) {
    let v = raw[p.key];
    if (v === undefined || Number.isNaN(v)) v = p.default;
    v = Math.min(p.max, Math.max(p.min, v));
    if (p.kind === 'int') v = Math.round(v);
    out[p.key] = v;
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/patterns/registry.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add a clamp test and run the suite**

Append to `tests/patterns/registry.test.ts`:

```ts
import { clampParams } from '../../src/patterns/registry';

describe('clampParams', () => {
  it('clamps to range, rounds ints, defaults NaN/missing', () => {
    expect(clampParams(dummy, { n: 99, wobble: -3 })).toEqual({ n: 10, wobble: 0 });
    expect(clampParams(dummy, { n: 4.7 })).toEqual({ n: 5, wobble: 0.5 });
    expect(clampParams(dummy, { n: NaN, wobble: 0.25 })).toEqual({ n: 3, wobble: 0.25 });
  });
});
```

Run: `npx vitest run tests/patterns/registry.test.ts` — Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/patterns/registry.ts tests/patterns/registry.test.ts && git commit -m "feat: pattern contract, registry, param clamping"
```

---

### Task 5: Phyllotaxis pattern (`patterns/phyllotaxis.ts`)

The exemplar pattern: dots + optional parastichy connections, accent-every-N. Formula (research catalog `docs/research/2026-08-28-fields-emergent.md` §2): `θ = n·angle`, `r = c·n^p`; golden angle default 137.50776°.

**Files:**
- Create: `src/patterns/phyllotaxis.ts`
- Test: `tests/patterns/phyllotaxis.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/patterns/phyllotaxis.test.ts
import { describe, it, expect } from 'vitest';
import { phyllotaxis } from '../../src/patterns/phyllotaxis';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const size = { w: 600, h: 840 };

describe('phyllotaxis', () => {
  it('is deterministic: same inputs ⇒ identical SVG', () => {
    const p = defaultParams(phyllotaxis);
    const a = serialize(phyllotaxis.generate(p, 42, size), pal);
    const b = serialize(phyllotaxis.generate(p, 42, size), pal);
    expect(a).toBe(b);
    expect(a.startsWith('<svg')).toBe(true);
  });

  it('emits one circle per point plus accents', () => {
    const p = { ...defaultParams(phyllotaxis), points: 200, accentEvery: 50 };
    const svg = serialize(phyllotaxis.generate(p, 1, size), pal);
    expect(svg.match(/<circle/g)!.length).toBe(200);
    expect(svg.match(/#e3261a/g)!.length).toBe(4); // n = 0, 50, 100, 150
  });

  it('produces no NaN coordinates across the param matrix', () => {
    for (const points of [10, 2000]) {
      for (const angle of [90, 137.50776, 179.9]) {
        for (const radialExp of [0.4, 1]) {
          const svg = serialize(
            phyllotaxis.generate(
              { ...defaultParams(phyllotaxis), points, angle, radialExp },
              7,
              size,
            ),
            pal,
          );
          expect(svg).not.toContain('NaN');
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/patterns/phyllotaxis.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/patterns/phyllotaxis.ts`**

```ts
import { el } from '../core/svg';
import { definePattern } from './registry';

const GOLDEN = 137.50776405;

export const phyllotaxis = definePattern({
  id: 'phyllotaxis',
  family: 'points',
  phase: 1,
  heavy: false,
  params: [
    { key: 'points', kind: 'int', min: 50, max: 4000, step: 10, default: 1500, label: 'phyllotaxis.points' },
    { key: 'angle', kind: 'float', min: 90, max: 180, step: 0.01, default: GOLDEN, label: 'phyllotaxis.angle' },
    { key: 'radialExp', kind: 'float', min: 0.35, max: 1, step: 0.01, default: 0.5, label: 'phyllotaxis.radialExp' },
    { key: 'dotMin', kind: 'float', min: 0.2, max: 6, step: 0.1, default: 1, label: 'phyllotaxis.dotMin' },
    { key: 'dotGrow', kind: 'float', min: 0, max: 0.01, step: 0.0001, default: 0.003, label: 'phyllotaxis.dotGrow' },
    { key: 'accentEvery', kind: 'int', min: 0, max: 200, step: 1, default: 89, label: 'phyllotaxis.accentEvery' },
  ],
  generate(p, _seed, size) {
    const points = p['points']!;
    const angleRad = (p['angle']! * Math.PI) / 180;
    const exp = p['radialExp']!;
    const cx = size.w / 2;
    const cy = size.h / 2;
    // Fit the outermost point inside the short half-dimension with a 6% margin.
    const maxR = Math.min(size.w, size.h) * 0.47;
    const scale = maxR / Math.pow(points - 1, exp);
    const children = [];
    for (let n = 0; n < points; n++) {
      const r = scale * Math.pow(n, exp);
      const a = n * angleRad;
      const accent = p['accentEvery']! > 0 && n % p['accentEvery']! === 0;
      children.push(
        el('circle', {
          cx: cx + r * Math.cos(a),
          cy: cy + r * Math.sin(a),
          r: p['dotMin']! + n * p['dotGrow']!,
          fill: accent ? 'accent' : 'ink',
        }),
      );
    }
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/patterns/phyllotaxis.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/patterns/phyllotaxis.ts tests/patterns/phyllotaxis.test.ts && git commit -m "feat: phyllotaxis pattern"
```

---

### Task 6: Maurer Rose pattern (`patterns/maurer.ts`)

Formula (research catalog `docs/research/2026-08-28-analytic-curves.md` §3): walk k = 0…360, θ = k·d°, r = R·sin(n·θ); connect consecutive points; optional smooth rose envelope.

**Files:**
- Create: `src/patterns/maurer.ts`
- Test: `tests/patterns/maurer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/patterns/maurer.test.ts
import { describe, it, expect } from 'vitest';
import { maurer } from '../../src/patterns/maurer';
import { defaultParams } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';

const pal: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const size = { w: 600, h: 840 };

describe('maurer', () => {
  it('is deterministic', () => {
    const p = defaultParams(maurer);
    expect(serialize(maurer.generate(p, 1, size), pal)).toBe(
      serialize(maurer.generate(p, 1, size), pal),
    );
  });

  it('emits the walk path and an envelope path when enabled', () => {
    const p = { ...defaultParams(maurer), envelope: 1 };
    const svg = serialize(maurer.generate(p, 1, size), pal);
    expect(svg.match(/<path/g)!.length).toBe(2);
  });

  it('emits only the walk path when envelope is off', () => {
    const p = { ...defaultParams(maurer), envelope: 0 };
    const svg = serialize(maurer.generate(p, 1, size), pal);
    expect(svg.match(/<path/g)!.length).toBe(1);
  });

  it('no NaN across the param matrix', () => {
    for (const n of [1, 6, 8]) {
      for (const d of [1, 71, 359]) {
        const svg = serialize(
          maurer.generate({ ...defaultParams(maurer), n, d }, 1, size),
          pal,
        );
        expect(svg).not.toContain('NaN');
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/patterns/maurer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/patterns/maurer.ts`**

```ts
import { el, type SvgNode } from '../core/svg';
import { definePattern } from './registry';

const D2R = Math.PI / 180;

export const maurer = definePattern({
  id: 'maurer',
  family: 'curves',
  phase: 1,
  heavy: false,
  params: [
    { key: 'n', kind: 'int', min: 1, max: 12, step: 1, default: 6, label: 'maurer.n' },
    { key: 'd', kind: 'int', min: 1, max: 359, step: 1, default: 71, label: 'maurer.d' },
    { key: 'strokeWidth', kind: 'float', min: 0.2, max: 3, step: 0.1, default: 0.7, label: 'maurer.strokeWidth' },
    { key: 'envelope', kind: 'int', min: 0, max: 1, step: 1, default: 1, label: 'maurer.envelope' },
  ],
  generate(p, _seed, size) {
    const n = p['n']!;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const R = Math.min(size.w, size.h) * 0.44;
    const walk: string[] = [];
    for (let k = 0; k <= 360; k++) {
      const th = k * p['d']! * D2R;
      const r = R * Math.sin(n * th);
      walk.push(`${k ? 'L' : 'M'}${cx + r * Math.cos(th)} ${cy + r * Math.sin(th)}`);
    }
    const children: SvgNode[] = [];
    if (p['envelope']! === 1) {
      const env: string[] = [];
      for (let k = 0; k <= 1440; k++) {
        const th = k * 0.25 * D2R;
        const r = R * Math.sin(n * th);
        env.push(`${k ? 'L' : 'M'}${cx + r * Math.cos(th)} ${cy + r * Math.sin(th)}`);
      }
      children.push(
        el('path', { d: env.join(''), fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']! * 1.4, opacity: 0.25 }),
      );
    }
    children.push(
      el('path', { d: walk.join(''), fill: 'none', stroke: 'ink', 'stroke-width': p['strokeWidth']!, opacity: 0.8 }),
    );
    return el('svg', { viewBox: `0 0 ${size.w} ${size.h}` }, children);
  },
});
```

Note: path `d` strings are built with raw numbers; `serialize` only rounds attribute values it formats, so round here at the source. Amend the two push lines to round:

```ts
      walk.push(`${k ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(2)} ${(cy + r * Math.sin(th)).toFixed(2)}`);
```

```ts
        env.push(`${k ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(2)} ${(cy + r * Math.sin(th)).toFixed(2)}`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/patterns/maurer.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/patterns/maurer.ts tests/patterns/maurer.test.ts && git commit -m "feat: maurer rose pattern"
```

---

### Task 7: Palettes (`poster/palettes.ts`)

**Files:**
- Create: `src/poster/palettes.ts`
- Test: `tests/poster/palettes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/poster/palettes.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/poster/palettes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/poster/palettes.ts`**

```ts
import type { Palette } from '../core/svg';

export interface PaletteDef extends Palette { id: string; name: string }

export const PALETTES: PaletteDef[] = [
  { id: 'mono-light', name: 'Mono Light', paper: '#ffffff', ink: '#1c1b22', accent: '#e3261a' },
  { id: 'mono-dark', name: 'Mono Dark', paper: '#17171a', ink: '#ececea', accent: '#e3261a' },
  { id: 'navy-gold', name: 'Navy & Gold', paper: '#131a2b', ink: '#e8dcc0', accent: '#d9a441' },
  { id: 'teal-sand', name: 'Teal & Sand', paper: '#0e3b43', ink: '#f5f0e6', accent: '#d9a441' },
  { id: 'terracotta', name: 'Terracotta', paper: '#f5f0e6', ink: '#1c1b22', accent: '#b5502a' },
  { id: 'sashiko', name: 'Sashiko Indigo', paper: '#1f3a5f', ink: '#f5f0e6', accent: '#d9a441' },
  { id: 'ivory-forest', name: 'Ivory & Forest', paper: '#f5f0e6', ink: '#2f4a3c', accent: '#b5502a' },
  { id: 'paper-cobalt', name: 'Paper & Cobalt', paper: '#ffffff', ink: '#1d3fbf', accent: '#e3261a' },
];

const HEX = /^[0-9a-fA-F]{6}$/;

export interface ColorState { pal?: string; bg?: string; ink?: string; acc?: string }

export function resolvePalette(c: ColorState, theme: 'light' | 'dark'): Palette {
  const fallback = theme === 'dark' ? PALETTES[1]! : PALETTES[0]!;
  const base = PALETTES.find((p) => p.id === c.pal) ?? fallback;
  return {
    paper: c.bg && HEX.test(c.bg) ? '#' + c.bg.toLowerCase() : base.paper,
    ink: c.ink && HEX.test(c.ink) ? '#' + c.ink.toLowerCase() : base.ink,
    accent: c.acc && HEX.test(c.acc) ? '#' + c.acc.toLowerCase() : base.accent,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/poster/palettes.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/poster/palettes.ts tests/poster/palettes.test.ts && git commit -m "feat: predefined palettes with hex overrides"
```

---

### Task 8: URL state (`core/url-state.ts`)

State lives in the hash: `#/p/<patternId>?v=1&seed=42&<paramKey>=<num>...&pal=...&bg=...&theme=dark&lang=es`.

**Files:**
- Create: `src/core/url-state.ts`
- Test: `tests/core/url-state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/core/url-state.test.ts
import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, type AppState } from '../../src/core/url-state';

const state: AppState = {
  patternId: 'phyllotaxis',
  seed: 71203,
  params: { points: 1500, angle: 137.51 },
  color: { pal: 'navy-gold' },
  theme: 'dark',
  lang: 'es',
};

describe('url state', () => {
  it('round-trips', () => {
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it('decodes hex overrides and omits empty fields', () => {
    const s: AppState = { ...state, color: { bg: '131a2b' }, theme: 'light', lang: 'en' };
    const hash = encodeState(s);
    expect(hash).not.toContain('pal=');
    expect(hash).not.toContain('theme='); // light is default, omitted
    expect(hash).not.toContain('lang=');  // en is default, omitted
    expect(decodeState(hash)).toEqual(s);
  });

  it('returns null for an unknown route shape', () => {
    expect(decodeState('#/nope')).toBeNull();
    expect(decodeState('')).toBeNull();
  });

  it('survives garbage params (clamping happens later, decoding never throws)', () => {
    const s = decodeState('#/p/phyllotaxis?v=1&seed=abc&points=<script>&angle=12');
    expect(s).not.toBeNull();
    expect(s!.seed).toBe(1); // non-numeric seed falls back to 1
    expect(s!.params['angle']).toBe(12);
    expect(s!.params['points']).toBeUndefined(); // non-numeric dropped
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/url-state.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/core/url-state.ts`**

```ts
import type { ColorState } from '../poster/palettes';

export interface AppState {
  patternId: string;
  seed: number;
  params: Record<string, number>;
  color: ColorState;
  theme: 'light' | 'dark';
  lang: 'en' | 'es';
}

const RESERVED = new Set(['v', 'seed', 'pal', 'bg', 'ink', 'acc', 'theme', 'lang']);

export function encodeState(s: AppState): string {
  const q = new URLSearchParams();
  q.set('v', '1');
  q.set('seed', String(s.seed));
  for (const [k, v] of Object.entries(s.params)) q.set(k, String(Math.round(v * 10000) / 10000));
  if (s.color.pal) q.set('pal', s.color.pal);
  if (s.color.bg) q.set('bg', s.color.bg);
  if (s.color.ink) q.set('ink', s.color.ink);
  if (s.color.acc) q.set('acc', s.color.acc);
  if (s.theme !== 'light') q.set('theme', s.theme);
  if (s.lang !== 'en') q.set('lang', s.lang);
  return `#/p/${encodeURIComponent(s.patternId)}?${q.toString()}`;
}

export function decodeState(hash: string): AppState | null {
  const m = /^#\/p\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  const q = new URLSearchParams(m[2] ?? '');
  const params: Record<string, number> = {};
  for (const [k, v] of q.entries()) {
    if (RESERVED.has(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) params[k] = n;
  }
  const seedRaw = Number(q.get('seed'));
  const color: ColorState = {};
  const pal = q.get('pal'); if (pal) color.pal = pal;
  const bg = q.get('bg'); if (bg) color.bg = bg;
  const ink = q.get('ink'); if (ink) color.ink = ink;
  const acc = q.get('acc'); if (acc) color.acc = acc;
  return {
    patternId: decodeURIComponent(m[1]!),
    seed: Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1,
    params,
    color,
    theme: q.get('theme') === 'dark' ? 'dark' : 'light',
    lang: q.get('lang') === 'es' ? 'es' : 'en',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/url-state.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/url-state.ts tests/core/url-state.test.ts && git commit -m "feat: versioned URL state encode/decode"
```

---

### Task 9: Playground UI (`ui/`)

Wires everything: route from hash, render pattern, param sliders, seed randomize, palette row + custom pickers, theme and language toggles. DOM only, no framework. This task is UI plumbing — tests are the existing unit suites plus a manual check; keep all logic that can be pure in the modules already tested.

**Files:**
- Create: `src/ui/playground.ts`, `src/ui/controls.ts`
- Modify: `src/main.ts`, `src/style.css`

- [ ] **Step 1: Write `src/ui/controls.ts`** (pure DOM builders)

```ts
import type { ParamDef } from '../patterns/registry';
import { PALETTES, type ColorState } from '../poster/palettes';

export function sliderRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row';
  const head = document.createElement('div');
  head.className = 'ctl-head';
  const label = document.createElement('span');
  label.className = 'ctl-label';
  label.textContent = def.label.split('.').pop()!.toUpperCase();
  const val = document.createElement('span');
  val.className = 'ctl-value';
  val.textContent = String(value);
  head.append(label, val);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(def.min);
  input.max = String(def.max);
  input.step = String(def.step);
  input.value = String(value);
  input.addEventListener('input', () => {
    val.textContent = input.value;
    onChange(Number(input.value));
  });
  row.append(head, input);
  return row;
}

export function paletteRow(
  current: ColorState,
  onChange: (c: ColorState) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pal-row';
  for (const p of PALETTES) {
    const b = document.createElement('button');
    b.className = 'pal-chip' + (current.pal === p.id ? ' selected' : '');
    b.title = p.name;
    for (const c of [p.paper, p.ink, p.accent]) {
      const sw = document.createElement('span');
      sw.style.background = c;
      b.append(sw);
    }
    b.addEventListener('click', () => onChange({ pal: p.id }));
    row.append(b);
  }
  return row;
}
```

- [ ] **Step 2: Write `src/ui/playground.ts`**

```ts
import { getPattern, defaultParams, clampParams } from '../patterns/registry';
import { serialize } from '../core/svg';
import { encodeState, decodeState, type AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import { sliderRow, paletteRow } from './controls';

const DEFAULT_STATE: AppState = {
  patternId: 'phyllotaxis',
  seed: 1,
  params: {},
  color: {},
  theme: 'light',
  lang: 'en',
};

export function mountPlayground(root: HTMLElement): void {
  let state = decodeState(location.hash) ?? DEFAULT_STATE;

  function setState(next: Partial<AppState>): void {
    state = { ...state, ...next };
    history.replaceState(null, '', encodeState(state));
    render();
  }

  function render(): void {
    const def = getPattern(state.patternId);
    if (!def) {
      root.textContent = 'Unknown pattern';
      return;
    }
    document.documentElement.dataset['theme'] = state.theme;
    const params = clampParams(def, { ...defaultParams(def), ...state.params });
    const pal = resolvePalette(state.color, state.theme);
    root.innerHTML = '';

    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.style.background = pal.paper;
    stage.innerHTML = serialize(def.generate(params, state.seed, { w: 600, h: 840 }), pal);

    const panel = document.createElement('div');
    panel.className = 'panel';

    const seedRow = document.createElement('div');
    seedRow.className = 'ctl-row';
    const seedVal = document.createElement('span');
    seedVal.className = 'ctl-value';
    seedVal.textContent = `SEED ${state.seed}`;
    const rand = document.createElement('button');
    rand.className = 'btn';
    rand.textContent = 'Randomize';
    rand.addEventListener('click', () =>
      setState({ seed: 1 + Math.floor(Math.random() * 99999) }),
    );
    seedRow.append(seedVal, rand);
    panel.append(seedRow);

    for (const pd of def.params) {
      panel.append(sliderRow(pd, params[pd.key]!, (v) => setState({ params: { ...params, [pd.key]: v } })));
    }
    panel.append(paletteRow(state.color, (c) => setState({ color: c })));

    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn';
    themeBtn.textContent = state.theme === 'light' ? 'Dark theme' : 'Light theme';
    themeBtn.addEventListener('click', () =>
      setState({ theme: state.theme === 'light' ? 'dark' : 'light' }),
    );
    panel.append(themeBtn);

    root.append(stage, panel);
  }

  window.addEventListener('hashchange', () => {
    state = decodeState(location.hash) ?? DEFAULT_STATE;
    render();
  });
  render();
}
```

Note on `rand`: `Math.random` here is UI-only seed *picking* — the render itself stays deterministic from the picked seed, which is what the determinism rule protects.

- [ ] **Step 3: Rewrite `src/main.ts`**

```ts
import './style.css';
import './patterns/phyllotaxis';
import './patterns/maurer';
import { mountPlayground } from './ui/playground';

mountPlayground(document.querySelector<HTMLDivElement>('#app')!);
```

- [ ] **Step 4: Append layout styles to `src/style.css`**

```css
#app { display: flex; height: 100vh; }
.stage { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.stage svg { max-width: 100%; max-height: 100%; }
.panel {
  width: 320px; border-left: 1px solid var(--line); padding: 20px;
  display: flex; flex-direction: column; gap: 16px; overflow-y: auto;
}
.ctl-row { display: flex; flex-direction: column; gap: 8px; }
.ctl-head { display: flex; justify-content: space-between; }
.ctl-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--gray); }
.ctl-value { font-family: var(--font-mono); font-size: 12px; }
.btn {
  font-family: var(--font-mono); font-size: 11px; padding: 8px 14px;
  border: 1px solid var(--ink); background: transparent; color: var(--ink); cursor: pointer;
}
.pal-row { display: flex; flex-wrap: wrap; gap: 8px; }
.pal-chip {
  display: flex; padding: 2px; gap: 2px; border: 2px solid transparent;
  background: transparent; cursor: pointer;
}
.pal-chip.selected { border-color: var(--ink); }
.pal-chip span { width: 22px; height: 22px; display: block; border: 1px solid var(--line); }
input[type='range'] { accent-color: var(--ink); }
```

- [ ] **Step 5: Verify the full suite and the app**

Run: `npm run test` — Expected: all suites PASS.
Run: `npm run dev`, open `http://localhost:5173/#/p/phyllotaxis?v=1&seed=42` — Expected: phyllotaxis renders; sliders update pattern and URL live; palette chips recolor; theme toggles; `#/p/maurer` works; an unknown id shows "Unknown pattern"; reloading any URL reproduces the exact image.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: playground UI — routing, sliders, palettes, themes"
```

---

### Task 10: Netlify config

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
```

- [ ] **Step 2: Verify a production build locally**

Run: `npm run build && npx vite preview` — open the printed URL, check `#/p/phyllotaxis` renders.

- [ ] **Step 3: Commit, then STOP — ask Hermes before pushing**

```bash
git add netlify.toml && git commit -m "chore: netlify build config"
```

Pushing `main` triggers a live deploy to flowshape.art. Do not push without Hermes saying so in that message.

---

## Self-Review (done at write time)

- **Spec coverage (Part 1 scope):** stack §2 ✓ (T1), determinism §2/§4.2 ✓ (T2, T5, T6 snapshot tests), role tokens §4.2 ✓ (T3), registry + clamping §4.2/§6 ✓ (T4), color system §4.6 ✓ (T7, T9), URL schema §4.3 ✓ (T8, garbage-input test per §6), themes §4.7 ✓ (T1 CSS + T9), Netlify §8 ✓ (T10). Deferred to Parts 2–4 by design: remaining 11 patterns, workers, poster composer/formats/export, gallery, explain modals, i18n files (labels are i18n keys already), EN/ES strings.
- **Placeholder scan:** no TBDs; every code step carries complete code.
- **Type consistency:** `Palette`/`SvgNode`/`Role` (T3) used by T5–T9; `ParamDef.kind` int/float only (enum/toggle needs come with Part 2 patterns — Truchet variants — and will extend the union there); `ColorState` defined in palettes (T7) and imported by url-state (T8) — T8 depends on T7, execute in plan order.

