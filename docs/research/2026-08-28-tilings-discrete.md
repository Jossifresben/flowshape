# Tilings, Tessellations, and Discrete/Symbolic Systems — Formula Catalog

> Research agent output, 2026-08-28. Verified against Carlson's Bridges 2018 paper, Paul Bourke's L-system pages, Wikipedia, preshing.com's Penrose algorithm. All systems deterministic given a seed (mulberry32/sfc32 — never `Math.random()`).

**SVG budget rule:** snappy up to ~10k–50k elements; beyond that merge into few `<path>` elements with many subpaths (one path per color/class). `<use>`+`<symbol>` reduces file size but NOT render cost — for >5k tiles prefer merged paths.

## 1. Truchet tiles — diagonal and arc (Smith) variants

Square grid; per cell pick a rotational state with seeded PRNG.
- *Diagonal (1704):* square split along diagonal, one half filled; 4 rotations.
- *Arc (Smith 1987):* two quarter-circle arcs radius s/2 joining midpoints of adjacent sides; 2 states. Arc endpoints sit at all four edge midpoints, so arcs always connect across tiles into continuous curves.
- *Two-coloring:* Smith curves separate the plane into two-colorable domains (propagate parity across edges, or Carlson's parity trick §2).

Params: grid 8–120; state-probability bias p (0.05–0.2 = "stripes with defects"); arc/diagonal/mixed; stroke 5–40% of cell; extra motifs (×, |, −).
SVG: `<symbol>`+`<use>` up to a few thousand cells; else one merged path of `A` commands. Expose: density, p, stroke width, tile set, color pair, fill-vs-stroke.

## 2. Multi-scale Truchet (Christopher Carlson, Bridges 2018) — verified

- Arcs meet the sides at **1/3 and 2/3** of side length (not 1/2) so half-scale tiles connect to full-scale ones. 8 connection points per tile.
- **Winged tiles:** motif = content inside square + wings overlapping neighbors. **15 motifs** (`\ / − | +. x. + fne fsw fnw fse tn ts te tw`).
- **Parity coloring:** colors invert with each scaling step; parity = whether log2(scale) is even/odd. This makes domains merge with zero bookkeeping.
- **Layout:** coarse grid; recursively subdivide each square into 4 with probability pSub per level down to maxDepth; assign leaf motifs (weighted).
- **Rendering (from the paper):** tile = 3×3 transform; sort large → small; draw in order (small paints over large); invert colors by parity of √det.
- **Region fills:** keep sub-squares inside, discard outside, subdivide crossing — test the *winged* bounding square.

Params: base grid 4–12; depth 2–5; pSub 0.2–0.8; motif subsets (good combos: `(|,−)`, `(+,+.,fne)`, `(/,fnw,te)`, `(\,fnw,x.)`); weights.
**Visual: the single strongest "wow" system in this catalog for B&W posters.**
SVG: 15 motifs × 2 (normal/inverted) in `<defs>`; painter's order mandatory; cap ~20k tiles.

## 3. Wang tiles

Squares with colored edges (N,E,S,W), no rotation, adjacent edges match. Scanline generation: W edge constrained by left neighbor, N by above; pick among satisfying tiles. Complete set (2 colors → 16 tiles) never needs backtracking. Decorate tiles keyed to edge colors (pipes/circuits) for continuous linework. Skip Culik–Kari aperiodic set (needs propagation, visually meh).

Params: colors 2–4; grid 10–100; weights; decoration style. SVG: ideal `<symbol>` case (≤81 symbols, fixed orientation).

## 4. Penrose tilings — P2/P3 via triangle deflation (verified: preshing.com)

Robinson triangles `(color, A, B, C)`, vertices as complex/{x,y}; φ = (1+√5)/2.

P3 subdivision:
- **Red** (half thin rhombus): `P = A + (B−A)/φ` → red(C, P, B), blue(P, C, A).
- **Blue** (half thick rhombus): `Q = B + (A−B)/φ`, `R = B + (C−B)/φ` → blue(R, C, A), blue(Q, R, B), red(R, Q, A).
- **Seed:** wheel of 10 red triangles: A = origin, B/C at angles (2k∓1)π/10 on unit circle, alternate mirrored (swap B,C).
- **Rhombus rendering:** stroke only C→A→B (skip BC) — internal edges vanish.

P2 (kite/dart): same machinery, dual subdivision table. Alternative: de Bruijn pentagrid (infinite scrollable patches).

Params: depth 4–9 (~×φ² per step; depth 8 ≈ 22k triangles = ceiling); P2/P3; crop window; coloring by type / orientation angle (10 hues) / distance.
SVG: two fill paths (one per color) + one stroke path; overdraw of coincident edges invisible.

## 5. Islamic girih — Hankin's polygons-in-contact

1. **Base tessellation:** hex grid; squares; 4.6.12; 4.8.8; or the five girih tiles (decagon, pentagon, elongated hexagon, bowtie, rhombus — edge length 1, angles multiples of 36°).
2. **Hankin inference:** from each edge **midpoint** launch two rays into the polygon interior at ±θ (contact angle) from the edge; extend until meeting the ray from the adjacent edge (line intersection). Union of segments = pattern; base tessellation discarded. Continuity across boundaries is automatic.

Canonical θ: 72°/54°/36° (decagonal: acute/median/obtuse); 30°/45°/60° for hex/square. Hex + θ=30° = classic 6-pointed-star-and-hexagon.

Params: base tiling; **θ continuous 15–80° (the killer slider — stars bloom open/closed)**; line width; interlacing (ribbon strands with over/under via cased-stroke trick: wide background-color stroke under each "over" strand); two-color region fill (needs planar face extraction — ship line/ribbon first).

## 6. Elementary cellular automata

1D row of W cells; time flows down. `newRow[x] = (rule >> (l<<2 | c<<1 | r)) & 1`. Wrap or fixed edges. Init: single centered 1, or seeded random density p.

Good rules: **30** (chaotic seashell), **90** (Sierpinski/XOR lace), **110** (Turing-complete glider trails), 45, 73, 105, 150 (rich), 54, 62, 122, 126, 182 (multi-scale triangles), 60/102 (one-sided Sierpinski).
Params: rule 0–255, width 100–800, init mode + density 0.01–0.5.
SVG: run-length encode rows into horizontal bars as subpaths (`M x y h run v 1 h -run z`); greedy rect merge; target < 30k subpaths.

## 7. 2D cellular automata — Life stills and relatives

Moore neighborhood, toroidal, B/S notation. Seed soup density p, run G generations, render final frame; optionally trail-composite generations or color by cell age.

Ship: B3/S23 Life (sparse debris); B36/S23 HighLife; B3678/S34678 Day & Night (camouflage islands); B2/S∅ Seeds (explosive lace, G=15–40); **B3/S012345678 Life-without-Death (coral/lichen — outstanding, G=100–400 from few seeds)**; B5678/S45678 Vote (ink-blot organics, G=20–50); cyclic CA k=12–16 states (spiral waves, G=100–500).
Params: rule, grid 100–500², density, generations, symmetric-seed toggle (mandala debris), age coloring.

## 8. L-systems — verified rule table

Rewriting (axiom, rules) × n iterations → turtle: F/G/A/B draw; f move; +/− turn by angle; [ ] push/pop. Cap string ~1–5M chars; stream the turtle.

| System | Axiom | Rules | Angle | Depth |
|---|---|---|---|---|
| Fractal plant | `-X` | `X → F+[[X]-X]-F[-FX]+X`, `F → FF` | 25° | 4–7 |
| Dragon curve | `F` | `F → F+G`, `G → F-G` (both draw) | 90° | 9–16 |
| Sierpinski triangle | `F−G−G` | `F → F−G+F+G−F`, `G → GG` | 120° | 4–8 |
| Sierpinski arrowhead | `A` | `A → B−A−B`, `B → A+B+A` (both draw) | 60° | 4–9 |
| Hilbert curve | `X` | `X → -YF+XFX+FY-`, `Y → +XF-YFY-FX+` | 90° | 3–8 |
| Koch quadratic island | `F+F+F+F` | `F → F+F-F-FF+F+F-F` | 90° | 2–5 |
| Koch snowflake | `F++F++F` | `F → F-F++F-F` | 60° | 2–6 |
| Hexagonal Gosper | `XF` | `X → X+YF++YF-FX--FXFX-YF+`, `Y → -FX+YFYF++YF+FX--FX-Y` | 60° | 2–5 |
| Peano | `X` | `X → XFYFX+F+YFXFY−F−XFYFX`, `Y → YFXFY−F−XFYFX+F+YFXFY` | 90° | 2–4 |
| Binary tree | `0` | `0 → 1[0]0`, `1 → 11` ([: push+left 45°, ]: pop+right) | 45° | 4–9 |

Stochastic: weighted multiple productions per symbol (plant `F→FF` 0.7 / `F→F` 0.3). Parametric: per-depth length decay k 0.6–0.95, angle jitter ±σ°, stroke taper by bracket depth.
**The angle slider is the single most rewarding knob** (dragon at 85°, plant at 15–35°).
SVG: one path per pen-down run; plants one path per bracket depth (width/opacity by depth); round joins/caps.

## 9. Space-filling curves as art (Hilbert, Peano, Gosper)

Generate via L-systems or Hilbert d2xy bit-twiddling (addressable subranges). Art moves:
- **Variable-width Hilbert:** stroke width along arc length from noise or image brightness (halftone poster).
- **Partial curves:** random contiguous index ranges with gaps.
- **Rounded corners:** quarter-circle arcs at vertices → smooth intestinal meander.
- **Gosper islands:** boundary tiles the plane hexagonally; tile 3–7 colored islands.

Order: Hilbert 4–8 (order 8 = 65k segments ≈ 1.5MB — preview at 6). Variable width: emit filled outline polygon or chunked strokes.

## 10. Maze algorithms as art

Maze = spanning tree; walls = unused edges.
- **Recursive backtracker:** long winding corridors.
- **Eller's:** row-by-row with set labels, pH/pV tune texture, infinite height.
- Also: Kruskal (uniform), Wilson (loop-erased walks), binary tree (diagonal bias ≈ structured 10 PRINT), sidewinder.

Renderings: (1) walls; (2) passages as rounded tree (neuron/root); (3) **distance field: BFS, color by dist % k or dist → hue — backtracker + distance-hue = rainbow rivers (the poster move)**. Braiding 0–0.5 removes dead ends.
SVG: merge walls into one path joining collinear runs; distance mode: quantize to ≤24 buckets, one merged path per bucket.

## 11. 10 PRINT

Per cell draw `/` or `\` with probability p. Elevations: (a) connected-component coloring by path length/hue; (b) tri/hex cells with 3 orientations; (c) **p varying across canvas via noise/gradient — texture flows**; (d) mixed glyph sets with weights.
SVG: one path (`M x y l s s`); tens of thousands of cells fine.

## 12. Hex / tri tessellations with per-cell rules

Axial coords: x = size·(√3·q + √3/2·r), y = size·(3/2·r) (pointy-top).
- **Hex Truchet:** 3 arcs pairwise connecting the 6 edge midpoints; 5 rotationally distinct non-crossing matchings; loopier than square Truchet.
- **Tri-grid half-fills:** filled/empty/corner-wedges with weights — tumbling-blocks illusions at specific weights.
- **Rotational rule tiles:** one asymmetric motif rotated per cell by 60°·k, k = (q·a + r·b) mod 6 → moiré super-patterns (a, b sliders).
- **Hex CA:** totalistic 6-neighbor rules → snowflake growths.

SVG: pre-bake rotations as separate symbols; hex arcs are exact 60°/120° `A` commands centered on hex corners; merge above ~5k cells. Loop-coloring: trace closed loops, color by circumference.

## 13. Aperiodic monotiles — hat and spectre

Hat = 8 kites of the deltoidal-trihexagonal lattice; edges alternate 1 and √3; exact in ℤ[√3]. Generated by H/T/P/F metatile substitution — transforms are combinatorial, NOT derivable from a ratio; **vendor Craig Kaplan's hatviz tables (~200 lines) or embed a precomputed patch of 500–2000 hat outlines as JSON** (ships in an hour, loses little). Spectre (Tile(1,1)): analogous, also in hatviz. Reflected hats (~1 in 7) beg to be the accent color.
Params: rounds 2–4; hat/spectre; coloring (reflected accent / metatile parent / 12 orientation hues); Tile(a,b) edge morph.

## 14. Other strong candidates

### 14a. Hitomezashi (highly recommended — trivial + gorgeous)
Column bits cᵢ, row bits rⱼ (seeded or word-encoded). Vertical dash at (i,j) iff `(j + cᵢ) mod 2 = 0`; horizontal iff `(i + rⱼ) mod 2 = 0`. Regions two-colorable: fill(i,j) = prefixXor(c,i) ⊕ prefixXor(r,j). Params: per-axis bit probability 0.3–0.7, grid 20–120, stroke/fill/both. Sashiko stitching look. "Encode a word" easter egg.

### 14b. Chair tiling
L-tromino → 4 half-size chairs (pure similarity transforms: scale ½ + rotate k·90° + translate). Iterate 4–7. Color by rotation (4 hues). Fractal herringbone with ghost diagonals.

### 14c. Ammann–Beenker (8-fold quasicrystal)
Squares + 45° rhombi, subdivision with silver ratio δ = 1+√2 (analogous to Penrose). Fresh where Penrose is familiar.

### 14d. Quadtree / Mondrian subdivision
Recursive rect splits (probability p per level, position 0.3–0.7); leaves get weighted palette colors or **nested sub-patterns from any system in this catalog — a meta-composition engine**. Depth 3–8, gutter width.

### 14e. Corner-connect glyph grids
Curated glyph set honoring one edge contract (quarter-circles, half-squares, leaves, steps); any combination composes. The generalized framework under Truchet/10 PRINT; cheapest way to add variety.

## Cross-cutting notes

- **Stable randomness:** derive per-subsystem seeds (`seed ^ hash(paramName)`) so one slider doesn't reshuffle unrelated choices — matters enormously for interactive tweaking.
- **Shared parameter block:** `{seed, width, height, margin, palette[], background, strokeWidth, density}` + per-system knobs.
- **Layering:** systems composite well (girih over quadtree color field; ECA masked to Gosper island). 2-layer blend as stretch feature.
- **Print hygiene:** viewBox in mm-true proportions, fill-rule evenodd for arc fills, 2-decimal coords, no filters/masks (rasterize in some print RIPs).

Sources: Carlson Bridges 2018 (bridges2018-39.pdf), paulbourke.net/fractals/lsys, Wikipedia L-system, preshing.com Penrose, Kaplan hat site (cs.uwaterloo.ca/~csk/hat/), Tatham quasiblog aperiodic-tilings, christianp/aperiodic-monotile.
