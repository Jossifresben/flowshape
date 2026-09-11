# playgrnd.tools audit — candidate patterns for flowshape

> Desk audit, 2026-09-11. **Coverage caveat:** `playgrnd.tools` was unreachable
> from the audit environment (blocked by the network egress policy), so the
> catalogue below was reconstructed from the search-engine index of the site's
> per-tool pages. 40 of the site's stated 43 tools were identified; 39 carry the
> site's own one-line description. The `/whorl` page itself could not be read —
> it appears to be one of the five tools added on 2026-09-04 and is not yet
> indexed — so the Whorl entry below is reasoned from the name and from the
> mathematics the name points at, not from the tool's UI. Verify against the
> live page before building.

## Outcome (2026-09-11)

- `contour` built and promoted: `src/patterns/contour.ts`. Marching squares
  lives in `src/core/marching.ts` as a shared utility.
- `whorl` was first built as the fingerprint ridge field described below and
  **rejected**: the live playgrnd Whorl turned out to be a different object —
  a field of stripes bent by a handful of *centres* with pull/push weights,
  drawn as alternating filled bands (controls: centres, pull, push, stripe
  count). It was then rebuilt as that: the level sets of a ramp with Gaussian
  hills and pits, all integer levels in one evenodd path over the same
  marching-squares core. Promoted as `whorl` (38 → 40 with contour). The
  ridge-field reading below stays on record as a candidate in its own right.

## What playgrnd is

