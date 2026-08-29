# flowshape.art Part 3 — Export, Formats, Explain, Code

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pattern can be exported as a print-ready SVG or PNG at a chosen poster format, and every pattern can explain its own mathematics and show its own source code.

**Architecture:** Formats become state and drive the render size (short edge fixed at 600 user units). Export serializes the *cached* node — never a re-simulation. Explain and Code share one modal with two tabs; both load their content lazily so neither touches the initial bundle. Spec: `docs/superpowers/specs/2026-08-29-flowshape-part3-spec.md`.

**Tech Stack:** unchanged — Vite, TypeScript strict, vitest, plain DOM, SVG.

**Conventions:** repo root `/Users/jfresco16/Google Drive/Claude/shapeit`; branch `feat/part3-export` (created in Task 1). Commit per task with the message given. **Never `git push` and never merge to `main`** — Hermes authorizes both explicitly, per message. Pattern modules are not touched by this plan at all.

---

### Task 1: Branch and recalibrate `heavy`

**Files:** Modify: whichever pattern modules change flag; Create: none (the measurement script is temporary).

- [ ] **Step 1: Branch**

Run: `git checkout main && git checkout -b feat/part3-export`

(Note: a branch of this name may already exist from earlier WIP, along with `stash@{0}`. If so, inspect the stash with `git stash show -p stash@{0}`, discard it if it only contains a superseded `heavy: false` edit to `voxel.ts`, and reset the branch to `main`. Report what you found.)

- [ ] **Step 2: Measure every pattern**

Write a temporary `scripts/measure.ts`, run it with `npx vite-node scripts/measure.ts`, then delete it. For each registered pattern, time `generateSafe(def, params, 1, {w:600,h:849})` at (a) defaults and (b) the most expensive parameter extreme — for each ParamDef take whichever of `min`/`max` produces more work (higher counts, more iterations, finer spacing), combined. Take the median of 5 runs.

```ts
import '../src/patterns/index';
import { listPatterns, generateSafe, defaultParams } from '../src/patterns/registry';

const SIZE = { w: 600, h: 849 };
const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const time = (fn: () => unknown) => {
  const runs: number[] = [];
  for (let i = 0; i < 5; i++) { const t = performance.now(); fn(); runs.push(performance.now() - t); }
  return median(runs);
};

for (const def of listPatterns()) {
  const base = defaultParams(def);
  const heavyParams: Record<string, number> = { ...base };
  for (const p of def.params) {
    if (p.key === 'size') continue;
    // pick the end of the range that costs more; measure both and keep the slower
    const lo = { ...base, [p.key]: p.min }, hi = { ...base, [p.key]: p.max };
    const tLo = time(() => generateSafe(def, lo, 1, SIZE));
    const tHi = time(() => generateSafe(def, hi, 1, SIZE));
    heavyParams[p.key] = tHi >= tLo ? p.max : p.min;
  }
  const atDefault = time(() => generateSafe(def, base, 1, SIZE));
  const atExtreme = time(() => generateSafe(def, heavyParams, 1, SIZE));
  console.log(`${def.id}\t${atDefault.toFixed(1)}\t${atExtreme.toFixed(1)}\t${def.heavy}`);
}
```

- [ ] **Step 3: Set the flag from the data**

Flag `heavy: true` only where the **extreme** measurement exceeds 50 ms. Report the full table and every flag you changed. Expect `diffgrowth` to stay heavy and `voxel` to drop; verify rather than assume.

- [ ] **Step 4: Verify**

Run: `npm run test` (all pass) and `npm run build`. Then in the browser confirm a pattern that just became synchronous still renders correctly and that `diffgrowth` still shows its computing state.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "perf: flag only genuinely heavy patterns for the worker"
```

---

### Task 2: `poster/formats.ts`

**Files:** Create: `src/poster/formats.ts`; Test: `tests/poster/formats.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/poster/formats.test.ts
import { describe, it, expect } from 'vitest';
import { FORMATS, DEFAULT_FORMAT, getFormat, renderSize, physicalSize } from '../../src/poster/formats';

