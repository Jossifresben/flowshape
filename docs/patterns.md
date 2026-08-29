# The pattern catalogue

25 generators, grouped into six families. Every one is a pure function of
`(params, seed, size)` and emits an `SvgNode` tree — see
[architecture.md](architecture.md) for the contract.

- **Seeded** — the generator consumes `seed`, so the seed control and *Randomize*
  change the result. Unseeded patterns are fully determined by their parameters.
- **Heavy** — generation runs in a Web Worker instead of on the main thread.

Every pattern additionally carries an injected `size` parameter (0.2–1.6) that
scales the artwork inside the frame, and some carry a hidden engine-owned
`phase` used for animation.

## Catalogue

### Points & Meshes

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Phyllotaxis** | `phyllotaxis` | `points` · `angle` · `radialExp` · `dotMin` · `dotGrow` · `accentEvery` | — | — |
| **Stipple Field** | `stipple` | `minGap` · `maxGap` · `noiseScale` · `contrast` · `dotSize` · `accentEvery` | ✓ | — |
| **Delaunay Mesh** | `delaunay` | `points` · `mode` · `strokeWidth` · `vertexSize` · `accentEvery` | ✓ | — |
| **Voronoi Cells** | `voronoi` | `sites` · `inset` · `strokeWidth` · `inkEvery` · `accentEvery` | ✓ | — |
| **Apollonian Circles** | `apollonian` | `maxDepth` · `minRadius` · `strokeWidth` · `fillAlternate` | — | — |

### Curves

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Maurer Rose** | `maurer` | `n` · `d` · `strokeWidth` · `envelope` | — | — |
| **Harmonograph** | `harmonograph` | `ratio` · `detune` · `damping` · `duration` · `strokeWidth` · `opacity` | ✓ | — |
| **Times-Table Chords** | `timestable` | `chords` · `multiplier` · `strokeWidth` · `opacity` · `showCircle` | — | — |
| **Concentric Bands** | `bands` | `bandCount` · `minThickness` · `maxThickness` · `growthExponent` · `gap` · `startAngle` · `sweepAngle` · `accentEvery` | — | — |
| **Rose Lattice** | `roselattice` | `petals` · `rings` · `spokes` · `petalDepth` · `innerFraction` · `strokeWidth` | — | — |
| **Helix Ladder** | `helix` | `turns` · `radiusFraction` · `rungEvery` · `depthFade` · `strokeWidth` | — | — |

### Fields

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Flow Field** | `flowfield` | `freq` · `curl` · `spacing` · `steps` · `strokeWidth` · `emphasisEvery` | ✓ | — |
| **Coulomb Field** | `coulomb` | `charges` · `spacing` · `steps` · `coreRadius` · `strokeWidth` · `emphasisEvery` | ✓ | — |
| **Moiré Weave** | `moire` | `mode` · `spacingA` · `spacingB` · `angleA` · `angleB` · `offset` · `strokeWidth` | — | — |
| **Warped Fabric** | `fabric` | `gridSize` · `warpAmount` · `noiseScale` · `mode` · `dotSize` · `strokeWidth` | ✓ | — |
| **Converging Chirp** | `chirp` | `lineCount` · `freqStart` · `freqEnd` · `amplitude` · `phaseStep` · `strokeWidth` | — | — |

### Tilings

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Truchet Arcs** | `truchet` | `cell` · `variant` · `render` · `strokeWidth` · `boldChance` · `accentChance` | ✓ | — |
| **Hitomezashi** | `hitomezashi` | `cell` · `bitChance` · `strokeWidth` · `fillParity` | ✓ | — |
| **Girih Stars** | `girih` | `hexSize` · `contactAngle` · `render` · `ribbonWidth` · `strokeWidth` | — | — |
| **Ribbon Interlace** | `interlace` | `cell` · `ribbonWidth` · `ringScale` · `coreRatio` · `junctions` · `gapScale` · `strokeWidth` | — | — |