- "Tiny tools for making weird, beautiful things": 43 free, single-purpose
  generative design tools by Brett ([@BrettFromDJ](https://x.com/BrettFromDJ)),
  built for his design agency and released free. Beta launched with 32 tools;
  five more landed on 2026-09-04.
- Runs in the browser, no accounts, nothing uploaded. Each tool: one click ⇒ a
  new seeded result; "Animate" toggle; exports SVG (where vector), PNG, and
  video (video requires Animate on). Marketing line: "Dither everything."
- Positioning relative to flowshape: playgrnd is *designer-facing texture and
  background generation* — riso grain, dither, glitch, collage. flowshape is
  *mathematics-facing*: a formula, a citation, the source, and a URL that is
  the state. The overlap is the subset of playgrnd tools that have a real
  governing equation underneath the styling. Those are the candidates.
- **Provenance note.** Julian Hespenheide (interaction designer, Berlin)
  [posted on X](https://x.com/julihespenheide/status/2098070502157791452)
  that at least one playgrnd tool is a "blatant copy" of an original of his,
  and asked how many others were. The post could not be read from this
  environment, so which tool is disputed is unknown. Practical consequence for
  us: borrow the *mathematics* (which is public and citable), never the
  visual treatment, and cite the primary source as usual — the house rule
  already requires this.
- **Name collision.** "Whorl" is also the name of two unrelated products: Remon
  Tijssen's [whorl.app](https://whorl.app/) (generative stencils + motion,
  "Whorl 2.0") and the iOS app at wwwhorl.com. `whorl` is fine as a pattern
  *id*; the display name should say what it is ("Fingerprint Whorl", "Ridge
  Field") rather than lean on the word alone.

## Catalogue as found

Verdicts: **candidate** (a governing formula exists and it is not already in
flowshape) · **covered** (flowshape already has the mathematics) · **out**
(needs gradients/raster/type, or is collage without an equation — see the
non-negotiables in `CONTRIBUTING.md`).

| Tool | Site description (abridged) | Verdict |
|---|---|---|
| Whorl | *(page not indexed; added 2026-09-04)* | **candidate** → `whorl` |
| Terrain | posterised colour fields with dithered edges, organic regions of flat colour | **candidate** → `contour` |
| Sonar | dithered landmass: coastline cut from a noise field, halftone fill, speckle edge | candidate (contour + halftone) |
| Atlas | text-mode terrain: noise carved into terraces, typed as characters on a monospace grid | out (type); terraces → `contour` |
| Culture | colony backgrounds: soft cells fusing where they meet, banded into concentric rings | **candidate** → `metaball` |
| Pith | cellular tissue: organic cells in a loose grid, dithered bands edge to core, branching veins | candidate (metaball / voronoi) |
| Tokens | clustered grid tokens: outlined circles and squares that chain and merge into compound forms | candidate (metaball) |
| Carve | panel collage: the frame carves itself into rectangles, each dealt flat colour, stripes, chevrons, a ramp or a grid | **candidate** → `partition` |
| Modular | modular grid compositions: blocks, dot matrices, line grids and gradients on a seeded grid | candidate (partition) |
| Pane | gradient panels: rows of uneven panes each ramping between two inks | out (gradients); layout → `partition` |
| Stipple | dot fields: halftone lattices and contour scatters from a noise field; symmetry Mirror/Quad/Radial | **candidate** → `halftone`; scatter is covered by `stipple` |
| Husk | pebble silhouettes, fill eaten from the rim by a crumbled edge or a halftone screen | candidate (halftone) |
| Quilt | woven pixel patterns: brick bands, plaid, checker, dithered diagonals, staircase ramps | **candidate** → `tartan` |
| Weave | woven stripe graphics: stacked ribbon bands each with its own rhythm of vertical stripes | covered (`isoweave`, `hitomezashi`) / tartan |
| Totem | symmetrical pixel banners: static border around a mirrored panel of woven motifs | out (pixel collage) |
| Zig | interlocking zigzag: rounded teeth, chevrons and staircases in bold duotone | **candidate** → `chevron` |
| Optic | striped counterchange posters: even field of bars with a centred figure cut in, phase-flipped or re-angled | candidate → `counterchange` |
| Warp | warped op-art: checkerboards and slashes bent through waves, tapers and bulges | covered (`fabric`, `moire`) |
| Rise | radial stripe arc posters: even field of bars, giant concentric bands rising from any edge | covered (`bands`) |
| Bloom | symmetrical pixel banners: soft rings from the centre quantised into big square pixels, mirrored | covered (`bands`) — pixel quantisation is a rendering choice |
| Emblem | symmetrical emblems: checkered field, ringed discs, starburst / cogged ring / compass / rosette | covered (`roselattice`, `guilloche`, `maurer`) |
| Filament | flowing filament fields: streamlines through a noise field bundled into ropes, glyph marks | covered (`flowfield`) |
| Aura | soft vibrant gradient backdrops, aurora wallpaper | out (gradients) |
| Mist | sprayed neon washes, airbrush edges, gentle grain | out (gradients, grain) |
| Prism | pixel aurora: chunky rainbow pixel streams on a black dot grid | out (raster palette) |
| Static | two-colour glitch pixel posters: moiré, scanlines, noise, blocks crushed to one bit | out (raster glitch; moiré is covered) |
| Mosh | datamosh bands: pixel confetti, torn block mosaics, smear, dead scanlines, chevron tearing | out |
| Delta | corrupted satellite fields: marbled noise under mosaics of clashing pixel blocks | out |
| Hiss | television-snow posters: pointed leaves of static over marbled colour | out |
| Frond | degraded riso still-life: botanical line work in 1-bit marks, dithered noise | out |
| Riso | torn-paper riso collages: ragged two-colour bands, scribbles, big dots, grain | out |
| Splice | cut-up riso: one field of soft hills sliced into pieces, each in its own screen and inks | out (collage) — hills field is `contour` |
| Chaff | scattered curved blades in one ink on a rough sheet | out |
| Fete | festival posters: chunky colour patches, freehand doodles, constellation dots | out |
| Kiosk | fly-poster backgrounds: colour bands into hard stripes, halftone, dense grid of type | out (type) |
| Specimen | grids of abstract colour blocks: marbling, tendrils, fans, rings, spikes | out (collage) |
| Sampler / Relief | seamless boards: columns of pattern blocks under routed traces that wrap at every edge | out as patterns; **feature idea**: seamless tile |
| Parcel | pixel parcel posters: two-tone block fields with hairline survey grids | out |
| Oddgrid | pixelated grid artwork with adjustable pattern, colour and motion | out |

Three tools remain unidentified (not in the search index at audit time).

## Ranked candidates

Each entry follows the *Adding a pattern* checklist in `docs/patterns.md`:
generator, family, formula, primary source, parameters, register, and what it
would collide with.

### 1. `whorl` — Fingerprint Whorl · family `fields`

The user's own example, and the strongest candidate: a ridge field with cores
and deltas is something no noise field can produce, and flowshape has nothing
with a singularity of this kind.

**Formula (Sherlock–Monro zero-pole model).** Treat the plane as ℂ. Put cores
at c₁…c_m and deltas at d₁…d_n. The ridge *orientation* (an angle mod π, not a
vector) is

    θ(z) = θ₀ + ½ · [ Σᵢ arg(z − cᵢ) − Σⱼ arg(z − dⱼ) ]

Ridges are the streamlines of the unit direction (cos θ, sin θ); the ½ is what
makes a core a half-turn singularity (a loop) and a delta a triradius. Galton's
classes fall out of the counts alone: arch (0,0), loop (1,1), plain whorl
(2,2), with the two cores of a whorl placed close together. Trace evenly spaced
streamlines (Jobard & Lefer 1997) from a seed queue at spacing *s*; real
fingerprints have a ridge period of about 0.5 mm, roughly 10 ridges per cm, a
number worth quoting in the explain document.

**Source.** Sherlock, B. G. & Monro, D. M. (1993) "A model for interpreting
fingerprint topology", *Pattern Recognition* 26(7), 1047–1055,
doi:10.1016/0031-3203(93)90006-I. Classification: Galton, F. (1892) *Finger
Prints*, Macmillan. Streamline placement: Jobard, B. & Lefer, W. (1997)
"Creating evenly-spaced streamlines of arbitrary density", *Visualization in
Scientific Computing '97*.

**Parameters.** `cores` (int 0–3) · `deltas` (int 0–3) · `separation` (float,
core–core distance as a fraction of frame) · `lean` (float, θ₀) · `spacing`
(float, ridge period) · `steps` (int) · `strokeWidth` · `accentEvery`.
Seeded: yes (singularity jitter). `anim.continuous`: `lean`, `separation`;
`usesPhase` could slide the whole field along the ridges.

**Register.** Ultra-fine monochrome hairline field, `vector-effect:
non-scaling-stroke`. No fills.

**Collision check.** `coulomb` traces field lines of point charges — a vector
field with sources and sinks. `flowfield` is noise. Neither produces a core
(half-integer index) or a delta; the argument-field is genuinely new. Fallback
if the live page turns out to be a spiral tool rather than a ridge tool: a
logarithmic-spiral bundle r = a·e^{bθ} (Bernoulli's *spira mirabilis*) — but
`curlicue`, `loxodrome` and `helix` already cover spiral territory, so the
ridge-field reading is the one worth building.

### 2. `contour` — Contour Terraces · family `fields` · heavy

Terrain, Atlas, Sonar and Splice all start from the same object: a scalar noise
field cut into level sets. flowshape has no isoline or terrace pattern at all,
and the repo's own research notes (`docs/research/2026-08-28-fields-emergent.md`)
already list marching squares as one of three recurring vectorisations.

**Formula.** f(x, y) = Σ_{k<K} gain^k · noise(2^k · x/λ, 2^k · y/λ) (fBm value
noise, seeded). Levels L_i = i/N for i = 1…N. For each L_i, marching squares
on a grid with linear edge interpolation gives closed polygons; saddles
resolved by the centre sample. Painter's algorithm from lowest level to
highest gives true occlusion.

**Source.** Lorensen, W. E. & Cline, H. E. (1987) "Marching cubes: A high
resolution 3D surface construction algorithm", *SIGGRAPH '87*,
doi:10.1145/37401.37422 (2-D case: Maple, C. (2003) "Geometric design and
space planning using the marching squares and marching cube algorithms",
*Proc. Geometric Modeling and Graphics*). Noise: Perlin, K. (1985) "An image
synthesizer", *SIGGRAPH '85*, doi:10.1145/325165.325247.

**Parameters.** `octaves` (int 1–6) · `scale` (float) · `gain` (float) ·
`levels` (int 2–24) · `mode` (enum: terraces / isolines) · `strokeWidth`
(dependsOn mode=isolines) · `accentEvery`.

**Register.** Either: bold flat terraces alternating ink/paper with an accent
level, or hairline isolines. Both are legal; the `mode` enum commits to one.
Simplify polygons (Douglas–Peucker) before serialising to stay inside the
5k-primitive budget; run in a worker.

### 3. `metaball` — Colony Rings · family `growth`

Culture's "cells that fuse where they meet, banded into concentric rings" is
exactly Blinn's implicit surface contoured at several thresholds. Tokens
(circles and squares that merge) and Pith (cells with banded fills) are the
same object with different kernels.

**Formula.** F(p) = Σᵢ rᵢ² / |p − cᵢ|². The cell boundary is F = t; the inner
rings are F = t·ρ, t·ρ², … Contour each with marching squares (shared with
`contour`), draw outermost first. Two blobs fuse when their kernels sum past
*t* between them — the "fusing where they meet" behaviour is the formula, not
an effect.

**Source.** Blinn, J. F. (1982) "A Generalization of Algebraic Surface
Drawing", *ACM Transactions on Graphics* 1(3), 235–256,
doi:10.1145/357306.357310.

**Parameters.** `blobs` (int) · `radius` · `spread` · `threshold` · `rings`
(int 1–8) · `ratio` (ρ) · `mode` (enum: fill / line) · `strokeWidth`. Seeded.
`anim.continuous`: `threshold`, `radius` (cells breathe and fuse).

**Collision check.** `diffgrowth` is a growing curve; `voronoi` partitions
rather than fuses. No overlap.

### 4. `partition` — Recursive Partition · family `tilings`

Carve, Modular and Pane are all a frame recursively split into rectangles and
each leaf dealt a fill. The mathematics is the k-d tree; the art history is
Mondrian and the Swiss grid.

**Formula.** Split(R, d): if d = 0 or area(R) < A_min, emit leaf; else choose
axis (alternate, or by aspect > 1), choose ratio u from the seeded PRNG in
[u_min, 1 − u_min] (optionally snapped to φ⁻¹ ≈ 0.618), split, recurse. Leaf
fills: flat ink / paper / accent by a seeded deal, or a hairline hatch at a
per-leaf angle — Carve's "hard stripes" and "drawn grid" as pure strokes.

**Source.** Bentley, J. L. (1975) "Multidimensional binary search trees used
for associative searching", *Communications of the ACM* 18(9), 509–517,
doi:10.1145/361002.361007. Squarified variant: Bruls, M., Huizing, K. & van
Wijk, J. (2000) "Squarified Treemaps", *Data Visualization 2000*.

**Parameters.** `depth` (int 1–9) · `minRatio` (float) · `golden` (bool) ·
`minArea` · `fill` (enum: flats / hatch / mixed) · `gap` · `strokeWidth`.
Seeded.

**Register.** Bold flat fills, or hairline hatch. Element count is tiny.

### 5. `halftone` — Halftone Screen · family `points`

Sonar, Husk and playgrnd's own Stipple use an *AM halftone lattice* — dots on a
rotated grid, sized by a value — which is a different object from
flowshape's `stipple` (a scatter with spacing driven by the field). Two
screens at different angles also give the print-industry rosette moiré, a
second reason to build it.

**Formula.** Lattice points p_{ij} = R(α)·(i·L, j·L). Dot radius
r = (L/2)·√(v(p)), so ink coverage equals the field value v ∈ [0,1] (area, not
radius, is linear in tone). Field v: seeded fBm, or a radial ramp. Real units
belong in the explain: screen ruling in lines per inch (85 lpi newsprint, 150
lpi magazine) and the conventional CMYK angles 15°/45°/75°/0° chosen to push
the moiré rosette below visibility.

**Source.** Ulichney, R. (1987) *Digital Halftoning*, MIT Press. Ordered
dither: Bayer, B. E. (1973) "An optimum method for two-level rendition of
continuous-tone pictures", *Proc. IEEE Int. Conf. Communications*, 26-11–26-15.

**Parameters.** `pitch` (L) · `angle` (α) · `screens` (int 1–2) · `angleB`
(dependsOn screens=2) · `field` (enum: noise / radial / linear) · `scale` ·
`gamma` · `accentEvery`. Seeded when field = noise.

**Register.** Dots only; ≤ 50k budget respected at pitch ≥ 6 user units.

### 6. `tartan` — Tartan Sett · family `tilings`

Quilt's plaid, Weave's stacked stripe rhythms and Totem's mirrored bands are
all the tartan construction: a palindromic thread-count sequence (the *sett*)
woven against itself in a 2/2 twill.

**Formula.** A sett is a sequence of (colour, count) pairs mirrored about its
pivots, e.g. K/4 R/24 K/24 Y/4 (Scottish Register notation, counts in
threads). Warp and weft carry the same sett; at each crossing the visible
colour follows the twill: cell (i, j) shows warp if ((i + j) mod 4) < 2 else
weft, which renders as the characteristic 45° hatch where two colours cross.
With three role colours the sett draws from {ink, paper, accent}.

**Source.** Stewart, D. C. (1950) *The Setts of the Scottish Tartans*, Oliver
& Boyd; thread-count convention as recorded by the Scottish Register of
Tartans (tartanregister.gov.uk).

**Parameters.** `bands` (int) · `minCount` · `maxCount` · `pivot` (bool,
symmetric vs asymmetric sett) · `twill` (bool, hatch on/off) · `cell` (thread
size). Seeded.

**Collision check.** `hitomezashi` is a stitch pattern, `isoweave` an
isometric weave, `interlace` an over-under band lattice. The sett algebra is
new.

### 7. `chevron` — Chevron & Herringbone · family `tilings`

Zig's rounded teeth, chevrons and staircases in duotone. A modest addition —
flowshape already has six tilings — but the herringbone tiling is a classic
monohedral tiling with wallpaper group *pgg*, and a zigzag frieze is a
one-line formula.

**Formula.** Zigzag band k: y = k·h + A·|((x/λ) mod 2) − 1| (triangle wave);
"rounded teeth" replace the corners with arcs of radius ρ; "staircase" is the
same wave quantised to steps. Herringbone: 2:1 rectangles, alternating
orientation, offset by half a unit each row.

**Source.** Grünbaum, B. & Shephard, G. C. (1987) *Tilings and Patterns*,
W. H. Freeman; Conway, J. H., Burgiel, H. & Goodman-Strauss, C. (2008) *The
Symmetries of Things*, A K Peters (frieze and wallpaper notation).

**Parameters.** `mode` (enum: zigzag / herringbone / staircase) · `period` ·
`amplitude` · `rounding` (dependsOn mode=zigzag) · `bands` · `fill` (bool) ·
`strokeWidth`.

### 8. `counterchange` — Counterchange Stripes · family `fields`

Optic: a stripe field with a centred figure whose interior is phase-flipped or
re-angled. Lowest priority because `moire` and `fabric` already own most of
the op-art register, but the construction is one line and reads as Riley.

**Formula.** s(x, y) = sign(sin(2π·(x cos φ + y sin φ)/λ)); inside the figure
region Ω, use phase φ' = φ + π (flip) or angle φ + Δ (re-angle). Boundary of Ω
is a circle, superellipse or polygon.

**Source.** Riley, B., *Movement in Squares* (1961); the counterchange
construction is described in Wade, D. (1982) *Geometric Patterns and
Borders*, Wildwood House.

## Cross-cutting features worth borrowing

- **Seamless tile export.** Sampler and Relief advertise that the tile "wraps
  at every edge, so the tile repeats forever". flowshape has no seamless mode.
  It is cheap for lattice patterns (`truchet`, `hitomezashi`, `girih`,
  `scales`, `tartan`, `chevron`) and possible for noise patterns by sampling
  noise on a torus. A `tile` flag in the export panel, honoured per pattern,
  would be a real differentiator for print.
- **Symmetry as an engine parameter.** playgrnd's Stipple offers Mirror / Quad
  / Radial symmetry as a post-transform. flowshape could inject a `symmetry`
  param the way it injects `size`, applied as `<g>` transforms with clip paths
  — no generator changes, every pattern gains it.
- Already matched: one-click variation (`randomize.ts`), animation and video
  (the animated stage), SVG/PNG export.

## Suggested order

1. `whorl` — verify the live page first; build the ridge-field reading.
2. `contour` — unlocks marching squares as a shared core utility.
3. `metaball` — reuses that utility a week later.
4. `partition`, `halftone` — small, self-contained.
5. `tartan`, `chevron`, `counterchange` — fill-ins when a tilings or fields
   release wants one more entry.