describe('formats', () => {
  it('has unique ids and positive dimensions', () => {
    const ids = FORMATS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FORMATS) {
      expect(f.wmm).toBeGreaterThan(0);
      expect(f.hmm).toBeGreaterThan(0);
      expect(f.label.length).toBeGreaterThan(0);
    }
  });

  it('defaults to A3', () => {
    expect(DEFAULT_FORMAT).toBe('a3');
    expect(getFormat('a3')!.wmm).toBe(297);
  });

  it('falls back rather than throwing on an unknown id', () => {
    expect(getFormat('nope')).toBeUndefined();
    expect(renderSize({ format: 'nope' })).toEqual(renderSize({}));
  });

  it('fixes the short edge at 600 and follows the aspect ratio', () => {
    for (const f of FORMATS) {
      const s = renderSize({ format: f.id });
      expect(Math.min(s.w, s.h)).toBe(600);
      const wantRatio = f.hmm / f.wmm;
      expect(s.h / s.w).toBeCloseTo(wantRatio, 2);
    }
    expect(renderSize({ format: 'a3' })).toEqual({ w: 600, h: 849 });
    expect(renderSize({ format: 'square' })).toEqual({ w: 600, h: 600 });
  });

  it('converts custom units to mm', () => {
    expect(physicalSize({ format: 'custom', cw: 20, ch: 30, cu: 'cm' })).toEqual({ wmm: 200, hmm: 300 });
    expect(physicalSize({ format: 'custom', cw: 2, ch: 4, cu: 'in' })).toEqual({ wmm: 50.8, hmm: 101.6 });
    expect(physicalSize({ format: 'custom', cw: 100, ch: 200, cu: 'mm' })).toEqual({ wmm: 100, hmm: 200 });
  });

  it('ignores a degenerate custom size and falls back to the default', () => {
    expect(physicalSize({ format: 'custom', cw: 0, ch: 30, cu: 'cm' })).toEqual(physicalSize({}));
    expect(physicalSize({ format: 'custom' })).toEqual(physicalSize({}));
  });
});
```

- [ ] **Step 2: Run it, confirm it fails** — `npx vitest run tests/poster/formats.test.ts` → module not found.

- [ ] **Step 3: Implement `src/poster/formats.ts`**

```ts
export type Unit = 'mm' | 'cm' | 'in';

export interface Format {
  id: string;
  label: string;
  group: 'iso' | 'us' | 'other';
  wmm: number;
  hmm: number;
}

/** Physical poster sizes. Presets keep the orientation given; nothing auto-rotates. */
export const FORMATS: Format[] = [
  { id: 'a5', label: 'A5', group: 'iso', wmm: 148, hmm: 210 },
  { id: 'a4', label: 'A4', group: 'iso', wmm: 210, hmm: 297 },
  { id: 'a3', label: 'A3', group: 'iso', wmm: 297, hmm: 420 },
  { id: 'a2', label: 'A2', group: 'iso', wmm: 420, hmm: 594 },
  { id: 'letter', label: 'Letter', group: 'us', wmm: 216, hmm: 279 },
  { id: 'tabloid', label: 'Tabloid', group: 'us', wmm: 279, hmm: 432 },
  { id: 'in18x24', label: '18×24″', group: 'us', wmm: 457, hmm: 610 },
  { id: 'in24x36', label: '24×36″', group: 'us', wmm: 610, hmm: 914 },
  { id: 'square', label: '1:1', group: 'other', wmm: 500, hmm: 500 },
  { id: 'cm50x70', label: '50×70', group: 'other', wmm: 500, hmm: 700 },
];

export const DEFAULT_FORMAT = 'a3';
/** The short edge is fixed so stroke weights read the same across every format. */
export const SHORT_EDGE = 600;

const TO_MM: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 };

export interface FormatState { format?: string; cw?: number; ch?: number; cu?: Unit }

export function getFormat(id: string | undefined): Format | undefined {
  return FORMATS.find((f) => f.id === id);
}

/** Physical size in mm. Unknown ids and degenerate custom values fall back to the default. */
export function physicalSize(s: FormatState): { wmm: number; hmm: number } {
  if (s.format === 'custom') {
    const k = TO_MM[s.cu ?? 'mm'];
    const wmm = (s.cw ?? 0) * k;
    const hmm = (s.ch ?? 0) * k;
    if (wmm > 0 && hmm > 0) return { wmm: round2(wmm), hmm: round2(hmm) };
  }
  const f = getFormat(s.format) ?? getFormat(DEFAULT_FORMAT)!;
  return { wmm: f.wmm, hmm: f.hmm };
}