### Isometric

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Voxel Form** | `voxel` | `shape` · `dimension` · `gap` · `shellOnly` · `scatter` · `faceShading` · `depthShading` · `strokeWidth` | ✓ | — |
| **Iso Weave** | `isoweave` | `cell` · `unit` · `armLength` · `beamWidth` · `stagger` · `render` · `hatchDensity` · `faceShading` · `strokeWidth` | — | — |
| **Nested Shafts** | `nested` | `cell` · `depth` · `stepRatio` · `coreSize` · `render` · `twist` · `faceShading` · `strokeWidth` | — | — |
| **Tumbling Blocks** | `tumbling` | `cell` · `flipChance` · `coherence` · `voidChance` · `render` · `hatchDensity` · `faceShading` · `strokeWidth` | ✓ | — |

### Growth

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| **Differential Growth** | `diffgrowth` | `iterations` · `repulsion` · `rings` · `strokeWidth` | ✓ | ✓ |

## Where the maths comes from

Each pattern ships an *Explain the math* document in English and Spanish under
`src/content/explain/<id>.<en|es>.md`, carrying the formula, a plain-language
reading, per-parameter notes, and the citation below.

| Pattern | Mathematical source |
|---|---|
| Phyllotaxis | Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4) |
| Stipple Field | Bridson, R. (2007) "Fast Poisson Disk Sampling in Arbitrary Dimensions", ACM SIGGRAPH 2007 Sketches |
| Delaunay Mesh | Delaunay, B. (1934) "Sur la sphère vide", Bulletin de l'Académie des Sciences de l'URSS; Bowyer, A. and Watson, D.F. (1981), independent incremental algorithms |
| Voronoi Cells | Voronoi, G. (1908) "Nouvelles applications des paramètres continus à la théorie des formes quadratiques", Journal für die reine und angewandte Mathematik 133 |
| Apollonian Circles | Descartes' Circle Theorem; complex form: Lagarias, J. C., Mallows, C. L. & Wilks, A. (2002), "Beyond the Descartes Circle Theorem", American Mathematical Monthly 109(4) |
| Maurer Rose | Maurer, P.M. (1987) "A Rose is a Rose...", The American Mathematical Monthly 94(7), 631–645 |
| Harmonograph | Bourke, P. "Harmonograph"; underlying physics traces to Lissajous, J.A. (1857) |
| Times-Table Chords | Plouffe, S. (pattern); Polster, B. and Geracitano, G., "Times Tables, Mandelbrot and the Heart of Mathematics" (Mathologer, 2019) |
| Concentric Bands | Müller-Brockmann, J. (1955) Tonhalle concert poster ("Beethoven") — concentric-arc design lineage; band-thickness progression per bookofshapes.com competitive research, Part 3 (2026) |
| Rose Lattice | Weisstein, E. W., "Rose", MathWorld |
| Helix Ladder | Helix, parametric double-helix curve; cf. Wikipedia, "Helix" |
| Flow Field | Hobbs, T. (2020) "Flow Fields"; streamline separation rule after Jobard, B. and Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density" |
| Coulomb Field | Jobard, B. & Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density", Visualization in Scientific Computing '97 (field is the classic 2D electrostatic point-charge field) |
| Moiré Weave | Amidror, I. (2000) "The Theory of the Moiré Phenomenon, Volume I: Periodic Layers" |
| Warped Fabric | Quílez, I. (2002), "Domain Warping" |
| Converging Chirp | Linear (frequency-swept) chirp signal; cf. Wikipedia, "Chirp" |
| Truchet Arcs | Truchet, S. (1704) "Mémoire sur les combinaisons"; arc variant popularized by Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4) |
| Hitomezashi | Seaton, K.A. (2023) "Mathematical specification of hitomezashi designs", Journal of Mathematics and the Arts 17(1-2) |
| Girih Stars | Hankin, E.H. (1925) "The Drawing of Geometric Patterns in Saracenic Art", Memoirs of the Archaeological Survey of India; construction formalized by Kaplan, C.S. (2005) "Islamic Star Patterns from Polygons in Contact" |
| Ribbon Interlace | Celtic knotwork construction (Cromwell, P.R., 1993, "Celtic Knotwork: Mathematical Art", The Mathematical Intelligencer 15(1), 36–47); the free over/under rests on the honeycomb graph being bipartite — a graph is bipartite iff it contains no odd cycle (Kőnig, D., 1916) |
| Voxel Form | Isometric projection; painter's algorithm (Newell, Newell & Sancha, 1972, "A Solution to the Hidden Surface Problem") |
| Iso Weave | Isometric projection; painter's algorithm (Newell, Newell & Sancha, 1972, "A Solution to the Hidden Surface Problem"); 3-colouring of the triangular lattice |
| Nested Shafts | Rhombille ("tumbling blocks") tiling, the dual of the trihexagonal tiling — Grünbaum, B. & Shephard, G.C. (1987) "Tilings and Patterns"; nonzero winding rule, W3C SVG 1.1 §11.3 "fill-rule" |
| Tumbling Blocks | Rhombille tiling ("tumbling blocks", "reversible cubes"), the Laves tiling [3.6.3.6] dual to the trihexagonal tiling (Grünbaum, B. & Shephard, G.C., 1987, "Tilings and Patterns", tiling P4-42); reversible-cube ambiguity (Necker, L.A., 1832, "Observations on some remarkable optical phænomena seen in Switzerland; and on an optical phænomenon which occurs on viewing a figure of a crystal or geometrical solid", London and Edinburgh Philosophical Magazine 1(5), 329–337) |
| Differential Growth | Webb, J. "2D Differential Growth Experiments" (ongoing since 2018) |

