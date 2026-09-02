# The pattern catalogue

36 generators, grouped into six families. Every one is a pure function of
`(params, seed, size)` returning an `SvgNode` tree — see
[architecture.md](architecture.md) for the contract.

This page is generated from the live registry and from the explanation
documents in `src/content/explain/`, so it cannot silently drift from the code.
Everything below — formulas, parameter lists, citations — is the same material
the app itself shows in its *Explain the math* panel, in English and Spanish.

- **Seeded** — the generator consumes `seed`, so the seed control and
  *Randomize* change the result. Unseeded patterns are fully determined by their
  parameters.
- **Heavy** — generation runs in a Web Worker rather than on the main thread.

Every pattern also carries an injected `size` parameter (0.2–1.6) scaling the
artwork inside the frame, and some carry a hidden engine-owned `phase` used by
the animated stage.

## At a glance

### Points & Meshes

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Phyllotaxis**](#phyllotaxis) | `phyllotaxis` | `points` · `angle` · `radialExp` · `dotMin` · `dotGrow` · `accentEvery` | — | — |
| [**Stipple Field**](#stipple-field) | `stipple` | `minGap` · `maxGap` · `noiseScale` · `contrast` · `dotSize` · `accentEvery` | ✓ | — |
| [**Delaunay Mesh**](#delaunay-mesh) | `delaunay` | `points` · `mode` · `strokeWidth` · `vertexSize` · `accentEvery` | ✓ | — |
| [**Voronoi Cells**](#voronoi-cells) | `voronoi` | `sites` · `inset` · `strokeWidth` · `inkEvery` · `accentEvery` | ✓ | — |
| [**Apollonian Circles**](#apollonian-circles) | `apollonian` | `maxDepth` · `minRadius` · `strokeWidth` · `fillAlternate` | — | — |
| [**Möbius Flow**](#möbius-flow) | `loxodrome` | `seeds` · `steps` · `twist` · `shrink` · `seedRadius` · `spread` · `strokeWidth` · `opacity` | — | — |
| [**Node Garden**](#node-garden) | `nodegarden` | `cell` · `jitter` · `radius` · `drift` · `dotSize` · `edgeFade` · `strokeWidth` · `opacity` | ✓ | — |

### Curves

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Maurer Rose**](#maurer-rose) | `maurer` | `n` · `d` · `strokeWidth` · `envelope` | — | — |
| [**Harmonograph**](#harmonograph) | `harmonograph` | `ratio` · `detune` · `damping` · `duration` · `strokeWidth` · `opacity` | ✓ | — |
| [**Times-Table Chords**](#times-table-chords) | `timestable` | `chords` · `multiplier` · `strokeWidth` · `opacity` · `showCircle` | — | — |
| [**Concentric Bands**](#concentric-bands) | `bands` | `bandCount` · `minThickness` · `maxThickness` · `growthExponent` · `gap` · `startAngle` · `sweepAngle` · `accentEvery` | — | — |
| [**Rose Lattice**](#rose-lattice) | `roselattice` | `petals` · `rings` · `spokes` · `petalDepth` · `innerFraction` · `strokeWidth` | — | — |
| [**Helix Ladder**](#helix-ladder) | `helix` | `turns` · `radiusFraction` · `rungEvery` · `depthFade` · `strokeWidth` | — | — |
| [**Elliptic Billiard**](#elliptic-billiard) | `billiard` | `ecc` · `launch` · `bounces` · `strokeWidth` · `opacity` · `showEllipse` | — | — |
| [**Mystery Curve**](#mystery-curve) | `mystery` | `symmetry` · `harmonics` · `falloff` · `bloom` · `layers` · `strokeWidth` · `opacity` | ✓ | — |
| [**Curlicue Fractal**](#curlicue-fractal) | `curlicue` | `alpha` · `curls` · `swell` · `waves` · `strokeWidth` · `opacity` | — | — |
| [**Guilloché Rosette**](#guilloché-rosette) | `guilloche` | `rings` · `lobes` · `depth` · `inner` · `twist` · `strokeWidth` · `opacity` | — | — |
| [**Lissajous Knot**](#lissajous-knot) | `knot` | `triple` · `tumble` · `breathe` · `depth` · `layers` · `strokeWidth` · `opacity` | ✓ | — |
| [**Hyperbolic Weave**](#hyperbolic-weave) | `hyperweave` | `symmetry` · `grain` · `wind` · `wobble` · `layers` · `strokeWidth` · `opacity` | ✓ | — |
| [**Villarceau Ribbons**](#villarceau-ribbons) | `villarceau` | `latitudes` · `fibers` · `spread` · `nest` · `pole` · `tilt` · `view` · `strokeWidth` · `opacity` | ✓ | — |

### Fields

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Flow Field**](#flow-field) | `flowfield` | `freq` · `curl` · `spacing` · `steps` · `strokeWidth` · `emphasisEvery` | ✓ | — |
| [**Coulomb Field**](#coulomb-field) | `coulomb` | `charges` · `spacing` · `steps` · `coreRadius` · `strokeWidth` · `emphasisEvery` | ✓ | — |
| [**Moiré Weave**](#moiré-weave) | `moire` | `mode` · `spacingA` · `spacingB` · `angleA` · `angleB` · `offset` · `strokeWidth` | — | — |
| [**Warped Fabric**](#warped-fabric) | `fabric` | `gridSize` · `warpAmount` · `noiseScale` · `mode` · `dotSize` · `strokeWidth` | ✓ | — |
| [**Converging Chirp**](#converging-chirp) | `chirp` | `lineCount` · `freqStart` · `freqEnd` · `amplitude` · `phaseStep` · `strokeWidth` | — | — |
| [**Line Field**](#line-field) | `linefield` | `cells` · `vortices` · `swirl` · `waviness` · `warp` · `strokeLen` · `strokeWidth` · `opacity` | ✓ | — |
| [**Interference**](#interference) | `interference` | `lines` · `sources` · `frequency` · `amplitude` · `separation` · `detune` · `strokeWidth` · `opacity` | ✓ | — |

### Tilings

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Truchet Arcs**](#truchet-arcs) | `truchet` | `cell` · `variant` · `render` · `strokeWidth` · `boldChance` · `accentChance` | ✓ | — |
| [**Hitomezashi**](#hitomezashi) | `hitomezashi` | `cell` · `bitChance` · `strokeWidth` · `fillParity` | ✓ | — |
| [**Girih Stars**](#girih-stars) | `girih` | `hexSize` · `contactAngle` · `render` · `ribbonWidth` · `strokeWidth` | — | — |
| [**Ribbon Interlace**](#ribbon-interlace) | `interlace` | `cell` · `ribbonWidth` · `ringScale` · `coreRatio` · `junctions` · `gapScale` · `strokeWidth` | — | — |

### Isometric

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Voxel Form**](#voxel-form) | `voxel` | `shape` · `dimension` · `gap` · `shellOnly` · `scatter` · `faceShading` · `depthShading` · `strokeWidth` | ✓ | — |
| [**Iso Weave**](#iso-weave) | `isoweave` | `cell` · `unit` · `armLength` · `beamWidth` · `stagger` · `render` · `hatchDensity` · `faceShading` · `strokeWidth` | — | — |
| [**Nested Shafts**](#nested-shafts) | `nested` | `cell` · `depth` · `stepRatio` · `coreSize` · `render` · `twist` · `faceShading` · `strokeWidth` | — | — |
| [**Tumbling Blocks**](#tumbling-blocks) | `tumbling` | `cell` · `flipChance` · `coherence` · `voidChance` · `render` · `hatchDensity` · `faceShading` · `strokeWidth` | ✓ | — |

### Growth

| Pattern | `id` | Parameters | Seeded | Heavy |
|---|---|---|---|---|
| [**Differential Growth**](#differential-growth) | `diffgrowth` | `iterations` · `repulsion` · `rings` · `strokeWidth` | ✓ | ✓ |

## Points & Meshes

### Phyllotaxis

`phyllotaxis` · [generator](../src/patterns/phyllotaxis.ts) · [explanation: EN](../src/content/explain/phyllotaxis.en.md) · [ES](../src/content/explain/phyllotaxis.es.md)

```
θₙ = n · α                  (α ≈ 137.50776°, the golden angle)
rₙ = s · n^p                (p = 0.5 in Vogel's original model)
s  = R / (N − 1)^p          (R = maximum radius available in the frame)
```

Every point n is placed at angle n·α and radius rₙ = s·n^p. Because α is the golden angle — the turn that splits a full circle in the golden ratio — no finite number of points ever lands back on the same ray. That single fact is the whole trick: it is what keeps a sunflower head, or this pattern, filling in without ever leaving a visible seam or a repeating spoke.

**Source.** Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4) · [reference](https://en.wikipedia.org/wiki/Phyllotaxis)

**Parameters.** `points`, `angle`, `radialExp`, `dotMin`, `dotGrow`, `accentEvery` — each one annotated in the explanation document above.

### Stipple Field

`stipple` · [generator](../src/patterns/stipple.ts) · [explanation: EN](../src/content/explain/stipple.en.md) · [ES](../src/content/explain/stipple.es.md) · seeded

```
vignette(x,y) = 1 − dist((x,y), center) / maxDist
density(x,y)  = vignette·(1 − contrast) + vignette·noise(x,y)·2·contrast     (clamped to [0,1])
gap(x,y)      = minGap + (1 − density(x,y))·(maxGap − minGap)

accept a random candidate point only if no placed point lies within gap(x,y) of it
```

This is variable-density Poisson-disc sampling: instead of one fixed minimum distance between every pair of points, the minimum gap changes from place to place according to a density field, so points pack tightly where the field is "dark" and spread out where it is "light." The version here is a naive rejection sampler rather than Bridson's original O(N) dart-throwing algorithm — it grid-accelerates neighbor lookups for speed, but otherwise it is exactly the idea Bridson describes: throw a random candidate, compute the locally-required spacing from the field, and keep the point only if nothing already placed is closer than that.

**Source.** Bridson, R. (2007) "Fast Poisson Disk Sampling in Arbitrary Dimensions", ACM SIGGRAPH 2007 Sketches · [reference](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)

**Parameters.** `minGap`, `maxGap`, `noiseScale`, `contrast`, `dotSize`, `accentEvery` — each one annotated in the explanation document above.

### Delaunay Mesh

`delaunay` · [generator](../src/patterns/delaunay.ts) · [explanation: EN](../src/content/explain/delaunay.en.md) · [ES](../src/content/explain/delaunay.es.md) · seeded

```
A triangulation T of point set P is Delaunay iff:
  no point of P lies inside the circumcircle of any triangle in T

Bowyer–Watson (incremental construction):
  start with one "super-triangle" enclosing all points
  for each point p in P:
    find every triangle whose circumcircle contains p   ("bad" triangles)
    remove them, leaving a star-shaped polygonal hole
    re-triangulate the hole by connecting p to each edge of its boundary
  discard any triangle that still touches the super-triangle
```

The defining rule — no other point may sit inside a triangle's circumcircle — sounds narrow, but it has a strong practical consequence: among every possible way to triangulate a set of points, the Delaunay triangulation is the one that avoids thin, needle-like triangles as much as possible. It maximizes the smallest angle that appears anywhere in the mesh, which is exactly why it is the standard choice for terrain meshes, low-poly art, and finite-element grids — nobody wants a sliver triangle.

**Source.** Delaunay, B. (1934) "Sur la sphère vide", Bulletin de l'Académie des Sciences de l'URSS; Bowyer, A. and Watson, D.F. (1981), independent incremental algorithms · [reference](https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm)

**Parameters.** `points`, `mode`, `strokeWidth`, `vertexSize`, `accentEvery` — each one annotated in the explanation document above.

### Voronoi Cells

`voronoi` · [generator](../src/patterns/voronoi.ts) · [explanation: EN](../src/content/explain/voronoi.en.md) · [ES](../src/content/explain/voronoi.es.md) · seeded

```
V_i = { x in the plane : |x − s_i| ≤ |x − s_j|  for every other site s_j }

each V_i is the intersection of half-planes, one per neighbor s_j,
bounded by the perpendicular bisector of the segment s_i–s_j
```

A Voronoi diagram answers one question for every point in the plane: which of the scattered sites is closest? Region V_i collects all the points for which s_i wins that contest. Because "closer to s_i than to s_j" is exactly the half of the plane on s_i's side of the perpendicular bisector between them, each cell is simply the overlap of one half-plane per neighboring site — a convex polygon carved out by straight cuts, one cut per nearby site.

**Source.** Voronoi, G. (1908) "Nouvelles applications des paramètres continus à la théorie des formes quadratiques", Journal für die reine und angewandte Mathematik 133 · [reference](https://en.wikipedia.org/wiki/Voronoi_diagram)

**Parameters.** `sites`, `inset`, `strokeWidth`, `inkEvery`, `accentEvery` — each one annotated in the explanation document above.

### Apollonian Circles

`apollonian` · [generator](../src/patterns/apollonian.ts) · [explanation: EN](../src/content/explain/apollonian.en.md) · [ES](../src/content/explain/apollonian.es.md)

```
curvature relation:
  (k₁ + k₂ + k₃ + k₄)² = 2(k₁² + k₂² + k₃² + k₄²)
  k₄ = k₁ + k₂ + k₃ ± 2√(k₁k₂ + k₂k₃ + k₃k₁)

complex-coordinate form (centres z, curvatures k):
  k₄·z₄ = k₁z₁ + k₂z₂ + k₃z₃ ± 2√(k₁k₂·z₁z₂ + k₂k₃·z₂z₃ + k₃k₁·z₃z₁)
```

Descartes' theorem says that whenever four circles are mutually tangent — each one touching the other three — their curvatures (k = 1/radius, with an *internally* tangent enclosing circle counted as negative) satisfy that fixed quadratic relation. Given any three mutually tangent circles, the relation is a quadratic in the fourth curvature, and it always has two solutions: one is the circle already known if you started from a quadruple, the other (the ± root) is the *other* circle tangent to all three — geometrically, the small gap left in the middle of any three touching circles, or the much larger circle that could enclose all three from outside. This pattern uses exactly that second-root trick to grow the whole packing: from a starting triple it computes the missing fourth circle, then treats that circle as a new member of three fresh triples and recurses.

**Source.** Descartes' Circle Theorem; complex form: Lagarias, J. C., Mallows, C. L. & Wilks, A. (2002), "Beyond the Descartes Circle Theorem", American Mathematical Monthly 109(4) · [reference](https://en.wikipedia.org/wiki/Descartes%27_theorem)

**Parameters.** `maxDepth`, `minRadius`, `strokeWidth`, `fillAlternate` — each one annotated in the explanation document above.

### Möbius Flow

`loxodrome` · [generator](../src/patterns/loxodrome.ts) · [explanation: EN](../src/content/explain/loxodrome.en.md) · [ES](../src/content/explain/loxodrome.es.md)

```
T(z) = (z − p)/(z − q)            sends the fixed points p → 0, q → ∞
M    = T⁻¹ ∘ (λ·) ∘ T,   λ = s·e^{iθ},   0 < s < 1

each circle drawn is M^u(C₀) for u = −K … K
(fractional powers λ^u extend the discrete chain to a continuous flow)
```

A Möbius transformation is built from the four simplest moves there are — shift, rotate, scale, invert — and it sends every circle to another perfect circle, in closed form, no sampling anywhere. The *loxodromic* kind has two fixed points and a complex multiplier λ that both shrinks and turns: conjugated to the origin it is just "multiply by λ", so every orbit spirals out of one fixed point and into the other along a double-armed vortex — the geometry of *Indra's Pearls*, traced back to Felix Klein's school. Each seed circle's whole orbit is computed exactly by iterating the map forward and backward, and because λ^u makes sense for fractional u, the discrete chain of circles extends to a continuous flow — the animation slides every circle one step along its own orbit per cycle, so the family maps exactly onto itself at the wrap.

**Source.** Mumford, D., Series, C. & Wright, D. (2002) "Indra's Pearls: The Vision of Felix Klein", Cambridge University Press · [reference](https://en.wikipedia.org/wiki/M%C3%B6bius_transformation)

**Parameters.** `seeds`, `steps`, `twist`, `shrink`, `seedRadius`, `spread`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Node Garden

`nodegarden` · [generator](../src/patterns/nodegarden.ts) · [explanation: EN](../src/content/explain/nodegarden.en.md) · [ES](../src/content/explain/nodegarden.es.md) · seeded

```
p(i,j) = lattice(i,j) + jitter·ξᵢⱼ + drift·N(x + ρ·cos2πph, y + ρ·sin2πph)
edge(a,b) exists  ⇔  dist(pₐ, p_b) < radius
opacity(edge) = 1 above dist = radius·(1−edgeFade), fading linearly to 0 at dist = radius
```

A random geometric graph — Gilbert's 1961 question about a scatter of points joined whenever they land within a fixed radius of each other, which produces clusters, chains and voids rather than a uniform mesh. The points themselves sit on a jittered regular lattice rather than a pure scatter, so rows and columns stay legible and it is the jitter alone that occasionally brings a pair close enough to connect; large dots and a radius held just under the lattice spacing keep most points unconnected at the defaults, so the handful of edges read as small constellations, not a network. Edges are trimmed rim-to-rim, and `edgeFade` fades a line to nothing exactly as it crosses the connection radius, so a link breaks by dimming rather than popping. The phase axis orbits a fixed closed loop in noise space, so the drift field returns exactly to where it started at the wrap.

**Source.** Gilbert, E.N. (1961) "Random Plane Networks", Journal of the Society for Industrial and Applied Mathematics 9(4), 533–543; the jittered-lattice placement, rim-to-rim edge trimming and phase-driven drift orbit are this project's own construction · [reference](https://epubs.siam.org/doi/10.1137/0109045)

**Parameters.** `cell`, `jitter`, `radius`, `drift`, `dotSize`, `edgeFade`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

## Curves

### Maurer Rose

`maurer` · [generator](../src/patterns/maurer.ts) · [explanation: EN](../src/content/explain/maurer.en.md) · [ES](../src/content/explain/maurer.es.md)

```
for k = 0 … 360:
  θ = k · d · (π/180)        (d in degrees, the walk step)
  r = R · sin(n · θ)
  point_k = (R·cosθ, R·sinθ) scaled by r
connect consecutive points with straight lines
```

Underneath everything is an ordinary rose curve, r = sin(nθ): for integer n it traces n petals if n is odd, or 2n petals if n is even, as θ sweeps around. Maurer's trick, published as a one-page curiosity in 1987, is to never draw that curve directly. Instead he samples it at 361 values of θ spaced d degrees apart — not 1 degree apart — and joins those samples with straight chords rather than following the curve between them.

**Source.** Maurer, P.M. (1987) "A Rose is a Rose...", The American Mathematical Monthly 94(7), 631–645 · [reference](https://en.wikipedia.org/wiki/Maurer_rose)

**Parameters.** `n`, `d`, `strokeWidth`, `envelope` — each one annotated in the explanation document above.

### Harmonograph

`harmonograph` · [generator](../src/patterns/harmonograph.ts) · [explanation: EN](../src/content/explain/harmonograph.en.md) · [ES](../src/content/explain/harmonograph.es.md) · seeded

```
x(t) = A1·sin(f1·t + p1)·e^(−d1·t) + A2·sin(f2·t + p2)·e^(−d2·t)
y(t) = A3·sin(f3·t + p3)·e^(−d3·t) + A4·sin(f4·t + p4)·e^(−d4·t)
t ∈ [0, T]
```

A real harmonograph is a pendulum device: two or more pendulums, each swinging at its own frequency, jointly steer a pen over paper. Each pendulum contributes one damped sine term — damped because friction bleeds energy out of a swinging pendulum, so its amplitude shrinks over time as e^(−d·t) instead of oscillating forever. This pattern sums two such terms per axis, one pair driving x and one driving y, so the pen traces whatever curve the four pendulums agree on together.

**Source.** Bourke, P. "Harmonograph"; underlying physics traces to Lissajous, J.A. (1857) · [reference](https://paulbourke.net/geometry/harmonograph/)

**Parameters.** `ratio`, `detune`, `damping`, `duration`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Times-Table Chords

`timestable` · [generator](../src/patterns/timestable.ts) · [explanation: EN](../src/content/explain/timestable.en.md) · [ES](../src/content/explain/timestable.es.md)

```
N points on a circle: P_k = (cos 2πk/N, sin 2πk/N),   k = 0 … N−1
for each k: draw a chord from P_k to P_(k·M mod N)
```

Place N points evenly around a circle and number them 0 through N−1, like a clock face. Then, for every point k, draw a straight chord to the point sitting M times as far around the circle — that position, wrapped around with a modulus, is just k·M mod N. What you're looking at is literally the times table for M, drawn as geometry instead of listed as numbers: point 7 connects to wherever "7×M" lands once you wrap past N.

**Source.** Plouffe, S. (pattern); Polster, B. and Geracitano, G., "Times Tables, Mandelbrot and the Heart of Mathematics" (Mathologer, 2019) · [reference](https://www.youtube.com/watch?v=qhbuKbxJsk8)

**Parameters.** `chords`, `multiplier`, `strokeWidth`, `opacity`, `showCircle` — each one annotated in the explanation document above.

### Concentric Bands

`bands` · [generator](../src/patterns/bands.ts) · [explanation: EN](../src/content/explain/bands.en.md) · [ES](../src/content/explain/bands.es.md)

```
thicknessᵢ = minT + (maxT − minT) · (i / (N−1))^growth      for i = 0 … N−1
r₀ᵢ = Σ_{k<i} (thicknessₖ + gap)                              (inner radius of band i)
r₁ᵢ = r₀ᵢ + thicknessᵢ                                        (outer radius of band i)
band i = filled annular sector, radii [r₀ᵢ, r₁ᵢ], angles [a₀, a₀+sweep]
```

This pattern is a direct homage to Josef Müller-Brockmann's 1955 Tonhalle poster for a Beethoven concert — one of the defining images of Swiss graphic design: nothing but a handful of bold black arcs radiating from a shared center, drawn to suggest the intensity of the music with no illustration at all. The construction here is stripped to its geometric essentials: each band is a filled annular sector — a ring segment, like a slice cut from a very fat donut — with zero stroke, so the picture reads purely as opposed flat shapes rather than outlined circles. That flat-fill approach is deliberate: everything else in this pattern set draws with strokes; this is the one built entirely from solid ink shapes.

**Source.** Müller-Brockmann, J. (1955) Tonhalle concert poster ("Beethoven") — concentric-arc design lineage; the band-thickness power law is this project's own parameterisation · [reference](https://commons.wikimedia.org/wiki/File:Josef_M%C3%BCller-Brockmann._beethoven_poster(1955).jpg)

**Parameters.** `bandCount`, `minThickness`, `maxThickness`, `growthExponent`, `gap`, `startAngle`, `sweepAngle`, `accentEvery` — each one annotated in the explanation document above.

### Rose Lattice

`roselattice` · [generator](../src/patterns/roselattice.ts) · [explanation: EN](../src/content/explain/roselattice.en.md) · [ES](../src/content/explain/roselattice.es.md)

```
θ(n) = 2π·n / spokes                             (n = 0 … spokes − 1)
t(m) = m / rings                                  (m = 0 … rings)
base(m) = innerRadius + (outerRadius − innerRadius) · t(m)
r(m,n)  = base(m) + petalDepth · cos(petals·θ(n)) · t(m)
x = cx + r·cosθ,  y = cy + r·sinθ
```

Underneath, this is an ordinary polar mesh: rings of constant radius crossed by straight spokes at even angular steps, the standard way to draw a wireframe disc. The rose curve enters as a modulation on top of that grid — the term `petalDepth · cos(petals·θ)` is exactly the classical rhodonea curve r = A·cos(k·θ), where an integer k gives k petals for odd k and 2k for even k. Rather than replacing the mesh's radius outright, that term is *added* to it, so the mesh keeps its ring-and-spoke topology while every ring bulges outward wherever cos(petals·θ) is positive and pinches inward where it is negative.

**Source.** Weisstein, E. W., "Rose", MathWorld · [reference](https://mathworld.wolfram.com/Rose.html)

**Parameters.** `petals`, `rings`, `spokes`, `petalDepth`, `innerFraction`, `strokeWidth` — each one annotated in the explanation document above.

### Helix Ladder

`helix` · [generator](../src/patterns/helix.ts) · [explanation: EN](../src/content/explain/helix.en.md) · [ES](../src/content/explain/helix.es.md)

```
t(k)  = (k / N) · turns · 2π                    (k = 0 … N)
x(t,φ) = cx + radius · cos(t + φ)
y(t)   = yTop + (t / tMax) · usableHeight
z(t,φ) = sin(t + φ)

strand A: φ = 0        strand B: φ = π
rung at k:  segment from strand A's point to strand B's point, same k
```

A helix is a curve that turns at constant angular speed around an axis while advancing at constant linear speed along it — here x and z trace the circular cross-section (cos and sin of the same angle t) while y climbs steadily down the frame as t increases. Two copies of that curve, offset by exactly π in phase, sit on opposite sides of the axis at every height: that's the double-helix construction, and because the offset is a half turn, strand B is always exactly where strand A was a half-turn ago — the two never touch but stay in constant mirrored relation, the classic ladder shape.

**Source.** Helix, parametric double-helix curve; cf. Wikipedia, "Helix" · [reference](https://en.wikipedia.org/wiki/Helix)

**Parameters.** `turns`, `radiusFraction`, `rungEvery`, `depthFade`, `strokeWidth` — each one annotated in the explanation document above.

### Elliptic Billiard

`billiard` · [generator](../src/patterns/billiard.ts) · [explanation: EN](../src/content/explain/billiard.en.md) · [ES](../src/content/explain/billiard.es.md)

```
ellipse: (x/A)² + (y/B)² = 1,   B = A·√(1 − e²)
from a boundary point, follow the ray to its next boundary hit:
  one root of the quadratic is s = 0, so the exit is  s = −2·(P·d)ₑ / (d·d)ₑ
reflect specularly:  d′ = d − 2(d·n̂)n̂,   n̂ ∝ (x/A², y/B²)
```

Roll a billiard ball inside an elliptical table and let it bounce a few hundred times, each bounce a perfect mirror reflection. The chords are all straight lines, yet they crowd along a boundary the ray never crosses — the billiard's *caustic*, and its existence is a theorem, not an accident. Elliptical billiards are integrable: besides its energy, the bouncing ray conserves the product of its angular momenta about the two foci, and that conservation pins every chord of a single orbit tangent to one fixed conic confocal with the table. A launch angle that keeps the ray outside the foci gives an elliptical caustic and a woven annulus; one that sends it between them gives a hyperbolic caustic and an hourglass. It is the same magic as the times-table chords — hundreds of straight lines conjuring a curve that exists only as their envelope — enforced here by a conservation law rather than by modular arithmetic.

**Source.** Tabachnikov, S. (2005) "Geometry and Billiards", AMS Student Mathematical Library 30 · [reference](https://en.wikipedia.org/wiki/Dynamical_billiards)

**Parameters.** `ecc`, `launch`, `bounces`, `strokeWidth`, `opacity`, `showEllipse` — each one annotated in the explanation document above.

### Mystery Curve

`mystery` · [generator](../src/patterns/mystery.ts) · [explanation: EN](../src/content/explain/mystery.en.md) · [ES](../src/content/explain/mystery.es.md) · seeded

```
z(t) = Σₕ Aₕ · e^{i(kₕt + φₕ)},   t ∈ [0, 2π]
every frequency kₕ ≡ 1 (mod m):   k ∈ {1, 1+m, 1−m, 1+2m, …}
amplitudes decay as Aₕ = 1/(1+|s|)^β,   where kₕ = 1 + m·s
```

A finite Fourier series — a point riding a circle riding a circle, each spinning at its own integer frequency — where every frequency is required to leave remainder 1 when divided by m. That congruence is Farris's one-line theorem: advancing t by one m-th of a turn multiplies every term by the same unit factor e^{2πi/m}, so the whole curve maps onto itself rotated by exactly 360/m degrees. Perfect m-fold symmetry, forced rather than tuned — and since the phases and amplitudes are completely free, every seed is a different flourish with the same flawless order. Farris called them "mystery curves" because the symmetry seems to come from nowhere; the falloff exponent decides whether the high frequencies whisper (smooth calligraphic loops) or shout (wild spiky rosettes).

**Source.** Farris, F. A. (2015) "Creating Symmetry: The Artful Mathematics of Wallpaper Patterns", Princeton University Press · [reference](https://press.princeton.edu/books/hardcover/9780691161730/creating-symmetry)

**Parameters.** `symmetry`, `harmonics`, `falloff`, `bloom`, `layers`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Curlicue Fractal

`curlicue` · [generator](../src/patterns/curlicue.ts) · [explanation: EN](../src/content/explain/curlicue.en.md) · [ES](../src/content/explain/curlicue.es.md)

```
heading:  θₙ = θₙ₋₁ + 2π·α·n              (so θₙ ≈ π·α·n², a quadratic phase)
walk:     Pₙ₊₁ = Pₙ + (cos θₙ, sin θₙ),   unit steps, n = 1 … N
N ≈ curls / α                              (the curl budget fixes the step count)
```

Walk in unit steps, but at every step turn a little more than you turned last time, the extra turn growing by the same fixed amount 2πα each step. The walk is the polygonal graph of the theta sum Σ e^{πiαn²} — Fresnel diffraction's discrete cousin, locally forever tracing Euler spirals — and everything on screen is decided by the continued-fraction personality of the single number α: rationals close into periodic crystals, √2−1 chains identical seahorse curls, the golden ratio lays the most uniform lace, and π−3, whose expansion opens with the enormous term 292, marches in long straight avenues before deigning to curl. Berry and Goldberg showed the structure is self-similar under renormalisation: the curls of curls obey the same rule with a transformed α, driven by the same Gauss map that drives continued fractions.

**Source.** Berry, M. V. & Goldberg, J. (1988) "Renormalisation of curlicues", Nonlinearity 1 · [reference](https://mathworld.wolfram.com/CurlicueFractal.html)

**Parameters.** `alpha`, `curls`, `swell`, `waves`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Guilloché Rosette

`guilloche` · [generator](../src/patterns/guilloche.ts) · [explanation: EN](../src/content/explain/guilloche.en.md) · [ES](../src/content/explain/guilloche.es.md)

```
ring k of K:  r(t) = baseₖ + A·cos(q·t + k·Δχ),   t ∈ [0, 2π]
point (r·cos t, r·sin t);   q an integer, so every ring closes exactly
baseₖ spans the band from inner to outer radius
Δχ = twist · 2π/q,   the lobe-phase advance from ring to ring
```

Guilloché is the machine-turned engraving of bank notes, passports and watch dials, cut since the 18th century on a rose engine — a lathe whose rosette cams push the cutting tool in and out as the workpiece turns. Each pass of the tool is one ring: a circle whose radius breathes sinusoidally, q lobes per revolution, closing on itself exactly because q is a whole number. The craft is in the stack: cut K rings from inner to outer radius and advance the lobe phase by a fixed twist between passes, and adjacent rings' crests and troughs interleave until the eye stops seeing rings at all — it sees woven metal, diamond lattices, flowing channels, structure that exists nowhere in the ink, only in the interference between phase-shifted cosines. A cousin of the moiré effect, engineered rather than accidental — which is why forgers hated it.

**Source.** Rose engine turning and the guilloché tradition; hypotrochoid ring construction · [reference](https://en.wikipedia.org/wiki/Guilloch%C3%A9)

**Parameters.** `rings`, `lobes`, `depth`, `inner`, `twist`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Lissajous Knot

`knot` · [generator](../src/patterns/knot.ts) · [explanation: EN](../src/content/explain/knot.en.md) · [ES](../src/content/explain/knot.es.md) · seeded

```
x(t) = cos(n₁t + φ₁),  y(t) = cos(n₂t + φ₂),  z(t) = cos(n₃t + φ₃),   t ∈ [0, 2π]
(n₁, n₂, n₃) pairwise coprime; phases resampled off the singular set
nᵢφⱼ − nⱼφᵢ ≡ 0 (mod π); projection split into depth bands, near strands
wider and more opaque
```

A Lissajous figure with a third axis: one cosine per coordinate, integer frequencies. Integrality forces the curve to close after exactly one period, and pairwise coprimality forces it to be a genuine space curve rather than a multiple cover of a shorter one — Bogle, Hearst, Jones and Stoilov showed in 1994 that many of these closed curves are knots in the strict sense. The phases are free, drawn per seed but resampled away from the singular set where the projection folds onto a doubly-traced arc, so every seed is a flourish and none a scribble. The rendering is this project's own construction: the projected curve is cut into depth bands drawn from far to near, farther strands thin and faint, so the knot's over-and-under reads as a made object rather than a flat tangle.

**Source.** Bogle, M.G.V., Hearst, J.E., Jones, V.F.R. & Stoilov, L. (1994) "Lissajous knots", Journal of Knot Theory and Its Ramifications 3(2), 121–140; the depth-banded projection and its motions are this project's own construction · [reference](https://en.wikipedia.org/wiki/Lissajous_knot)

**Parameters.** `triple`, `tumble`, `breathe`, `depth`, `layers`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Hyperbolic Weave

`hyperweave` · [generator](../src/patterns/hyperweave.ts) · [explanation: EN](../src/content/explain/hyperweave.en.md) · [ES](../src/content/explain/hyperweave.es.md) · seeded

```
B = symmetry · grain points on the rim:  Pⱼ at θⱼ = 2πj/B + ripple(j)
walk j → j + δ (mod B), δ coerced to the nearest integer coprime with B
geodesic u → v: circle orthogonal to the rim — centre (u+v)/(1+u·v),
radius √((1−u·v)/(1+u·v));  ripple is exactly (B/m)-periodic in j
```

A single closed walk of hyperbolic geodesics in the Poincaré disk. Each edge of the walk is drawn as the true hyperbolic straight line between its endpoints — the circular arc meeting the rim at right angles — so ink piles up near the boundary the way Escher's *Circle Limit* figures shrink toward theirs. Two theorems keep it orderly: the coprime coercion of the step forces the walk to visit all B rim points before closing (one continuous line, by arithmetic), and the seed's ripple is exactly (B/m)-periodic in the point index, cutting the full rotational symmetry down to exactly m-fold rather than approximately. A cap holds the step under ~0.25·B, because steps near B/2 join near-diametral pairs whose geodesics flatten into straight chords — the hyperbolic look survives every value the controls can reach.

**Source.** Poincaré disk model of the hyperbolic plane; Coxeter, H.S.M. (1979) "The Non-Euclidean Symmetry of Escher's Picture 'Circle Limit III'", Leonardo 12; the closed coprime walk and its rippled symmetry are this project's own construction · [reference](https://en.wikipedia.org/wiki/Poincar%C3%A9_disk_model)

**Parameters.** `symmetry`, `grain`, `wind`, `wobble`, `layers`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Villarceau Ribbons

`villarceau` · [generator](../src/patterns/villarceau.ts) · [explanation: EN](../src/content/explain/villarceau.en.md) · [ES](../src/content/explain/villarceau.es.md) · seeded

```
fiber over p ∈ S³:      { p·e^{iτ} : τ ∈ [0, 2π) }
Hopf map:                h(p) = p·i·p̄  ∈ S²
stereographic proj.:     S³ \ {pole} → ℝ³
rotation, one parameter: R(φ): p ↦ q(φ)·p,
                          q(φ) = cos(πφ) + sin(πφ)·n,  n a unit pure quaternion
                          R(1) = −I  (the antipodal map)
```

The 3-sphere partitions into great circles — the fibers of Hopf's 1931 map to the ordinary sphere S² — and stereographic projection sends every fiber to an exact circle in space. Fibers over one latitude of S² form a torus of Villarceau circles, so nested latitudes give nested tori of linked rings. The motion is not chosen by eye: a one-parameter SO(4) rotation always carries fibers to fibers, and at φ = 1 it becomes the antipodal map, which is a half-turn within every fiber's own circle — the loop closes by the group law, the same standard held for knot's coprime frequencies and mystery's Farris congruence.

**Source.** Hopf, H. (1931) "Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche", Mathematische Annalen 104, 637–665; the ribbon reparametrisation and the SO(4) motion are this project's own construction · [reference](https://en.wikipedia.org/wiki/Hopf_fibration)

**Parameters.** `latitudes`, `fibers`, `spread`, `nest`, `pole`, `tilt`, `view`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

## Fields

### Flow Field

`flowfield` · [generator](../src/patterns/flowfield.ts) · [explanation: EN](../src/content/explain/flowfield.en.md) · [ES](../src/content/explain/flowfield.es.md) · seeded

```
angle(x, y) = noise2D(x·freq, y·freq) · π · curl
x += cos(angle) · stepLen
y += sin(angle) · stepLen     (Euler integration)
```

A flow field is a direction assigned to every point in the plane — here, that direction comes from sampling a noise function at each location and turning the result into an angle. A particle dropped anywhere just keeps stepping in whatever direction the field points at its current position, tracing a curve that bends wherever the underlying noise bends. Because the noise field itself is smooth and continuous, nearby particles trace nearly parallel curves, and the whole canvas fills with lines that feel like a single coherent current rather than independent scribbles — the same logic as iron filings settling along magnetic field lines.

**Source.** Hobbs, T. (2020) "Flow Fields"; streamline separation rule after Jobard, B. and Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density" · [reference](https://www.tylerxhobbs.com/words/flow-fields)

**Parameters.** `freq`, `curl`, `spacing`, `steps`, `strokeWidth`, `emphasisEvery` — each one annotated in the explanation document above.

### Coulomb Field

`coulomb` · [generator](../src/patterns/coulomb.ts) · [explanation: EN](../src/content/explain/coulomb.en.md) · [ES](../src/content/explain/coulomb.es.md) · seeded

```
E(r) = Σᵢ qᵢ (r − rᵢ) / |r − rᵢ|²          (n point charges qᵢ ∈ {+1, −1} at positions rᵢ)

step:  r ← r + h · E(r) / |E(r)|            (unit-speed streamline integration)
```

Every point in the plane has a field vector: the sum of the pull or push from every charge, each contributing a vector that points toward it (if negative) or away from it (if positive), weighted inversely by the square of the distance — the same inverse-square law that governs real electrostatics. A streamline is what you get by dropping a test point anywhere and letting it walk, one small step at a time, always in the direction the local field points. Because charges alternate sign around a jittered ring, most streamlines curve away from a positive charge and arc toward the nearest negative one, tracing the same field-line loops you'd see in a textbook diagram of two opposite point charges — except here there are many charges, and hundreds of independent streamlines seeded across the frame trace out the whole shape of the field at once.

**Source.** Jobard, B. & Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density", Visualization in Scientific Computing '97 (field is the classic 2D electrostatic point-charge field) · [reference](https://link.springer.com/chapter/10.1007/978-3-7091-6876-9_5)

**Parameters.** `charges`, `spacing`, `steps`, `coreRadius`, `strokeWidth`, `emphasisEvery` — each one annotated in the explanation document above.

### Moiré Weave

`moire` · [generator](../src/patterns/moire.ts) · [explanation: EN](../src/content/explain/moire.en.md) · [ES](../src/content/explain/moire.es.md)

```
Λ = 1 / √( 1/dA² + 1/dB² − 2·cos(θB − θA) / (dA·dB) )      (fringe period)

grating A: parallel lines, spacing dA, angle θA
grating B: parallel lines, spacing dB, angle θB
(circle mode: two families of concentric circles, spacings dA/dB, centers offset by `offset`)
```

Two gratings are drawn independently, each a plain set of evenly spaced parallel lines, and simply overlaid. Neither grating alone contains any large-scale structure — but wherever the two nearly line up, the eye reads a bright band, and wherever they nearly cancel, a dark one. That banding, the moiré fringe, is not drawn by anything in the code; it's a pure interference artifact of superimposing two periodic structures, exactly the effect you see when two window screens or two sheer curtains overlap. The Λ formula predicts the spacing of those fringes from nothing but the two gratings' own periods and the angle between them.

**Source.** Amidror, I. (2000) "The Theory of the Moiré Phenomenon, Volume I: Periodic Layers" · [reference](https://link.springer.com/book/10.1007/978-1-84882-181-1)

**Parameters.** `mode`, `spacingA`, `spacingB`, `angleA`, `angleB`, `offset`, `strokeWidth` — each one annotated in the explanation document above.

### Warped Fabric

`fabric` · [generator](../src/patterns/fabric.ts) · [explanation: EN](../src/content/explain/fabric.en.md) · [ES](../src/content/explain/fabric.es.md) · seeded

```
s   = noiseScale / min(W, H)
x'  = x + warpAmount · fbm(x·s, y·s)
y'  = y + warpAmount · fbm(x·s + 5.2, y·s + 1.3)

fbm(x, y) = Σₒ noiseₒ(x·2ᵒ, y·2ᵒ) / 2ᵒ   (o = 0, 1 — two octaves, normalised)
```

Start with a plain regular grid of gridSize × gridSize points. Domain warping — Quílez's term for it — does not distort the grid directly; it displaces each point by *evaluating noise at that point's own position* and using the two returned values as an offset vector. The two noise samples are taken at positions separated by a fixed jitter (`+5.2`, `+1.3`) purely so the x- and y-offsets decorrelate: without that offset the whole grid would just breathe uniformly in one diagonal direction instead of billowing.

**Source.** Quílez, I. (2002), "Domain Warping" · [reference](https://iquilezles.org/articles/warp/)

**Parameters.** `gridSize`, `warpAmount`, `noiseScale`, `mode`, `dotSize`, `strokeWidth` — each one annotated in the explanation document above.

### Converging Chirp

`chirp` · [generator](../src/patterns/chirp.ts) · [explanation: EN](../src/content/explain/chirp.en.md) · [ES](../src/content/explain/chirp.es.md)

```
u    = (x − margin) / W                        (u ∈ [0, 1] across the frame)
φ(u) = 2π · ( freqStart·u + (freqEnd − freqStart)·u² / 2 )
env(u) = amplitude · (0.06 + 0.94·u²)
y(u) = row_i + env(u) · sin( φ(u) + i·phaseStep )
```

Each of the lineCount rows is a sine wave, but not one of constant pitch: φ(u) is the phase of a *linear chirp* — a signal whose instantaneous frequency ramps linearly from freqStart to freqEnd as u runs left to right. Differentiating φ(u) with respect to u gives exactly that ramp, `freqStart + (freqEnd − freqStart)·u`; the u² term in the phase is simply what integrating a linearly rising frequency produces. It's the same construction used in radar and audio chirps, laid out horizontally instead of played back in time.

**Source.** Linear (frequency-swept) chirp signal; cf. Wikipedia, "Chirp" · [reference](https://en.wikipedia.org/wiki/Chirp)

**Parameters.** `lineCount`, `freqStart`, `freqEnd`, `amplitude`, `phaseStep`, `strokeWidth` — each one annotated in the explanation document above.

### Line Field

`linefield` · [generator](../src/patterns/linefield.ts) · [explanation: EN](../src/content/explain/linefield.en.md) · [ES](../src/content/explain/linefield.es.md) · seeded

```
V(x,y) = swirl · Σᵢ (−Δyᵢ, Δxᵢ) · sᵢ · exp(−|Δᵢ|² / 2σᵢ²)          (vortices)
         + waviness · Σⱼ (kyⱼ, −kxⱼ) · Aⱼ · cos(kxⱼ·x + kyⱼ·y + φⱼ)  (curl waves)
evaluated at x′ = x + warp·N₁(x,y), y′ = y + warp·N₂(x,y)           (domain warp)
θ(x,y) = atan2(Vy, Vx)                                              (stroke orientation)
```

A fixed grid of short strokes, each oriented by a vector field built entirely from curls: every vortex term is the curl of a Gaussian bump and every wave term the curl of a plane sinusoid, and the curl of any scalar function is divergence-free by identity — no sources, no sinks, so the field can only swirl and neighbouring strokes agree by construction, not by tuning. Vortices set the broad counter-rotating structure; curl waves layer smaller local bending on top; a domain warp — Quílez's technique, the same one this project uses for the warped fabric — bends the coordinates first, which is what keeps the vortices from reading as perfect compass circles. Only orientation moves with phase; the grid itself, and therefore the stroke count, never changes.

**Source.** Stream function formulation of a divergence-free 2D vector field (classical vector calculus; cf. the Helmholtz decomposition); domain warping after Quílez, I. (2002) "Domain Warping"; the vortex/curl-wave field composition and its phase motion are this project's own construction · [reference](https://en.wikipedia.org/wiki/Stream_function)

**Parameters.** `cells`, `vortices`, `swirl`, `waviness`, `warp`, `strokeLen`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

### Interference

`interference` · [generator](../src/patterns/interference.ts) · [explanation: EN](../src/content/explain/interference.en.md) · [ES](../src/content/explain/interference.es.md) · seeded

```
Sᵢ = sources on the frame's centre-line, `separation` apart, symmetric about the vertical axis
kᵢ = frequency · (1 + detune · i)
z(x,y) = Σᵢ sin( kᵢ · dist((x,y), Sᵢ) + φᵢ )
y(x) = row_y + z(x, row_y) · amplitude
```

A bed of horizontal lines bent vertically by the summed field of two (or three) circular wave sources. With equal wavenumbers, the set of points sharing a fixed path-length difference from two fixed foci is a hyperbola by definition, so the bright and dark fringes sit exactly on the hyperbola family with foci at the sources — forced by the distance-field geometry, not tuned. At the default register the sources sit far off-canvas and the displacement is large enough that neighbouring lines cross and stay crossed, braiding under a translucent stroke into luminous ribbons; dropping the line count and amplitude relaxes the same geometry to a calmer, non-crossing sweep. `detune` breaks the equal-wavenumber premise so the fringes visibly drift, while each source's phase still advances an integer number of turns per cycle, keeping the whole field exactly one-periodic regardless.

**Source.** Two-source wave interference — the phase-difference argument fixing the fringes to the hyperbola family with foci at the sources is classical wave physics; cf. Wikipedia, "Wave interference"; the horizontal-line displacement rendering and its composition are this project's own construction · [reference](https://en.wikipedia.org/wiki/Wave_interference)

**Parameters.** `lines`, `sources`, `frequency`, `amplitude`, `separation`, `detune`, `strokeWidth`, `opacity` — each one annotated in the explanation document above.

## Tilings

### Truchet Arcs

`truchet` · [generator](../src/patterns/truchet.ts) · [explanation: EN](../src/content/explain/truchet.en.md) · [ES](../src/content/explain/truchet.es.md) · seeded

```
grid of s×s cells, cols × rows over the frame
each cell: flip ← seeded coin toss

diagonal variant (1704): split the cell along one diagonal;
  flip = true  → fill the upper-left triangle
  flip = false → fill the lower-right triangle

arc variant (Smith, 1987): two quarter-circle arcs, radius s/2,
  each joining the midpoints of two adjacent sides;
  flip picks which pair of opposite corners the arcs curve around
```

Truchet's original 1704 memoir asked a deceptively small question: what happens if you take one asymmetric tile and drop a copy, randomly rotated, into every cell of a grid? His tile was a square cut in half along the diagonal, one triangle inked in. With only two effective orientations per cell (rotating a half-filled square by 180° gives the same picture as flipping it), a coin toss per cell is the entire generator — no two neighboring cells "know" about each other, yet global structure emerges from the sheer statistics of adjacency.

**Source.** Truchet, S. (1704) "Mémoire sur les combinaisons"; arc variant popularized by Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4) · [reference](https://en.wikipedia.org/wiki/Truchet_tiles)

**Parameters.** `cell`, `variant`, `render`, `strokeWidth`, `boldChance`, `accentChance` — each one annotated in the explanation document above.

### Hitomezashi

`hitomezashi` · [generator](../src/patterns/hitomezashi.ts) · [explanation: EN](../src/content/explain/hitomezashi.en.md) · [ES](../src/content/explain/hitomezashi.es.md) · seeded

```
cᵢ, rⱼ ∈ {0, 1}                    for each column i, each row j (seeded coin)

vertical dash at column i, row j    iff (j + cᵢ) mod 2 = 0
horizontal dash at row j, column i  iff (i + rⱼ) mod 2 = 0

region parity: fill(i, j) = prefixXor(c, i) ⊕ prefixXor(r, j)
```

Hitomezashi ("one stitch") is a running-stitch sashiko technique: a needle enters and exits along a grid, and each row or column of stitches is offset by whether it starts on an odd or even square. The mathematics behind it is almost embarrassingly simple — flip one coin per column and one coin per row, then place a dash wherever a row-index-plus-column-bit parity check comes out even. That single rule, applied independently to every column for the vertical dashes and every row for the horizontal ones, is the entire generator. No dash placement ever looks at its neighbors; the pattern's long walls, zigzags, and enclosed loops all emerge purely from how the fixed per-line bits interact as you scan across the grid.

**Source.** Seaton, K.A. (2023) "Mathematical specification of hitomezashi designs", Journal of Mathematics and the Arts 17(1-2) · [reference](https://arxiv.org/abs/2208.12580)

**Parameters.** `cell`, `bitChance`, `strokeWidth`, `fillParity` — each one annotated in the explanation document above.

### Girih Stars

`girih` · [generator](../src/patterns/girih.ts) · [explanation: EN](../src/content/explain/girih.en.md) · [ES](../src/content/explain/girih.es.md)

```
base tiling: hexagonal grid, hex size S
for each hexagon, edge k has midpoint Mₖ, unit edge direction Eₖ, inward normal Nₖ

ray from Mₖ, direction  E_k·cosθ + N_k·sinθ           (θ = contact angle)
ray from M_{k+1}, direction −E_{k+1}·cosθ + N_{k+1}·sinθ

P = intersection of the two rays
girih segment: Mₖ → P → M_{k+1}                        (for every adjacent edge pair)
```

This is not a closed-form curve — it's a construction rule, and it's the one E.H. Hankin documented in 1925 after studying Islamic geometric patterns: "polygons in contact." Start from an ordinary tiling (here, a hexagon grid) and discard it once you're done — it only exists to anchor the construction. At the midpoint of every polygon edge, fire two rays into the interior, tilted away from the edge by a fixed contact angle θ instead of running straight in. Where the ray launched from one edge meets the ray launched from its neighbor, that intersection becomes a sharp point; connecting midpoint → point → midpoint for every pair of adjacent edges traces out the interlaced star-and-strap motif that reads as "Islamic geometric pattern" at a glance.

**Source.** Hankin, E.H. (1925) "The Drawing of Geometric Patterns in Saracenic Art", Memoirs of the Archaeological Survey of India; construction formalized by Kaplan, C.S. (2005) "Islamic Star Patterns from Polygons in Contact" · [reference](https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf)

**Parameters.** `hexSize`, `contactAngle`, `render`, `ribbonWidth`, `strokeWidth` — each one annotated in the explanation document above.

### Ribbon Interlace

`interlace` · [generator](../src/patterns/interlace.ts) · [explanation: EN](../src/content/explain/interlace.en.md) · [ES](../src/content/explain/interlace.es.md)

```
honeycomb, pointy-top axial coords (q, r), hexagon circumradius S:
  C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
  u_k    = ( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5
  V_k    = C + S·u_k          honeycomb vertex, valence 3
  P_k    = C + rs·S·u_k       ring corner        (rs = ringScale)

bipartite class of a corner:  class(V_k) = k mod 2   (same from all 3 faces)
  k even (sublattice A): ring over arm  → cut the arm
  k odd  (sublattice B): arm over ring  → cut the ring

crossing angle is a constant θ = 60°; band width W = ribbonWidth·S
  gap half-length  t₀ = ( W/2 + (W/2)·cos θ ) / sin θ  ·  gapScale
  t_ring = min(t₀, 0.4·edge),   edge = rs·S
  arm run  d = (1 − rs)·S,  length L = d + 0.5·t_ring + 0.7·W
  t_arm  = min(t₀, 0.4·L)

band = one ink stroke of width W, overdrawn by a paper stroke of width core·W
```

Two families of strand are drawn, and only two. Every hexagonal face of the honeycomb carries a closed hexagonal ring, shrunk to `ringScale` of the face. Every honeycomb *vertex* — a corner shared by three faces — carries a Y-shaped tri-radiate strand whose three arms run inward along the three face bisectors and cross the three rings around it. That is the whole cast: rings and Ys, on a lattice, forever.

**Source.** Celtic knotwork construction (Cromwell, P.R., 1993, "Celtic Knotwork: Mathematical Art", The Mathematical Intelligencer 15(1), 36–47); the free over/under rests on the honeycomb graph being bipartite — a graph is bipartite iff it contains no odd cycle (Kőnig, D., 1916) · [reference](https://doi.org/10.1007/BF03025256)

**Parameters.** `cell`, `ribbonWidth`, `ringScale`, `coreRatio`, `junctions`, `gapScale`, `strokeWidth` — each one annotated in the explanation document above.

## Isometric

### Voxel Form

`voxel` · [generator](../src/patterns/voxel.ts) · [explanation: EN](../src/content/explain/voxel.en.md) · [ES](../src/content/explain/voxel.es.md) · seeded

```
isometric projection (unit cube, edge s = 1):
  w = (s·√3) / 2,  h = s / 2,  v = s
  screenX(i,j,k) = (i − k)·w
  screenY(i,j,k) = (i + k)·h − j·v

painter's-algorithm depth key:
  depth(i,j,k) = i + j + k
  draw cells in ascending order of depth  (farthest first, nearest last)
```

Every voxel sits at an integer lattice coordinate (i, j, k) inside a bounding shape — a sphere (i²+j²+k² ≤ D²), a cube (unconditional), or a torus (a ring implicit surface in i,k with thickness in j). Isometric projection flattens that 3D lattice to 2D by projecting along the cube diagonal, which is why the three visible cube faces (top, left, right) all draw as parallelograms of the same size and the whole form reads as "solid" without any true perspective distortion — it's the standard axonometric convention used in isometric pixel art and CAD wireframes alike.

**Source.** Isometric projection; painter's algorithm (Newell, Newell & Sancha, 1972, "A Solution to the Hidden Surface Problem") · [reference](https://en.wikipedia.org/wiki/Painter%27s_algorithm)

**Parameters.** `shape`, `dimension`, `gap`, `shellOnly`, `scatter`, `faceShading`, `depthShading`, `strokeWidth` — each one annotated in the explanation document above.

### Iso Weave

`isoweave` · [generator](../src/patterns/isoweave.ts) · [explanation: EN](../src/content/explain/isoweave.en.md) · [ES](../src/content/explain/isoweave.es.md)

```
isometric projection (cell size c — identical to voxel):
  W = (c·√3) / 2
  screenX(i,j,k) = cx + (i − k)·W
  screenY(i,j,k) = cy + ((i + k)/2 − j)·c

unit origins, with  A = (1,−1,0),  B = (0,1,−1),  a = m+n,  b = m−n:
  δ(m,n) = (m + n) mod stagger
  O(m,n) = m·A + n·B + δ·(1,1,1)

  proj(O) = (cx + a·W,  cy + 1.5·b·c)        ← δ does not appear,
  because  proj(1,1,1) = (0, 0)

painter's-algorithm key (box centre, drawn in ascending order):
  depth = (i₀ + sᵢ/2) + (j₀ + s_j/2) + (k₀ + s_k/2)

disjointness clamp on arm length L, beam section w:
  L ≤ (stagger ≥ 3 ? 2 : 1) − w
  chevron with even stagger:  L ≤ (3 − w) / 2
```

The motif is a small assembly of square-section beams meeting at a shared corner cube: a tripod (three arms leaving the corner along +i, +j, +k), an elbow (two perpendicular arms, with the axis triple cyclically rotated by *a* mod 3 so successive columns herringbone), or a chevron (two collinear arms split by the corner collar — a butt joint, not a mitre, because collinear beams meet at no angle for a mitre to bisect). One copy of that motif is placed at every point of the triangular lattice generated by A and B, and the whole field is projected isometrically. There is no randomness anywhere: the picture is a pure function of the parameters, which is why the pattern declares `usesSeed: false` and the file imports no PRNG at all.

**Source.** Isometric projection; painter's algorithm (Newell, Newell & Sancha, 1972, "A Solution to the Hidden Surface Problem"); 3-colouring of the triangular lattice · [reference](https://en.wikipedia.org/wiki/Painter%27s_algorithm)

**Parameters.** `cell`, `unit`, `armLength`, `beamWidth`, `stagger`, `render`, `hatchDensity`, `faceShading`, `strokeWidth` — each one annotated in the explanation document above.

### Nested Shafts

`nested` · [generator](../src/patterns/nested.ts) · [explanation: EN](../src/content/explain/nested.en.md) · [ES](../src/content/explain/nested.es.md)

```
pointy-top hexagon of circumradius S about centre C:
  V_k = C + S·(cos(−π/2 + kπ/3), sin(−π/2 + kπ/3)),   k = 0…5

its three 60°/120° rhombi — exactly the three visible faces
of an isometric unit cube of edge S:
  top   = (C, V₅, V₀, V₁)
  right = (C, V₁, V₂, V₃)
  left  = (C, V₃, V₄, V₅)

rhombille lattice, axial coordinates (q, r):
  C(q,r) = (S·√3·(q + r/2),  S·1.5·r)

ring n = 0 … depth−1, of one rhombus:
  outer scale  sₙ = ratio ⁿ        inner scale  sₙ·ratio
  band = quad(C, A, M, B) at sₙ  +  quad(C, B, M, A) at sₙ·ratio
                                    ↑ reversed winding ⇒ a hole
                                      under fill-rule="nonzero"

fill parity:   ink  ⇔  (n + (twist ? f : 0)) mod 2 = 0
core cube:     scale = min(coreSize, 0.8 · ratio^depth)
```

Start with the fact that makes the whole picture legible. Under isometric projection a unit cube's three visible faces each map to a rhombus of unit side with angles 60° and 120°, and those three rhombi share the projected corner vertex. Their union is not merely hexagon-*ish*: it is exactly a regular hexagon of circumradius equal to the cube's edge. That identity is why the rhombille tiling — the dual of the trihexagonal tiling, known to quilters as "tumbling blocks" — reads as a wall of stacked cubes rather than as a field of diamonds, and it is why the tiling supports the classic Necker-cube flip where the same drawing reads convex or concave depending on which rhombus you take as the top face. This file inherits the identity from the voxel pattern's projection deliberately: face 0 here is voxel's top face, face 1 its +x, face 2 its −x, and the core cube's tones follow the same assignment so a core shades the way a voxel cube shades.

**Source.** Rhombille ("tumbling blocks") tiling, the dual of the trihexagonal tiling — Grünbaum, B. & Shephard, G.C. (1987) "Tilings and Patterns"; nonzero winding rule, W3C SVG 1.1 §11.3 "fill-rule" · [reference](https://en.wikipedia.org/wiki/Rhombille_tiling)

**Parameters.** `cell`, `depth`, `stepRatio`, `coreSize`, `render`, `twist`, `faceShading`, `strokeWidth` — each one annotated in the explanation document above.

### Tumbling Blocks

`tumbling` · [generator](../src/patterns/tumbling.ts) · [explanation: EN](../src/content/explain/tumbling.en.md) · [ES](../src/content/explain/tumbling.es.md) · seeded

```
pointy-top hex lattice, hexagon circumradius S, axial coords (q, r):
  C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
  V_k    = C + S·( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5

rhombille split — three rhombi, each  C + a·e₁ + b·e₂  with a, b ∈ [0,1]:
  top    e₁ = V₅ − C,  e₂ = V₁ − C        corners C, V₅, V₀, V₁
  right  e₁ = V₁ − C,  e₂ = V₃ − C        corners C, V₁, V₂, V₃
  left   e₁ = V₃ − C,  e₂ = V₅ − C        corners C, V₃, V₄, V₅

tone triple, ordered ascending in ink (s = faceShading):
  T = [ 1 − 0.75·s,  1 − 0.45·s,  1 ]
  tone(face i) = i        (cube out)
               = 2 − i    (cube in — the same triple, reversed)

flip decision per hexagon, ξ a white-noise draw, c = coherence:
  u = (1 − c)·ξ + c·( 0.5 + 0.5·fbm(κ·x, κ·y) ),   κ = 3 / min(w, h)
  flipped ⇔ u < flipChance

hatch mode — chords b = const, a: 0 → 1, rhombus height |e₂ × ê₁| = (√3/2)·S
  spacing(tone) = max( S / (hatchDensity · T[tone]),  2·strokeWidth )
```

The tiling is the rhombille: take a pointy-top hexagonal lattice and split every hexagon into three congruent 60°/120° rhombi meeting at its centre. Grünbaum and Shephard catalogue it as the Laves tiling [3.6.3.6], the dual of the trihexagonal (kagome) tiling; quilters have called it "tumbling blocks" for two centuries. It is monohedral — one rhombus, repeated — and edge-to-edge: three rhombi meet at each 120° corner, six at each 60° corner, with no gaps and no overlaps anywhere.

**Source.** Rhombille tiling ("tumbling blocks", "reversible cubes"), the Laves tiling [3.6.3.6] dual to the trihexagonal tiling (Grünbaum, B. & Shephard, G.C., 1987, "Tilings and Patterns", tiling P4-42); reversible-cube ambiguity (Necker, L.A., 1832, "Observations on some remarkable optical phænomena seen in Switzerland; and on an optical phænomenon which occurs on viewing a figure of a crystal or geometrical solid", London and Edinburgh Philosophical Magazine 1(5), 329–337) · [reference](https://en.wikipedia.org/wiki/Rhombille_tiling)

**Parameters.** `cell`, `flipChance`, `coherence`, `voidChance`, `render`, `hatchDensity`, `faceShading`, `strokeWidth` — each one annotated in the explanation document above.

## Growth

### Differential Growth

`diffgrowth` · [generator](../src/patterns/diffgrowth.ts) · [explanation: EN](../src/content/explain/diffgrowth.en.md) · [ES](../src/content/explain/diffgrowth.es.md) · seeded · heavy (worker)

```
closed polyline of nodes n₀ … n_{m-1}
per iteration, for each node nᵢ (prev = n_{i-1}, next = n_{i+1}):

  attract = k_a · (midpoint(prev, next) − nᵢ)
  repel   = Σ_{j: |nᵢ−nⱼ| < R}  (1 − d/R) · (nᵢ − nⱼ) / d       (d = |nᵢ − nⱼ|, R = repulsion radius)
  nᵢ ← nᵢ + clamp(attract + repel + noise)

split edge (nᵢ, n_{i+1}) if |nᵢ − n_{i+1}| > dMax   (insert midpoint)
merge edge (nᵢ, n_{i+1}) if |nᵢ − n_{i+1}| < dMin   (drop nᵢ)
```

Start with a closed loop of points and run two opposing forces on it, every frame, forever. Attraction pulls each point toward the midpoint of its two neighbors — left alone, this force alone would just smooth the loop into a plain circle and shrink it to a point. Repulsion works against that: it pushes each point away from any other point on the loop that has drifted within the repulsion radius R, whether or not that point is an actual neighbor on the curve. That's the crucial detail — repulsion doesn't care about the loop's topology, only physical proximity, so as the curve gets crowded it has to buckle outward to relieve the pressure, since it can no longer simply shrink.

**Source.** Webb, J. "2D Differential Growth Experiments" (ongoing since 2018) · [reference](https://github.com/jasonwebb/2d-differential-growth-experiments)

**Parameters.** `iterations`, `repulsion`, `rings`, `strokeWidth` — each one annotated in the explanation document above.

## Adding a pattern

1. **Write the generator** — `src/patterns/<id>.ts`, one file, calling
   `definePattern({...})`. Keep it under ~400 lines.
2. **Obey the contract**: pure and deterministic, no `Math.random`, no `Date`.
   Take randomness from `mulberry32(deriveSeed(seed, 'name'))` in `core/prng`.
   Emit `ink` / `paper` / `accent` role tokens, never literal colours. Build
   nodes with `el()` from `core/svg`.
3. **Register it** — add the import to `src/patterns/index.ts`, a display name
   to `NAMES` in `src/ui/gallery.ts`, and a preset to
   `src/patterns/presets.ts` (`tests/patterns/presets.test.ts` asserts every
   pattern has one).
4. **Test it** — copy an existing `tests/patterns/<id>.test.ts`. The shared
   harness checks determinism, snapshots the output, sweeps every parameter to
   its extremes looking for `NaN`/`Infinity`, and enforces the element budget.
5. **Explain it** — `src/content/explain/<id>.en.md` and `.es.md`, with
   `source:` and `url:` front matter and the three sections *Formula*, *What it
   means*, *Parameters*. `tests/content/explain.test.ts` requires both
   languages for every registered pattern.
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
  fills. Nothing in the tentative middle.
- No gradients, filters, blurs or shadows anywhere in the poster path. (The
  animated stage is the single exception — see
  [architecture.md](architecture.md#the-animated-stage-in-development).)
- Depth through genuine occlusion (painter's algorithm) or through stroke
  weight and opacity — never through alpha-blended hidden geometry.
- Element budgets documented in the module and asserted by the test harness:
  roughly ≤ 50k dots, ≤ 5k primitives, polylines simplified before serialising.
