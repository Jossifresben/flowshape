# bookofshapes.com — competitive research and aesthetic gap analysis

> Research agent output, 2026-08-29. Method: extracted the full pattern slug list from the site's own `/api/hearts?ids=…` request (**57 patterns**, not the ~17 a homepage skim suggests), downloaded all 57 raw preview SVGs from `/previews/<slug>.svg` and parsed them programmatically (element counts, tag types, stroke-width, fill usage, clipPath/mask usage, viewBox), then opened ~14 detail pages to read their exposed parameter panels.

Evidence key: **[V]** verified on the detail page · **[S]** inferred from direct SVG inspection · **[N]** slug/tag naming only.

## The headline finding

**None of the 57 files use a gradient, filter, blur, drop-shadow, or more than one flat ink color.** Zero `linearGradient` / `radialGradient` / `<filter>` hits across the entire catalog. Every pattern styles through a single CSS custom property mapped to `currentColor`, swapped wholesale by a theme toggle.

The entire perceived quality gap is **line craft and composition, not rendering tricks** — all of it reproducible inside our pure-SVG, no-canvas constraint.

## Part 1 — What they actually have

Site tag counts (patterns carry multiple tags, so these overlap): grid 22 · radial 18 · noise 18 · flow 17 · isometric 13 · organic 9 · distortion 8 · physics 5.

Selected patterns with identified algorithms:

| Pattern | Evidence | Algorithm |
|---|---|---|
| Flow Poles | [V] | Field summed from N point charges (electric-charge singularities); streamlines traced, ~190 hairline paths. Params: Poles, Ring, Turn, Pole Core, Separation, Seed, Scatter |
| Flow Lines / Flow Dots | [S] | Same field family; Dots samples ~2,800 discrete filled dots along streamlines instead of continuous strokes |
| Interference Mesh | [V]/[S] | ~1,560 individual `<line>` micro-segments at stroke-width 0.3 forming a warped overlapping grid — moiré, not one path |
| Chevron Blocks | [V]/[S] | Isometric hex block tessellation; every block filled with tight parallel-line **hatching as a fill substitute** (476 hatch polygons), with occlusion |
| Iso Sphere | [V]/[S] | Voxel sphere: 5,616 filled cube-face polygons + edges = 11,232 elements (the site itself warns sliders may be slow). Painter's-algorithm occlusion |
| Scattered Cube Grid v3 | [V]/[S] | Solid voxel cube, cells noise-displaced/omitted for a glitched look. Params: Grid Dimension, Gap, Layers, Noise Scale, Seed, Displacement |
| Brockmann Beethoven Arcs | [V] | Named homage to Müller-Brockmann's 1955 Tonhalle poster: 7 **bold flat-filled** concentric arc bands, zero stroke. Thickness follows `(i/n)^growthExponent` |
| Joy Division | [V] | Ridgeline plot, ~29 stacked noise waveforms with hidden-line occlusion. Params: Line Count, Wave Width, Amplitude, Noise Scale X/Y, Y Spread, Envelope Sharpness |
| Halftone Sphere | [V] | 2,500 grid dots, radius modulated by Lambertian falloff — fakes a glowing sphere with zero gradients |
| Rose Mesh | [V]/[S] | Polar ring+spoke mesh warped by a rose-curve envelope into petals, dark negative-space core |
| Resonance Field | [V]/[S] | ~140 offset/rotated curves whose dense overlap reads as a woven braided rope |
| Deformed Grid Mesh II | [V]/[S] | 2,304 dots + 4,512 lines — noise-warped lattice as a dot grid (fabric/quilted look) |
| Wavy Lines Converging | [V] | 42 paths — parallel lines morphing into a frequency-swept chirp, with a vertical hatch comb as framing |
| Hiding Squares | [S] | 578 rects with 578 clipPath refs — squares mutually clipping for an occlusion illusion |
| Masked Letter Grid | [S] | Pattern clipped to a typographic mask (204 clipPath uses) |

**Overlap flags** — check visually before treating as gaps: *Modular Circle* (vs. our Times-Table Chords) and *Phyllotaxis Bloom* (vs. our Phyllotaxis).

## Part 2 — Why theirs look better (the diagnosis)

1. **Hairline strokes with `vector-effect="non-scaling-stroke"`, always.** Their fine patterns run stroke-width **0.2–1** in viewBoxes of 500–2,000 units. Ours run **2–4× heavier**: flowfield 1.1, delaunay 0.8, voronoi 1, girih 2, truchet 2.2, hitomezashi 1.6. That alone reads as cruder line quality.

2. **Two committed registers, never blended.** Every pattern is either an ultra-fine monochrome hairline field (zero fill) or bold flat-filled shapes (zero stroke). Nothing sits in the middle. **Most of our 12 default to exactly that middle** — one mid-thickness stroke, no fill — which reads as tentative next to either extreme.

3. **True occlusion, not alpha blending.** All 13 of their isometric/voxel patterns genuinely don't draw hidden geometry (painter's-algorithm sorted filled faces). **We have zero 3D/occlusion patterns** — a missing category, not a quality gap.