/** Render size in SVG user units: short edge fixed, long edge from the physical ratio. */
export function renderSize(s: FormatState): { w: number; h: number } {
  const { wmm, hmm } = physicalSize(s);
  return wmm <= hmm
    ? { w: SHORT_EDGE, h: Math.round((SHORT_EDGE * hmm) / wmm) }
    : { w: Math.round((SHORT_EDGE * wmm) / hmm), h: SHORT_EDGE };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 4: Run the test, confirm it passes.** Then the full suite and `npm run build`.

- [ ] **Step 5: Commit**

```bash
git add src/poster/formats.ts tests/poster/formats.test.ts && git commit -m "feat: poster format definitions and render sizing"
```

---

### Task 3: Format in URL state

**Files:** Modify: `src/core/url-state.ts`, `src/core/reserved.ts`; Test: `tests/core/url-state.test.ts`

- [ ] **Step 1: Add the reserved keys**

In `src/core/reserved.ts` add `'cw'`, `'ch'`, `'cu'` to the set (`'format'` is already there).

- [ ] **Step 2: Extend `AppState`**

Add to the interface: `format?: string; cw?: number; ch?: number; cu?: 'mm' | 'cm' | 'in';`

In `encodeState`, emit each only when set, and omit `format` when it equals `DEFAULT_FORMAT` (import from `../poster/formats`) so default URLs stay short. In `decodeState`, read them back; `cw`/`ch` are numeric (drop non-finite), `cu` accepts only `'mm' | 'cm' | 'in'` and is otherwise dropped.

- [ ] **Step 3: Add tests** to `tests/core/url-state.test.ts`:

```ts
  it('round-trips a custom format', () => {
    const s: AppState = { ...state, format: 'custom', cw: 30, ch: 40, cu: 'cm' };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it('omits the default format and rejects a bad unit', () => {
    const hash = encodeState({ ...state, format: 'a3' });
    expect(hash).not.toContain('format=');
    const bad = decodeState('#/p/girih?v=1&format=custom&cw=10&ch=10&cu=furlongs');
    expect(bad!.cu).toBeUndefined();
    expect(bad!.params['cw']).toBeUndefined(); // reserved, never a pattern param
  });
```

- [ ] **Step 4: Verify** — full suite and build pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: format and custom size in URL state"
```

---

### Task 4: Format controls and a format-driven render size

**Files:** Modify: `src/ui/playground.ts`, `src/ui/controls.ts`, `src/style.css`

- [ ] **Step 1: Replace the hardcoded size**

`src/ui/playground.ts` hardcodes `{ w: 600, h: 840 }` in the stage fill and the worker request. Replace both with `renderSize(state)` (import from `../poster/formats`). The cache key that guards colour-only re-serialization must now include the format — otherwise changing format would re-serialize a node generated at the old size. Add the resolved size to the key.

- [ ] **Step 2: Add a `chipRow` builder to `src/ui/controls.ts`**

```ts
export function chipRow(
  items: { id: string; label: string }[],
  current: string,
  onPick: (id: string) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'chip-row';
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip' + (it.id === current ? ' selected' : '');
    b.textContent = it.label;
    b.addEventListener('click', () => onPick(it.id));
    row.append(b);
  }
  return row;
}
```

- [ ] **Step 3: Add the FORMAT section** to the panel, above COLOUR: a section heading, then three `chipRow`s (ISO, US, Other) built from `FORMATS` grouped by `group`, plus a final row with a single "Custom…" chip. Picking a preset calls `setState({ format: id })`. Picking Custom sets `format: 'custom'` and reveals three inputs — width, height (number inputs) and a unit `<select>` — wired to `setState({ cw, ch, cu })`. Show the resolved physical size as mono text under the row, e.g. `297 × 420 mm`.

- [ ] **Step 4: Styles** — append to `src/style.css`:

```css
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  font-family: var(--font-mono); font-size: 11px; padding: 6px 12px;
  border: 1px solid var(--line); background: transparent; color: var(--ink); cursor: pointer;
}
.chip.selected { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.custom-size { display: flex; gap: 6px; align-items: center; }
.custom-size input { width: 64px; }
.custom-size input, .custom-size select {
  font-family: var(--font-mono); font-size: 11px; padding: 5px 6px;
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
}
```

- [ ] **Step 5: Verify in the browser** — switch through several formats and confirm the poster's aspect changes and the artwork recomposes to fill it; set a custom 30×40 cm and confirm the label reads `300 × 400 mm`; confirm the URL carries `format=` for non-defaults and reloads identically. Report any pattern that composes badly at a very different ratio (square, 24×36) — **report only, do not fix framing here.**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: format controls drive the poster render size"
```

---

### Task 5: `poster/export.ts`

**Files:** Create: `src/poster/export.ts`; Test: `tests/poster/export.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/poster/export.test.ts
import { describe, it, expect } from 'vitest';
import { toSvgString, exportFilename, pixelDimensions } from '../../src/poster/export';
import { el } from '../../src/core/svg';

const pal = { paper: '#101010', ink: '#eeeeee', accent: '#ff0000' };
const node = el('svg', { viewBox: '0 0 600 849' }, [el('circle', { cx: 1, cy: 2, r: 3, fill: 'ink' })]);

describe('toSvgString', () => {
  it('carries the viewBox and physical size in mm', () => {
    const out = toSvgString(node, pal, { wmm: 297, hmm: 420 });
    expect(out.startsWith('<svg')).toBe(true);
    expect(out).toContain('viewBox="0 0 600 849"');
    expect(out).toContain('width="297mm"');
    expect(out).toContain('height="420mm"');
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('#eeeeee');
  });

  it('does not double-add attributes it already has', () => {
    const out = toSvgString(node, pal, { wmm: 297, hmm: 420 });
    expect(out.match(/viewBox=/g)!.length).toBe(1);
    expect(out.match(/width=/g)!.length).toBe(1);
  });
});

describe('pixelDimensions', () => {
  it('computes pixels from physical size and dpi, capped on the long edge', () => {
    expect(pixelDimensions({ wmm: 297, hmm: 420 }, 300)).toEqual({ w: 3508, h: 4961 });
    expect(pixelDimensions({ wmm: 297, hmm: 420 }, 150)).toEqual({ w: 1754, h: 2480 });
    const huge = pixelDimensions({ wmm: 610, hmm: 914 }, 1200);
    expect(Math.max(huge.w, huge.h)).toBeLessThanOrEqual(12000);
    expect(huge.w / huge.h).toBeCloseTo(610 / 914, 2);
  });
});

describe('exportFilename', () => {
  it('builds a descriptive name', () => {
    expect(exportFilename('coulomb', 1, 'a3', 'png')).toBe('flowshape-coulomb-1-a3.png');
    expect(exportFilename('voxel', 95500, 'custom', 'svg')).toBe('flowshape-voxel-95500-custom.svg');
  });
});
```

- [ ] **Step 2: Run it, confirm it fails.**

- [ ] **Step 3: Implement `src/poster/export.ts`**

```ts
import { serialize, type SvgNode, type Palette } from '../core/svg';

const MAX_PX = 12000;

/** A print-ready, self-contained SVG: viewBox for geometry, mm for physical size. */
export function toSvgString(node: SvgNode, pal: Palette, phys: { wmm: number; hmm: number }): string {
  const withSize: SvgNode = {
    ...node,
    attrs: {
      ...node.attrs,
      width: `${phys.wmm}mm`,
      height: `${phys.hmm}mm`,
    },
  };
  return serialize(withSize, pal);
}

/** Pixel size for a given dpi, preserving aspect and capping the long edge. */
export function pixelDimensions(phys: { wmm: number; hmm: number }, dpi: number): { w: number; h: number } {
  const perMm = dpi / 25.4;
  let w = Math.round(phys.wmm * perMm);
  let h = Math.round(phys.hmm * perMm);
  const long = Math.max(w, h);
  if (long > MAX_PX) {
    const k = MAX_PX / long;
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  return { w, h };
}

export function exportFilename(patternId: string, seed: number, format: string, ext: 'svg' | 'png'): string {
  return `flowshape-${patternId}-${seed}-${format}.${ext}`;
}

/** Rasterise an SVG string to PNG. Browser-only: needs Image and canvas. */
export function toPngBlob(svg: string, px: { w: number; h: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = px.w;
        canvas.height = px.h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d context unavailable');
        ctx.drawImage(img, 0, 0, px.w, px.h);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('PNG encoding failed'));
        }, 'image/png');
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('the SVG could not be rasterised'));
    };
    img.src = url;
  });
}

/** Hands the file to the browser. Must be called from a real user gesture. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run the test, confirm it passes.** Full suite and build.

- [ ] **Step 5: Commit**

```bash
git add src/poster/export.ts tests/poster/export.test.ts && git commit -m "feat: SVG serialization and PNG rasterisation for export"
```

---

### Task 6: Export controls

**Files:** Modify: `src/ui/playground.ts`, `src/style.css`

- [ ] **Step 1: Expose the cached node**

Export must use the node already on screen. The playground caches it for colour changes; make that cached node reachable from the export handler (a closure variable is fine). If the cache is empty (nothing rendered yet), disable the export buttons.

- [ ] **Step 2: Add the EXPORT section** at the bottom of the panel: a heading, an "Export SVG" `.btn`, a dpi `<select>` offering 150 and 300 with the resolved pixel dimensions in the option text (e.g. `300 dpi · 3508 × 4961`), and an "Export PNG" `.btn`.

SVG handler: `downloadBlob(new Blob([toSvgString(cached, pal, phys)], {type:'image/svg+xml'}), exportFilename(...))`.

PNG handler: disable the button and set its text to `Rendering…`, `await toPngBlob(...)`, download, then restore the button in a `finally`. On rejection show the error message in a small mono line under the buttons rather than an alert.

- [ ] **Step 3: Verify in the browser — thoroughly**

- Export SVG from at least three patterns including `diffgrowth` and `voxel`; open each exported file directly in the browser and confirm it renders standalone with the correct artwork and paper background.
- Confirm the exported SVG's root has `width`/`height` in mm and that they change with the format.
- Export PNG at both dpi options; confirm the file's real pixel dimensions match what the option promised.
- **Instrument `Worker.prototype.postMessage` and confirm exporting `diffgrowth` issues zero worker messages** — export must never re-simulate.
- Confirm the error path: temporarily make `toPngBlob` reject and confirm the button is restored and the message appears.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: export controls for SVG and PNG"
```

---

### Task 7: The modal shell

**Files:** Create: `src/ui/modal.ts`; Modify: `src/ui/playground.ts`, `src/style.css`

- [ ] **Step 1: Write `src/ui/modal.ts`**

Export `openModal(opts: { title: string; tabs: { id: string; label: string; render: () => Promise<HTMLElement> | HTMLElement }[] }): void`.

Requirements — these are the ones that make a modal usable rather than merely present:
- A backdrop element and a panel. Clicking the backdrop closes; clicking inside does not (stop propagation).
- `Escape` closes. The listener is added on open and **removed on close** — no leak.
- Focus moves into the panel on open; focus is **restored to the element that opened it** on close.
- Focus is trapped: `Tab` from the last focusable element wraps to the first and `Shift+Tab` from the first wraps to the last.
- The tab strip renders one button per tab; the active tab's content is produced by its `render()`, which may be async (content is lazy-loaded). Show a mono "Loading…" line while a promise is pending.
- Only one modal can be open at a time; opening a second closes the first.

- [ ] **Step 2: Styles** — append to `src/style.css`:

```css
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.72);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal {
  background: var(--paper); border: 1px solid var(--line);
  width: min(760px, 92vw); max-height: 86vh; display: flex; flex-direction: column;
}
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--line); }
.modal-title { font-size: 15px; font-weight: 700; }
.modal-tabs { display: flex; gap: 6px; padding: 12px 20px 0; }
.modal-body { padding: 20px; overflow: auto; }
.modal-body pre {
  font-family: var(--font-mono); font-size: 12px; line-height: 1.55;
  border: 1px solid var(--line); padding: 14px; overflow-x: auto; margin: 0;
}
.modal-body p { font-size: 14px; line-height: 1.65; }
.modal-body a { color: var(--accent); }
```

- [ ] **Step 3: Wire a button** in the playground panel labelled "Explain the math" that opens the modal with two tabs, Math and Code, both initially rendering a placeholder. The next two tasks fill them.

- [ ] **Step 4: Verify** the interaction contract in the browser: open, `Tab` cycles within the panel and wraps, `Escape` closes, focus returns to the button, backdrop click closes, inside click does not. Report each.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: modal shell with tabs, focus trap and escape"
```

---

### Task 8: Explain content pipeline and the completeness guard

**Files:** Create: `src/content/explain.ts`, `src/content/explain/phyllotaxis.en.md`, `src/content/explain/phyllotaxis.es.md`; Test: `tests/content/explain.test.ts`

- [ ] **Step 1: Define the content format**

Each file is markdown with a small front matter block:

```md
---
source: Vogel, H. (1979) "A better way to construct the sunflower head"
url: https://en.wikipedia.org/wiki/Phyllotaxis
---

## Formula

    θ = n · 137.50776°
    r = c · √n

## What it means

…two or three short paragraphs…

## Parameters

- **points** — …
- **angle** — …
```

- [ ] **Step 2: Write the loader `src/content/explain.ts`**

```ts
export interface ExplainDoc { source: string; url: string; body: string }

const files = import.meta.glob('./explain/*.md', { query: '?raw', import: 'default' });

/** Lazily loads a pattern's explanation. Falls back to English when a translation is missing. */
export async function loadExplain(id: string, lang: 'en' | 'es'): Promise<ExplainDoc | null> {
  const key = `./explain/${id}.${lang}.md`;
  const loader = files[key] ?? files[`./explain/${id}.en.md`];
  if (!loader) return null;
  return parseFrontMatter((await loader()) as string);
}

export function parseFrontMatter(raw: string): ExplainDoc { /* … */ }
export function listExplainIds(): string[] { /* ids present, from the glob keys */ }
```

`parseFrontMatter` must be exported and pure so it is unit-testable: split on the leading `---` block, read `source:` and `url:`, return the remainder as `body`. Throw a descriptive error if the front matter is missing either key — a silent empty citation is worse than a loud failure.

- [ ] **Step 3: Write the completeness test** — this is the guard that keeps content honest as patterns are added:

```ts
// tests/content/explain.test.ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { parseFrontMatter } from '../../src/content/explain';

const DIR = path.join(process.cwd(), 'src', 'content', 'explain');
const present = new Set(readdirSync(DIR));

describe('explain content', () => {
  it('every pattern has an English and a Spanish explanation', () => {
    const missing: string[] = [];
    for (const def of listPatterns()) {
      for (const lang of ['en', 'es']) {
        if (!present.has(`${def.id}.${lang}.md`)) missing.push(`${def.id}.${lang}.md`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every file has a cited source and the required sections', () => {
    for (const file of [...present].filter((f) => f.endsWith('.md'))) {
      const doc = parseFrontMatter(readFileSync(path.join(DIR, file), 'utf-8'));
      expect(doc.source.length, `${file} source`).toBeGreaterThan(3);
      expect(doc.url, `${file} url`).toMatch(/^https?:\/\//);
      expect(doc.body, `${file} formula`).toContain('## Formula');
      expect(doc.body, `${file} meaning`).toMatch(/## (What it means|Qué significa)/);
      expect(doc.body.length, `${file} body`).toBeGreaterThan(200);
    }
  });
});
```

- [ ] **Step 4: Write the first pattern's content** (`phyllotaxis`, EN and ES) as the worked example, drawing the formula and citation from `docs/research/2026-08-28-fields-emergent.md` §2. The test will fail for the other 20 — that is expected and is Task 9's job. To keep the suite green in the meantime, temporarily mark the completeness test `it.skip` with a `TODO(Task 9)` comment, and **un-skip it in Task 9**.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: explain content loader, format and completeness guard"
```

---

### Task 9: Explain content for all 21 patterns, EN and ES

**Files:** Create: `src/content/explain/<id>.{en,es}.md` × 21; Modify: `tests/content/explain.test.ts` (un-skip)

- [ ] **Step 1: Write the content**

For each of the 21 patterns write both languages. **Every formula must come from the verified research already in the repo** — `docs/research/2026-08-28-analytic-curves.md`, `2026-08-28-tilings-discrete.md`, `2026-08-28-fields-emergent.md`, and `2026-08-29-bookofshapes-competitive.md` (which carries the sources for coulomb, bands, moire, fabric, roselattice, chirp, helix, voxel, apollonian). Do not invent an equation or a citation. If a pattern's maths is not in those documents, say so and stop rather than guessing.

Keep each explanation short: the formula, two or three paragraphs, and a bullet per exposed parameter. Write the Spanish as *Spanish*, not a literal gloss of the English — Hermes reads both and a mechanical translation will read as such.

- [ ] **Step 2: Un-skip the completeness test** and confirm it passes for all 42 files.

- [ ] **Step 3: Wire the Math tab** to `loadExplain(state.patternId, state.lang ?? 'en')`, rendering the markdown. A tiny renderer is enough — headings, paragraphs, indented code blocks, bold, and links; no markdown library. Show the citation as a link at the bottom.

- [ ] **Step 4: Verify** — open the modal on six different patterns and read them. Confirm the formula matches what the module actually computes (spot-check three against their source), the citation link resolves, and the Spanish renders correctly.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: bilingual explanations for all 21 patterns"
```

---

### Task 10: View the code

**Files:** Modify: `src/ui/modal.ts` wiring in `src/ui/playground.ts`; Create: `src/content/source.ts`; Test: `tests/content/source.test.ts`

- [ ] **Step 1: Write `src/content/source.ts`**

```ts
const sources = import.meta.glob('../patterns/*.ts', { query: '?raw', import: 'default' });

/** The pattern's real generator source, loaded lazily so it costs nothing until opened. */
export async function loadSource(id: string): Promise<string | null> {
  const loader = sources[`../patterns/${id}.ts`];
  return loader ? ((await loader()) as string) : null;
}

export function sourceIds(): string[] {
  return Object.keys(sources)
    .map((k) => k.replace('../patterns/', '').replace('.ts', ''))
    .filter((id) => id !== 'registry' && id !== 'index' && id !== 'randomize' && id !== 'presets');
}
```

- [ ] **Step 2: Test that every pattern resolves**

```ts
// tests/content/source.test.ts — every registered pattern must have a source file
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { sourceIds } from '../../src/content/source';

describe('pattern source', () => {
  it('every registered pattern has a resolvable source file', () => {
    const ids = new Set(sourceIds());
    const missing = listPatterns().map((d) => d.id).filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 3: Wire the Code tab** — `await loadSource(id)` into a `<pre>`, preceded by a short mono preamble naming the two helper imports a reader needs (`el`/`serialize` from `core/svg`, `mulberry32`/`deriveSeed` from `core/prng`) and linking to `https://github.com/Jossifresben/flowshape`. Add a **Copy** button using `navigator.clipboard.writeText`, with a `try/catch` that falls back to selecting the text if the clipboard API is unavailable or denied; show "Copied" for two seconds on success.

- [ ] **Step 4: Verify** — open the Code tab on four patterns, confirm the source shown is the real file (compare a distinctive line), confirm Copy works and puts the source on the clipboard, and confirm the initial JS bundle did **not** grow (compare `npm run build` output before and after this task — the raw imports must be lazy chunks, not inlined).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: view the source of every pattern"
```

---

## Self-Review (done at write time)

- **Spec coverage:** §0 recalibrate → Task 1 ✓. §1 formats (set, sizing rule, state, physical identity) → Tasks 2–4 ✓. §2 export (SVG mm, PNG dpi, cached node, filenames, cap) → Tasks 5–6 ✓. §3 explain (four parts, lazy per-language content, accuracy bar, completeness test) → Tasks 8–9 ✓ — except the optional diagram, deliberately dropped for now since the spec marks it optional and "omit rather than decorate". §4 view the code (real source, lazy, copy, preamble, no highlighter) → Task 10 ✓. §5 modal → Task 7 ✓. §6 testing ✓ across tasks.
- **Placeholder scan:** two intentional `/* … */` markers — `parseFrontMatter`'s body (Task 8 Step 2, whose behaviour is fully specified in prose immediately below it) and the FORMATS-derived UI grouping (Task 4 Step 3, likewise specified). Every other step carries complete code.
- **Type consistency:** `FormatState` (Task 2) is the shape `AppState` gains in Task 3 and what `renderSize`/`physicalSize` accept in Task 4; `toSvgString` takes the `Palette` and `SvgNode` types already exported by `core/svg`; `ExplainDoc` is produced by `parseFrontMatter` and consumed by the Math tab.
- **Ordering dependency:** Task 4 depends on 2 and 3; Task 6 on 5; Tasks 9 and 10 on 7. Execute in order.

