# flowshape.art — Design Spec

Date: 2026-08-28 · Status: draft for review · Author: brainstormed with Hermes

## 1. What it is

A free, open-source web app where anyone plays with mathematical patterns, tunes their parameters, and turns the result into a minimal poster they can export and finish in any editor (Canva, Figma, …). Inspired by bookofshapes.com but with a different pattern set, richer parameter UI, math education built in, and bilingual EN/ES from day one.

Not in scope (deliberate): an in-house poster editor with element-level manipulation. We compose example posters from presets; real editing happens in external tools. No accounts, no backend at launch.

## 2. Product decisions (settled)

| Decision | Choice |
|---|---|
| Name / domain | **flowshape.art** |
| Monetization | Free at launch; paid high-res/print export possible later — nothing in the architecture may block it |
| State model | **Stateless.** Full poster state (pattern id + params + seed + palette + layout + format) encoded in the URL. Share = copy link. No backend |
| Flow | Gallery → **Pattern playground** (tune params) → **Create poster** → poster preview (layout presets, title/caption, format) → export |
| Editing | Layout presets + text fields only. Element editing delegated to external editors via SVG export |
| Export | **SVG + PNG** at launch (PNG at chosen pixel size, client-side). PDF later |
| Formats | ISO A5/A4/A3/A2 · US Letter/Tabloid/18×24″/24×36″ · 1:1 · 50×70 cm · custom W×H (mm/cm/in/px) |
| Aesthetic | Range per pattern, **flat colors only — no gradients anywhere**. Default rendering is monochrome: **black lines/dots on light, white on dark**; color palettes are opt-in |
| Themes | Light + dark site themes. Poster sheet is always white paper regardless of theme |
| UI style | Minimal Swiss: white/near-black, one red accent (#E3261A), Helvetica-family UI type, IBM Plex Mono for parameters (per approved mockups) |
| Languages | EN/ES full parity, language toggle in header |
| Education | Every shape has an **"Explain the math"** button → modal with the formula, a plain-language explanation, and a small diagram. EN/ES |
| Stack | Vanilla TypeScript + Vite, SVG rendering, Web Workers for heavy computation. No framework |
| Determinism | All randomness from a seeded PRNG (mulberry32). Same URL ⇒ identical SVG, byte-for-byte |

## 3. The shape catalog (19, user-curated)

Struck by user from the 24-candidate catalog: Chladni Sand, Gumowski-Mira, L-System Plant, DLA Branches, Reaction-Diffusion.

| # | Shape | Family | Phase |
|---|---|---|---|
| 1 | Stipple Field (variable-density blue noise; image input in phase 2) | Points & Meshes | Launch |
| 2 | Delaunay Mesh (Bowyer-Watson; edges or flat triangles) | Points & Meshes | Launch |
| 3 | Voronoi Cells (half-plane clipping, inset cells) | Points & Meshes | Launch |
| 4 | Circle Packing (greedy, size classes) | Points & Meshes | Phase 2 |
| 5 | Phyllotaxis (Vogel; divergence-angle slider) | Points & Meshes | Launch |
| 6 | Harmonograph (damped Lissajous; detune) | Curves | Launch |
| 7 | Maurer Rose (n, d walk) | Curves | Launch |
| 8 | Times-Table Chords (modular multiplication; continuous M) | Curves | Launch |
| 9 | Superformula (nested Gielis stacks) | Curves | Phase 2 |
| 10 | Guilloché Rings (nested modulated rings) | Curves | Phase 2 |
| 11 | Flow Field (evenly-spaced streamlines; domain warp) | Fields | Launch |
| 12 | Wave Ridgeline (interference as stacked displaced scanlines) | Fields | Phase 2 |
| 13 | Curl Eddies (divergence-free noise streamlines) | Fields | Phase 2 |
| 14 | Clifford / de Jong Attractor (curated known-good parameter sets) | Attractors | Launch |
| 15 | Truchet Arcs (Smith tiles; multi-scale Carlson as showpiece mode) | Tilings | Launch |
| 16 | Hitomezashi (row/column bits; two-color fill; word-as-bits easter egg) | Tilings | Launch |
| 17 | Girih Stars (Hankin's method; contact-angle slider) | Tilings | Launch |
| 18 | Penrose P3 (golden-ratio triangle deflation) | Tilings | Phase 2 |
| 19 | Differential Growth (buckling closed curve; growth-ring snapshots) | Growth | Launch |

Launch = 13 shapes; Phase 2 = 6. All formulas and parameter ranges are documented in `docs/research/2026-08-28-*.md` (three verified catalogs; the five struck shapes remain documented there for possible revival).

## 4. Architecture

### 4.1 Module layout (monolith guard: one file per concern, no file over ~400 lines)

```
src/
  core/
    prng.ts            // mulberry32 + per-subsystem seed derivation (seed ^ hash(paramName))
    url-state.ts       // encode/decode poster state <-> URL query (versioned schema)
    svg.ts             // tiny SVG builder helpers (path, circle, line, group, viewBox fit)
    noise.ts           // seeded value/simplex noise shared by field patterns
    geometry.ts        // shared: Bowyer-Watson Delaunay, polygon clip, marching helpers
  patterns/
    registry.ts        // PatternDef registry; lazy imports
    stipple.ts, delaunay.ts, voronoi.ts, phyllotaxis.ts, harmonograph.ts,
    maurer.ts, timestable.ts, flowfield.ts, clifford.ts, truchet.ts,
    hitomezashi.ts, girih.ts, diffgrowth.ts   // 13 launch modules
  poster/
    composer.ts        // layout presets: full-bleed | framed | titled
    formats.ts         // format presets + custom, unit conversion, px mapping
    export.ts          // SVG serialize; PNG via offscreen canvas raster of the SVG
  ui/
    app.ts, gallery.ts, playground.ts, poster-view.ts, controls.ts,
    explain-modal.ts, theme.ts, i18n.ts
  workers/
    compute.worker.ts  // runs pattern.generate off-thread for heavy patterns (diffgrowth, flowfield at high density)
  content/
    explain/<pattern>.<en|es>.md   // formula + explanation, loaded lazily
  locales/en.json, es.json
```

### 4.2 The pattern contract

```ts
interface PatternDef {
  id: string;                      // stable, appears in URLs — never rename
  family: 'points' | 'curves' | 'fields' | 'attractors' | 'tilings' | 'growth';
  phase: 1 | 2;
  params: ParamDef[];              // slider/int/enum/toggle defs: key, range, step, default, i18n label key
  heavy: boolean;                  // true => generate in worker
  generate(params: Record<string, number|string|boolean>, seed: number, size: {w: h}): SvgNode;
}
```

- `generate` is **pure and deterministic**: same inputs ⇒ identical output tree. No `Math.random`, no `Date`.
- Output is an SVG node tree sized to a normalized viewBox; the poster composer scales/crops it into the chosen format.
- Colors: `generate` emits **role tokens** (`ink`, `paper`, `accent`), resolved at render time from theme/palette — this is what makes black-on-light / white-on-dark defaults automatic.
- Element budget per pattern documented in the module (research guardrails: ≤ 50k dots, ≤ 5k primitives, RDP-simplified polylines).

### 4.3 URL state schema

`/#/p/<patternId>?v=1&seed=71203&points=1500&angle=137.51&...&pal=navy-gold&bg=131a2b&ink=e8dcc0&acc=d9a441&layout=titled&format=a3&title=...&caption=...&theme=dark&lang=es`

- `v` is the schema version; decoding unknown/missing params falls back to defaults (old links keep working).
- Params round to sensible precision to keep URLs short. Title/caption URL-encoded.
- Every control change replaces the URL (history.replaceState); "Share link" copies it.
- **Short links (Part 3):** "Share link" also offers a branded short URL `flowshape.art/s/<code>` backed by a Netlify Function + Netlify Blobs KV (code → full URL, 301 redirect). Self-hosted deliberately: a third-party shortener would tie link permanence to someone else's free tier (CleanURI is the documented no-key fallback if Functions are ever dropped). This is the one narrow exception to "no backend": a single stateless function with a KV write, no accounts, no PII beyond the URL itself.

### 4.4 Workers

Heavy patterns (differential growth; flow field at high line counts) run `generate` in a Web Worker; the UI shows the last result plus a subtle computing state; results stream back as a serialized node list. Light patterns run on the main thread (< 16 ms budget).

### 4.5 Poster composer

- Layout presets: **full-bleed** (pattern edge to edge), **framed** (margins, no text), **titled** (margins + title + mono caption + small flowshape.art credit).
- Caption auto-fills from pattern name + key params + seed; both fields editable, both optional.
- Formats map to mm (or in) dimensions; SVG viewBox is mm-true; PNG export renders at user-chosen DPI-equivalent pixel sizes (preset: 150 / 300 dpi).
- Poster sheet is always white with dark ink by default (print reality); palette choice can override deliberately.

### 4.6 Color system

Every pattern is colored through exactly three role tokens (§4.2), each user-adjustable in the playground:

- **Background color** — the pattern/poster ground
- **Line color** — the ink every stroke, dot, and fill derives from
- **Accent color** — the sparse highlight some patterns emit (accent-every-N dots, marked tiles); patterns that emit no accent simply ignore it

Controls: a **predefined palette row first** (one-click swatch triples), then per-role custom pickers for the three tokens. Predefined palettes are curated named triples shipped in `poster/palettes.ts` — the first two are always the monochrome defaults, `Mono Light` (white / near-black / red) and `Mono Dark` (near-black / white / red), followed by a small curated set (~8: e.g. Navy & Gold, Teal & Sand, Terracotta, Sashiko Indigo…). Flat colors only — the palette type cannot express gradients.

URL encoding: `pal=<paletteId>` for a predefined choice, or explicit `bg=`, `ink=`, `acc=` hex overrides (an override wins over `pal`). Site theme (light/dark) selects which monochrome palette is the *default*; an explicit user choice is kept regardless of theme.

### 4.7 i18n and themes

- All UI strings via `locales/*.json`; explain content as per-language markdown. Language auto-detected, toggleable, persisted in URL (`lang`).
- Theme: CSS custom properties, `data-theme` attribute, `prefers-color-scheme` default, toggle persisted in URL (`theme`).

## 5. UI (per approved mockups — design canvas "flowshape.art UI")

1. **Gallery** (`/`): headline, family filter chips, pattern cards with live-generated thumbnails (small fixed-seed renders, generated at build time as static SVG for instant load).
2. **Playground** (`/#/p/<id>`): full-bleed pattern; right panel: seed (randomize/lock), parameter sliders (mono labels + values), palette strips (monochrome default first), Explain-the-math button; red **Create poster →**.
3. **Poster preview**: composed sheet on worktable; right panel: format chips (ISO/US/other/custom), layout chips, title/caption, export SVG/PNG; footer note pointing to external editors.
4. **Explain modal**: formula, 2–3 short paragraphs, small diagram, EN/ES.

## 6. Error handling

- Pattern generation guarded: parameter combinations that blow up (degenerate superformula exponents, empty Poisson output) clamp to documented safe ranges in the ParamDef — the UI cannot express invalid states.
- URL decode failures (corrupt/hostile input) fall back to pattern defaults, never crash; unknown pattern id routes to gallery.
- Worker timeout (> 10 s) cancels and restores previous render with a notice.
- PNG export failures (canvas memory on huge sizes) cap pixel dimensions (~12k px side) with a clear message.

## 7. Testing

- **Determinism suite** (vitest): for each pattern, `generate(defaults, seed=1)` snapshot ⇒ byte-identical SVG string; a params-matrix smoke test asserts no NaN coordinates and element budgets respected.
- URL round-trip: encode(decode(url)) === url for a corpus including legacy-version URLs.
- Format math: mm↔px conversions, custom units.
- Composer: each layout × representative formats produces viewBox-valid SVG.
- No visual-regression tooling at launch (deterministic SVG snapshots cover it).

## 8. Hosting & repo

- Static site deployed on **Netlify** (build: `vite build`, publish `dist/`, custom domain flowshape.art). No server, no env vars.
- Repo: `Jossifresben/flowshape`, **private during development**, flipped public with an MIT license at launch. CITATION.cff optional later if it grows scholarly use.

## 9. Phase 2 (explicitly out of launch scope)

Six phase-2 shapes; image input as density source for Stipple/Delaunay/Voronoi (client-side only); PDF export; community gallery (Supabase) and paid print/high-res exports; "Open in Canva" via Canva import API; multi-scale Truchet region masks; **"View the code"**: a copyable code panel per shape (the site's own TypeScript generator source, plus Python/p5.js ports where written) so people can reuse the algorithms in their own projects — pairs naturally with the explain modal. The pattern-module purity contract (§4.2) is what makes source display trivially extractable; keep modules self-contained partly for this reason.