The three verified research catalogues these were selected from live in
[research/](research/): analytic curves, fields and emergent systems, and
tilings and discrete patterns. They also document the candidate shapes that were
considered and cut.

## Adding a pattern

1. **Write the generator** — `src/patterns/<id>.ts`, one file, calling
   `definePattern({...})`. Keep it under ~400 lines.
2. **Obey the contract**: pure and deterministic, no `Math.random`, no `Date`.
   Take randomness from `mulberry32(deriveSeed(seed, 'name'))` in `core/prng`.
   Emit `ink` / `paper` / `accent` role tokens, never literal colours. Build
   nodes with `el()` from `core/svg`.
3. **Register it** — add the import to `src/patterns/index.ts`, a display name to
   `NAMES` and a preset to `src/patterns/presets.ts`
   (`tests/patterns/presets.test.ts` asserts every pattern has one).
4. **Test it** — copy an existing `tests/patterns/<id>.test.ts`. The shared
   harness snapshots the output, which is what pins determinism.
5. **Explain it** — `src/content/explain/<id>.en.md` and `.es.md`, with
   `source:` and `url:` front matter. `tests/content/explain.test.ts` requires
   both languages for every registered pattern.
6. **Regenerate thumbnails** — `npm run thumbs`, and commit the new
   `public/thumbs/<id>.svg`.

Choose an `id` carefully: it appears in shared URLs and **must never be
renamed**. Parameter keys are equally permanent, and cannot collide with the
reserved keys in `src/core/reserved.ts`.

## Rendering discipline

The house style, applied to every generator:

- Hairline strokes with `vector-effect="non-scaling-stroke"`, so weight is
  independent of the poster format.
- Commit to a register: an ultra-fine monochrome hairline field *or* bold flat
  fills. Nothing in between.
- No gradients, filters, blurs or shadows anywhere in the poster path.
- Depth through genuine occlusion (painter's algorithm) or through stroke
  weight and opacity — never through alpha blending of hidden geometry.
- Element budgets documented in the module: roughly ≤ 50k dots, ≤ 5k primitives,
  polylines simplified before they are serialised.
