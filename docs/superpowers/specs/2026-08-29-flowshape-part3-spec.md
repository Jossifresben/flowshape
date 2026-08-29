# flowshape.art Part 3 — Export, Formats, Explain the Math, View the Code

Date: 2026-08-29 · Status: draft for review · Supplements `2026-08-28-flowshape-design.md`

Scope: the four features Hermes named, plus one prerequisite cleanup. Deliberately **excluded** from this spec (still in the parent spec's Part 3 backlog): the poster composer with title/caption/layout presets, the preset carousel on gallery cards, and the branded short-link service.

---

## 0. Prerequisite — recalibrate `heavy`

Measured `generateSafe` at defaults: `diffgrowth` 678 ms, `stipple` 19.7 ms, `flowfield` 14.3 ms, `coulomb` 13.7 ms, `voxel` 9.4 ms, the rest faster. Only `diffgrowth` and `voxel` are flagged `heavy`, so `voxel` pays worker round-trip latency for a 9 ms render while three slower patterns block the main thread.

**Decision:** measure every pattern at defaults **and at its most expensive parameter extreme**, then flag `heavy` only above ~50 ms at the extreme. Export (§2) must not be gated on a worker round-trip for patterns that do not need one.

---

## 1. Poster formats

### Why it is not just an aspect ratio

The render size is currently hardcoded at 600×840 user units in two places. A format changes the frame the pattern composes into, so patterns **regenerate** on a format change — that is correct behaviour, not a bug: a pattern should fill its frame, not be letterboxed.

### The format set

| Group | Formats (mm) |
|---|---|
| ISO | A5 148×210 · A4 210×297 · A3 297×420 · A2 420×594 |
| US | Letter 216×279 · Tabloid 279×432 · 18×24″ 457×610 · 24×36″ 610×914 |
| Other | Square 500×500 · 50×70 cm 500×700 |
| Custom | user width × height with unit mm / cm / in |

Default is **A3**.

### Sizing rule

The **short edge is fixed at 600 user units**; the long edge follows the physical aspect ratio, rounded to an integer. A3 → 600×849, Square → 600×600, 24×36″ → 600×900.

Rationale: stroke widths and densities are expressed in user units, so fixing the short edge keeps a hairline looking like a hairline across every format. If we instead scaled the whole canvas, a 0.4-unit stroke would read completely differently on A5 versus A2.

Presets are used at their given orientation; nothing auto-rotates.

### State

Added to `AppState` and to `RESERVED`: `format` (a format id; omitted means `a3`), plus `cw`, `ch`, `cu` present only when `format === 'custom'`.

### Physical identity

The **exported** SVG root carries `width="{wmm}mm" height="{hmm}mm"` alongside its `viewBox`, so print software opens it at the right physical size. The on-screen render does not — it should scale to the pane.

---

## 2. Export

### SVG

Serialize the currently displayed node, then ensure the root carries `xmlns`, the `viewBox`, and the physical `width`/`height` in mm. The file is already self-contained because patterns emit their own paper rect (fixed earlier for exactly this reason).

### PNG

Rasterise the SVG string client-side: `Blob` → object URL → `Image` → `canvas.drawImage` → `canvas.toBlob`. Two resolution options derived from the format's physical size, **150 dpi and 300 dpi**, with the resulting pixel dimensions shown next to each so the choice is concrete (300 dpi on A3 ≈ 3508 px wide). Long edge capped at 12000 px with a clear message rather than a failed allocation.

### Rules

- Export uses the **cached** node the playground already keeps — it must never re-run a simulation. This is checkable: exporting `diffgrowth` must issue zero worker messages.
- Filenames: `flowshape-{patternId}-{seed}-{format}.{svg|png}`.
- Download is an object URL plus a synthetic `<a download>` click, so it must be triggered by a real user gesture.

---

## 3. Explain the math

Every pattern gets an **Explain** button opening a modal with four parts:

1. **The formula**, set in mono type — the actual equations, not a paraphrase.
2. **What it means**, two or three short paragraphs in plain language: what the equation does geometrically, and what each exposed parameter changes.
3. **Provenance** — who discovered or named it and roughly when, plus a link to a real source (Wikipedia, MathWorld, Paul Bourke, the Bridges archive). Every one of the 21 already has a verified source in `docs/research/`.
4. **A small diagram** where it genuinely helps (a labelled radius, an angle, one construction step). Optional — omit rather than decorate.

### Content model

One markdown file per pattern per language: `src/content/explain/<id>.<lang>.md`, loaded **lazily** on open via `import.meta.glob` so none of it reaches the initial bundle. Front matter carries the source name and URL.

**Bilingual EN/ES**, per the project's standing default. This is the site's largest body of prose and the place where the Spanish-speaking audience is most affected, so it ships bilingual from the start — even though the surrounding UI chrome is still English-only (that gap is acknowledged, and tracked as its own task rather than being silently ignored).

Accuracy bar: **no formula appears in a modal unless it is traceable to a cited source.** Content is drafted against `docs/research/2026-08-28-*.md` and `2026-08-29-bookofshapes-competitive.md`, which already carry verified equations for every pattern.

---

## 4. View the code

A **Code** tab in the same modal shows the pattern's actual generator source — the real `src/patterns/<id>.ts`, not a rewritten illustration, so it can never drift from what the site runs.

- Loaded lazily with Vite's `?raw` / `import.meta.glob('...', { as: 'raw' })`, so it costs nothing until opened.
- A **Copy** button puts the source on the clipboard.
- A short preamble states the two dependencies a reader needs (`el`/`serialize` from `core/svg`, `mulberry32`/`deriveSeed` from `core/prng`) and links to the repo, so the snippet is actionable rather than decorative.
- No syntax highlighting library — mono type, `--line` border, horizontal scroll. Adding a highlighter for this would be the largest dependency in the project.

This is what makes the "open source" claim on the homepage concrete: every pattern is inspectable in one click.

---

## 5. Modal shape

One modal component, two tabs: **Math** and **Code**. Opened from a button in the playground panel, `Esc` and a click on the backdrop close it, focus is trapped while open and restored on close. Scrollable body, `--paper` background, `--line` border, no rounded corners — consistent with the rest of the Swiss chrome.

## 6. Testing

- Formats: unique ids, positive dimensions, `renderSize` short edge is 600 for every preset with the aspect correct to within a unit, unit conversions, unknown id falls back rather than throwing.
- Export: `toSvgString` starts with `<svg`, contains the `viewBox` and `width="297mm" height="420mm"` for A3; filename construction. Canvas rasterisation is not unit-tested.
- Content completeness — the guard that matters as patterns are added: **every registered pattern has both an `.en.md` and an `.es.md` explain file**, each with the required front matter and non-empty sections, and **every pattern's source file resolves** through the raw-import map. A new pattern cannot ship with a missing or English-only explanation.

## 7. Out of scope here

Poster composer (title/caption/layout presets), preset carousel, short-link service, PDF export, and UI-chrome i18n. Each remains in the parent spec's backlog.