4. **Hatching as a fill substitute** — solid shapes filled with tightly packed parallel lines, giving crisp silhouette *and* woven texture using only strokes. We use this nowhere.

5. **Monochrome discipline.** No pattern mixes a second hue. Our `flowfield.ts` swaps every 17th line to the accent color — a small but real break from the discipline that makes their work read as considered rather than decorated.

6. **Physical motifs create focal points.** Point-charge fields, braided ropes, ripples have an inherent narrative the eye reads as *content*. Pure Perlin noise (our flowfield) is soft and uniform everywhere — nothing says "look here."

7. **Density pushed to genuine extremes.** Iso Sphere 11,232 elements; Joy Division 29. Nothing timid in the middle.

8. **Borrowed design lineage.** Naming a pattern after a canonical poster lends it authority for free.

**Not confirmed:** a systematic tight-crop house rule. Some pieces crop tight, others fill the frame edge-to-edge. Don't over-index on this.

## Part 3 — Proposed new patterns

All pure-SVG, deterministic, well under 50k elements, distinct from our 12.

1. **Coulomb Field** *(easy)* — `E(r) = Σ qᵢ(r−rᵢ)/|r−rᵢ|²`, streamlines integrated from a grid, occupancy grid to prevent overlap. Reuses `flowfield.ts`'s tracing code with a new angle function. Params: numCharges 2–6, signs, seedSpacing, maxSteps, coreRadius. ~300–800 paths. *Gives us the focal-point quality noise fields lack.* [Jobard & Lefer 1997]
2. **Braided Knot** *(medium)* — torus knot `x=(R+r·cos qt)·cos pt`, `y=(R+r·cos qt)·sin pt`, `z=r·sin qt`, p,q coprime; modulate stroke width by sign of z to fake over/under weave. [MathWorld: Torus Knot]
3. **Warped Fabric** *(easy)* — domain warping, `p' = p + amount·(fbm(p·s), fbm(p·s+offset))`, rendered as dot grid or mesh. Reuses our existing `fbm2D`. ~3,600 dots. [Quilez, "Domain Warping"]
4. **Voxel Form** *(medium–hard)* — isometric voxel lattice inside a bounding shape; `screenX=(i−k)cos30°`, `screenY=(i+k)sin30°−j`; depth-sort by `i+j+k`, painter's algorithm. **Closes the single biggest missing category.** Shell-only mode keeps counts low.
5. **Rose Lattice** *(easy–medium)* — polar ring+spoke mesh warped by `r' = r + petalDepth·cos(kθ)·(m/M)`. ~30–100 paths. [MathWorld: Rose Curve]
6. **Moiré Weave** *(easy)* — two overlaid gratings at slightly different spacing/angle; fringe period `Λ = 1/√(1/dA² + 1/dB² − 2cos(θB−θA)/(dA·dB))`. ~120–160 elements. Cheapest win here.
7. **Helix Ladder** *(easy)* — double helix with rungs, z-sign driving stroke weight. ~85 elements.
8. **Converging Chirp** *(easy)* — `φ(x) = 2π(f₀x + (f₁−f₀)x²/2W)`; lines sweep from calm order into a woven knot. Legible narrative arc. ~40–80 paths.
9. **Apollonian Circles** *(medium)* — Descartes' theorem `k₄ = k₁+k₂+k₃ ± 2√(k₁k₂+k₂k₃+k₃k₁)`, recursive tangent filling. ⚠ adjacent to the deferred circle-packing, but exact-recursive rather than relaxation-based.
10. **Dot Screen** *(easy)* — AM halftone: regular grid, `radius = rmax·√(max(0,1−d²))`. ⚠ distinct from our Stipple Field (blue-noise/FM density) — this is size-modulated on a regular grid.
11. **Brockmann Bands** *(easy)* — concentric filled arc bands, `thicknessᵢ = minT + (maxT−minT)(i/N)^growth`. **Our first pure flat-fill bold-graphic pattern**; N elements, cheapest to render.

## Part 4 — Cheapest wins on our existing patterns (ranked)

1. **Cut default stroke-widths 40–60%** and ensure `vector-effect="non-scaling-stroke"` everywhere. One constant per pattern, near-zero risk, **highest leverage available**.
2. **Drop the accent second color in `flowfield.ts`** — mark every Nth line with extra weight or opacity instead of a hue swap. Trivial diff.
3. **Pseudo-depth via width/opacity variation as standard** — extend what `diffgrowth`/`maurer`/`truchet` already do to flowfield, delaunay, voronoi, timestable, harmonograph.
4. **More negative space on radial patterns** (phyllotaxis, maurer, harmonograph, timestable) — render at ~60–70% of canvas. One constant each.
5. **Flat-fill "poster mode" for girih and truchet** — geometry already forms closed polygons; swap `fill: ink; stroke: none`. A second very different look almost free.
6. **Decouple generation area from viewBox** for crop/zoom framing — contained pipeline change, lower priority (crop wasn't a confirmed house rule).
7. **True occlusion is NOT a cheap win** — build it once properly for Voxel Form; don't retrofit onto existing patterns.
