# flowshape

**[flowshape.art](https://flowshape.art)** — play with mathematical patterns, tune their parameters, export a print-ready poster.

Free, open source, no accounts, no backend. Everything runs in the browser.

*[Léeme en español](README.es.md)*

---

## What it is

Pick one of **25 deterministic pattern generators**, move the sliders until it looks right, choose a paper format, and export **SVG or PNG**. The SVG opens cleanly in Figma, Illustrator, Inkscape or Canva, so the finishing work happens in whatever tool you already use — flowshape deliberately does *not* try to be a poster editor.

Two things make it more than a toy:

- **The URL is the state.** Pattern id, every parameter, seed, colour and format are encoded in the address bar. Copy the link and anyone gets the identical artwork, byte for byte. There is nothing to save and nothing to log in to.
- **The maths is on the page.** Every pattern has an *Explain the math* panel — the actual formula, a plain-language reading of it, a note on what each parameter does, and a citation — plus a *Code* tab showing the real generator source that drew what you are looking at.

## The catalogue

| Pattern | Family | Pattern | Family |
|---|---|---|---|
| Stipple Field | Points & Meshes | Moiré Weave | Fields |
| Delaunay Mesh | Points & Meshes | Warped Fabric | Fields |
| Voronoi Cells | Points & Meshes | Converging Chirp | Fields |
| Phyllotaxis | Points & Meshes | Truchet Arcs | Tilings |
| Apollonian Circles | Points & Meshes | Hitomezashi | Tilings |
| Harmonograph | Curves | Girih Stars | Tilings |
| Maurer Rose | Curves | Ribbon Interlace | Tilings |
| Times-Table Chords | Curves | Voxel Form | Isometric |
| Concentric Bands | Curves | Iso Weave | Isometric |
| Rose Lattice | Curves | Nested Shafts | Isometric |
| Helix Ladder | Curves | Tumbling Blocks | Isometric |
| Flow Field | Fields | Differential Growth | Growth |
| Coulomb Field | Fields | | |

Full table with parameters and sources: **[docs/patterns.md](docs/patterns.md)**.

## Design rules

These are constraints, not accidents:

- **Determinism.** No `Math.random`, no `Date`. All randomness derives from a seeded `mulberry32` PRNG. Same URL ⇒ same SVG, always. The pattern test suite snapshots output to enforce it.
- **Pure SVG.** No canvas in the poster path, no raster steps, no gradients, no filters, no blur. Quality comes from line craft, not from rendering tricks.
- **Monochrome by default.** Ink on paper. Colour is opt-in, flat, and generated in OKLCH so lightness stays perceptually even across hues.
- **Colour roles, not hex codes.** Generators emit `ink` / `paper` / `accent` tokens; the palette is resolved at render time. That is what lets any palette — ink on near-black, ink on paper white — apply to every pattern without touching a single generator.
- **No file over ~400 lines.** One file per concern.

## Getting started

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (`localhost:5173`) |
| `npm test` | Full Vitest suite, including deterministic pattern snapshots |
| `npm run thumbs` | Regenerate `public/thumbs/*.svg` gallery thumbnails |
| `npm run build` | Type-check, rebuild thumbnails, bundle to `dist/` |
| `npm run preview` | Serve the production build locally |

No environment variables, no services, no API keys. `npm run build` output is a static folder — deployed here on Netlify.

## Layout

```
src/
  core/       prng · url-state · svg builder · noise · geometry · oklch · persist
  patterns/   registry + one module per pattern (25) + presets, randomize
  poster/     formats · palettes · export (SVG / PNG)
  ui/         gallery · playground · controls · modal · markdown
  content/    explain/<pattern>.<en|es>.md — formula, explanation, citation
  workers/    off-thread generation for heavy patterns
scripts/      build-thumbs.ts (prebuild step)
tests/        Vitest — core, patterns (snapshotted), poster, ui, audio
docs/         architecture, patterns, URL schema, research, specs and plans
```

## Documentation

- **[docs/architecture.md](docs/architecture.md)** — how the pieces fit, the pattern contract, the colour-role system
- **[docs/patterns.md](docs/patterns.md)** — the catalogue, and how to add a pattern
- **[docs/url-state.md](docs/url-state.md)** — the URL schema and its compatibility rules
- **[docs/research/](docs/research/)** — the verified maths catalogues the patterns were built from
- **[docs/superpowers/](docs/superpowers/)** — design specs and implementation plans, part by part
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — conventions, tests, and what a new pattern must satisfy

## Inspiration and credits

flowshape was **inspired by [bookofshapes.com](https://bookofshapes.com)**, which served as the reference and quality guide throughout: it set the craft standard this project aims at — hairline strokes, strict monochrome discipline, committed compositional registers, and real occlusion instead of alpha blending. The analysis that shaped flowshape's own direction is preserved in [docs/research/2026-08-29-bookofshapes-competitive.md](docs/research/2026-08-29-bookofshapes-competitive.md).

flowshape is an independent implementation. It shares no code with that site; the pattern set, the parameter UI, the bilingual maths explanations, the URL-as-state model and the poster export pipeline are its own.

Individual patterns cite their own mathematical sources — Vogel, Descartes, Jobard & Lefer, Quilez, Hankin, Müller-Brockmann and others — inside `src/content/explain/`.

## Author

**Jose "Jossi" Fresco Benaim** — [ORCID 0009-0000-2026-0836](https://orcid.org/0009-0000-2026-0836) · [jossifresco.com](https://jossifresco.com)

If you use flowshape in published work, see [CITATION.cff](CITATION.cff).

## Licence

[MIT](LICENSE) © 2026 Jose "Jossi" Fresco Benaim.

Posters you generate are yours — the licence covers this software, not your output.
