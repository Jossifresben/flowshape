# flowshape

[![live at flowshape.art](https://img.shields.io/badge/live-flowshape.art-E3261A)](https://flowshape.art)
[![source on GitHub](https://img.shields.io/badge/source-GitHub-181717?logo=github&logoColor=white)](https://github.com/Jossifresben/flowshape)
[![License: MIT](https://img.shields.io/badge/License-MIT-111111.svg)](LICENSE)
[![ORCID 0009-0000-2026-0836](https://img.shields.io/badge/ORCID-0009--0000--2026--0836-A6CE39?logo=orcid&logoColor=white)](https://orcid.org/0009-0000-2026-0836)

**[flowshape.art](https://flowshape.art)** — turn mathematics into art.

Explore 25 pattern generators, read the maths that draws each one, and take the result out as a print-ready poster or as a visual that moves with your music.

Free, open source, no accounts, no backend. Everything runs in the browser.

*[Léeme en español](README.es.md)*

---

## What it is

flowshape turns mathematics into art. Pick one of **25 deterministic pattern generators** — a Voronoi mesh, a Truchet tiling, a flow field, an isometric voxel form — move every parameter it has, and watch the shape respond.

Then take it somewhere:

- **Print.** Export the bare pattern as **SVG or PNG** at any paper size. The SVG opens cleanly in Figma, Illustrator, Inkscape or Canva, so the finishing work happens in whatever tool you already use.
- **Compose.** Or set the pattern into a designed sheet — artwork field, title block, parameter table, accent mark — and browse composed layouts with an arrow key. flowshape still isn't an element-level editor: you pick from validated compositions rather than dragging boxes. *See [the poster composer](#the-poster-composer).*
- **Motion.** Feed the same pattern audio — a file or the microphone — and it moves with the sound on a 16:9, 9:16 or 1:1 stage. Record it and download a video file with your audio in it. *See [the animated stage](#the-animated-stage--audio-visualizer).*

Two things make it more than a toy:

- **The URL is the state.** Pattern id, every parameter, seed, colour and format are encoded in the address bar. Copy the link and anyone gets the identical artwork, byte for byte. There is nothing to save and nothing to log in to.
- **The maths and the code are both on the page.** Every pattern exposes the actual formula that draws it, a plain-language reading of that formula, a note on what each parameter does, a real citation — and the generator's own source, unedited.

## Inside every pattern

Each pattern in the playground has three views.

**1 · The artwork.** Live SVG, regenerated on every slider move, deterministic from the URL.

**2 · Explain the math.** Not a marketing gloss — the equation the code implements, in English and Spanish, with the primary source cited. Phyllotaxis, for example:

```
θₙ = n · α                  (α ≈ 137.50776°, the golden angle)
rₙ = s · n^p                (p = 0.5 in Vogel's original model)
s  = R / (N − 1)^p          (R = maximum radius available in the frame)
```

> Every point *n* is placed at angle *n·α* and radius *rₙ = s·n^p*. Because α is the golden angle — the turn that splits a full circle in the golden ratio — no finite number of points ever lands back on the same ray. That single fact is the whole trick: it is what keeps a sunflower head, or this pattern, filling in without ever leaving a visible seam or a repeating spoke.
>
> — *Source: Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4)*

Then each parameter is annotated, including which ones are mathematics and which are only rendering choices — a distinction the app is explicit about, because conflating them is how people come away thinking they understand a formula they don't.

**3 · Code.** The real generator module, loaded lazily from source, not a rewritten teaching version. That same phyllotaxis document above corresponds to this, in full:

```ts
const maxR = Math.min(size.w, size.h) * 0.47;
const scale = maxR / Math.pow(points - 1, exp);
for (let n = 0; n < points; n++) {
  const r = scale * Math.pow(n, exp);
  const a = n * angleRad;
  children.push(el('circle', {
    cx: cx + r * Math.cos(a),
    cy: cy + r * Math.sin(a),
    r: p['dotMin']! + n * p['dotGrow']!,
    fill: accent ? 'accent' : 'ink',
  }));
}
```

Forty lines, no framework, no hidden library doing the interesting part. That is the point: the gap between the equation and the picture should be short enough to read in one sitting.

**Every formula, explanation and citation in the catalogue is collected in [docs/patterns.md](docs/patterns.md)** — generated from the live registry and the same content the app serves, so it cannot drift.

## The catalogue

**Points & Meshes** *(5)* — [Phyllotaxis](docs/patterns.md#phyllotaxis) · [Stipple Field](docs/patterns.md#stipple-field) · [Delaunay Mesh](docs/patterns.md#delaunay-mesh) · [Voronoi Cells](docs/patterns.md#voronoi-cells) · [Apollonian Circles](docs/patterns.md#apollonian-circles)

**Curves** *(6)* — [Maurer Rose](docs/patterns.md#maurer-rose) · [Harmonograph](docs/patterns.md#harmonograph) · [Times-Table Chords](docs/patterns.md#times-table-chords) · [Concentric Bands](docs/patterns.md#concentric-bands) · [Rose Lattice](docs/patterns.md#rose-lattice) · [Helix Ladder](docs/patterns.md#helix-ladder)

**Fields** *(5)* — [Flow Field](docs/patterns.md#flow-field) · [Coulomb Field](docs/patterns.md#coulomb-field) · [Moiré Weave](docs/patterns.md#moiré-weave) · [Warped Fabric](docs/patterns.md#warped-fabric) · [Converging Chirp](docs/patterns.md#converging-chirp)

**Tilings** *(4)* — [Truchet Arcs](docs/patterns.md#truchet-arcs) · [Hitomezashi](docs/patterns.md#hitomezashi) · [Girih Stars](docs/patterns.md#girih-stars) · [Ribbon Interlace](docs/patterns.md#ribbon-interlace)

**Isometric** *(4)* — [Voxel Form](docs/patterns.md#voxel-form) · [Iso Weave](docs/patterns.md#iso-weave) · [Nested Shafts](docs/patterns.md#nested-shafts) · [Tumbling Blocks](docs/patterns.md#tumbling-blocks)

**Growth** *(1)* — [Differential Growth](docs/patterns.md#differential-growth)

All 25, with the formula, explanation, parameters and citation for each, in **[docs/patterns.md](docs/patterns.md)**. Sources run from Vogel and Descartes to Hankin, Truchet, Seaton, Jobard & Lefer, Quílez, Newell and Müller-Brockmann.

## Design rules

These are constraints, not accidents:

- **Determinism.** No `Math.random`, no `Date`. All randomness derives from a seeded `mulberry32` PRNG, split per subsystem so two random streams inside one pattern never interfere. Same URL ⇒ same SVG, always. The test suite snapshots every pattern's output to enforce it.
- **Pure SVG.** No canvas in the poster path, no raster steps, no gradients, no filters, no blur. Quality comes from line craft, not from rendering tricks.
- **Monochrome by default.** Ink on paper. Colour is opt-in, flat, and generated in OKLCH so lightness stays perceptually even across hues — with a brute-force-verified floor on the paper/ink contrast gap across the whole control space. The composer's colorways tint the sheet, but only ever as a tint; a monochrome pattern still composes to a monochrome poster.
- **Colour roles, not hex codes.** Generators emit `ink` / `paper` / `accent` tokens; the palette is resolved at render time. That is what lets any palette — ink on near-black, ink on paper white — apply to every pattern without touching a single generator.
- **Normalised frame.** The short edge is fixed at 600 user units, so a stroke width means the same visual weight on A5 and on 24×36″.
- **No file over ~400 lines.** One file per concern.

## The poster composer

Export gives you the artwork. The composer gives you the sheet: the pattern set into a designed poster with a title block, its one-sentence description, a parameter table and a single accent mark.

It is not an editor. **A layout is data, not code** — a record naming one mode per region (artwork field, title block, data block, accent mark) plus a split point, margins and a legal aspect range. One renderer resolves any such record; a validator holds every compositional rule in one predicate. Adding a ninth layout is a record in `src/compose/skeletons.ts` and no other file, and nothing outside that file may branch on a layout's id.

- **Eight reference layouts, expanded.** Each is varied across its free axes — split position, decoration, accent mark — giving 68 browsable variants on A3, all validated. One pass through the list shows every distinct layout before it starts refining them.
- **The format you already chose drives it.** Split points are stored as fractions, never pixels, and each layout declares the sheet ratios it survives. Pick a square or a landscape sheet and you are offered the layouts that read at that ratio (20 of the 68) rather than one that will break.
- **Colorways are generated, not tabulated.** Twelve steps around the hue circle, sampled in OKLCH at fixed lightnesses. The accent is sampled twice, because it does two jobs: a mark at L 0.50 that clears 4.5:1 against paper for every hue, and a field at L 0.78 for layouts where the accent becomes a full ground. The neutrals carry a small chroma so the whole sheet responds to the control, not just whichever corner holds the mark.
- **Inversion is a palette swap.** The artwork is SVG with colour-role tokens, so putting dark forms on a light sheet re-emits the tree in a different palette. No filters, no raster step, no blend modes — the export stays a clean vector file.
- **Hide the text.** A checkbox drops every text element and keeps the composition, for when you want the sheet without the words.
- **Overflow is specified, not hoped for.** A title that will not fit steps down 8% at a time to a floor, and below that the layout is refused rather than ellipsed — the browse list simply does not offer a layout that cannot hold the pattern's name.

Everything lands in the URL like the rest of the app, so a composed poster reproduces from its link.

Full design: **[docs/poster-composer.md](docs/poster-composer.md)**.

## The animated stage — audio visualizer

> **Live.**

Take a pattern you have tuned, feed it audio — a dropped file or the microphone — and it moves with the sound. The live screen is the product; movie export is a capture of the same pipeline.

- **Six features per frame** — `bass`, `mid`, `high`, `level`, `bright` (spectral centroid), `flux` — each auto-gained per band so a quiet voice memo modulates as fully as a mastered track, then smoothed by an envelope follower. Raw FFT frames never touch a parameter; the envelopes are what make motion musical instead of jittery.
- **Beat-aware.** In file mode, onsets and tempo are precomputed over the whole buffer, so the next frame can be built *before* the downbeat and swapped exactly on it. In mic mode, detection is realtime.
- **All 25 patterns animate.** Continuous per-frame modulation where the geometry allows it; a universal beat-quantised event mode — reroll the seed, step a structural parameter, flip a boolean — for everything else, including discrete tilings that have nothing continuous to move.
- **Same generators, different renderer.** A small adapter draws the existing `SvgNode` tree to canvas2d, checked against the SVG output by a per-pattern pixel diff. The poster path stays pure SVG.
- **Download the video.** Record the stage and save an **MP4** with the audio muxed in, at 1920×1080, 1080×1920 or 1080×1080. Capture goes through `MediaRecorder` first, falling back to WebM on browsers that will not record H.264/AAC; a deterministic WebCodecs offline encoder — same audio + same URL ⇒ byte-identical MP4, faster than realtime — is the next phase.
- **Audio never leaves the browser.** There is nowhere to send it.

One rule bends here and only here: **colour and gradients are permitted on the animated stage**, with spectral centroid driving hue and level driving chroma in OKLCH, so silence decays back to monochrome. The poster path is untouched — flat colours, no gradients, monochrome by default. A moving screen and a printed sheet are different media.

Full design: **[docs/audio-visualizer.md](docs/audio-visualizer.md)**.

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

Every pattern is covered by a shared test harness that checks determinism, snapshots the output, sweeps each parameter to its extremes hunting for `NaN`/`Infinity`, and enforces an element budget.

## Layout

```
src/
  core/       prng · url-state · svg builder · noise · geometry · oklch · persist
  patterns/   registry + one module per pattern (25) + presets, randomize
  poster/     formats · palettes · export (SVG / PNG)
  compose/    poster composer — units · colorways · regions · skeletons · variants · render
  ui/         gallery · playground · poster · animate · about · nav · footer · controls · modal
  i18n/       EN/ES tables: chrome strings, pattern names, parameter labels
  content/    explain/<pattern>.<en|es>.md — formula, explanation, citation
              blurbs.ts — the one-line EN/ES description each poster prints
  audio/      dsp · features · onsets (analysis layer for the animated stage)
  workers/    off-thread generation for heavy patterns
scripts/      build-thumbs.ts (prebuild step)
tests/        Vitest — core, patterns (snapshotted), poster, compose, ui, audio, anim
docs/         architecture, patterns, URL schema, audio visualizer, specs and plans
```

## Documentation

- **[docs/architecture.md](docs/architecture.md)** — how the pieces fit, the pattern contract, the colour-role system, non-goals
- **[docs/patterns.md](docs/patterns.md)** — every pattern's formula, explanation, parameters and source, plus how to add one
- **[docs/url-state.md](docs/url-state.md)** — the URL schema and its compatibility rules
- **[docs/poster-composer.md](docs/poster-composer.md)** — the composer's region model, layout registry and colour system
- **[docs/audio-visualizer.md](docs/audio-visualizer.md)** — the animated stage design
- **[docs/research/](docs/research/)** — the verified maths catalogues the patterns were built from
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — conventions, tests, and what a new pattern must satisfy

## Inspiration and credits

flowshape was **inspired by [bookofshapes.com](https://bookofshapes.com)**, which served as the reference and quality guide throughout: it set the craft standard this project aims at — hairline strokes, strict monochrome discipline, committed compositional registers, and real occlusion instead of alpha blending.

flowshape is an independent implementation. It shares no code with that site; the pattern set, the parameter UI, the bilingual maths explanations, the URL-as-state model and the poster export pipeline are its own.

Individual patterns cite their own mathematical sources inside `src/content/explain/`.

## Author

**Jose "Jossi" Fresco Benaim** — [ORCID 0009-0000-2026-0836](https://orcid.org/0009-0000-2026-0836) · [jossifresco.com](https://jossifresco.com)

If you use flowshape in published work, see [CITATION.cff](CITATION.cff).

## Licence

[MIT](LICENSE) © 2026 Jose "Jossi" Fresco Benaim.

Posters you generate are yours — the licence covers this software, not your output.
