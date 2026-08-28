# Fields, Noise, and Emergent/Dynamical Systems — Formula Catalog

> Research agent output, 2026-08-28. Attractor formulas/parameters verified against paulbourke.net; Gray-Scott against mrob.com/xmorphia and Karl Sims.

**Shared PRNG (mulberry32):**

```js
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

Seeded simplex/Perlin for noise systems — never `Math.random()`.

**Three recurring vectorizations:** point cloud (mega-path of `M x y h 0.01` dots, round linecap); streamline/polyline (Catmull-Rom→Bézier); marching squares (scalar grid → iso-contours, edge interpolation, saddle by center sample).

## 1. Strange Attractors (iterated 2D maps)

Iterate 50k–500k, discard first ~100 (transient). Render: (a) low-opacity dots, cap 30k–80k circles; (b) **density-bin** into a grid (200×280) → radius/opacity-modulated circle grid, log-density contours, or scanlines by density (removes any cap).

### 1a. Clifford (verified Bourke)

```js
xn = Math.sin(a*y) + c*Math.cos(a*x);
yn = Math.sin(b*x) + d*Math.cos(b*y);
```

Bounds: x ∈ ±(1+|c|), y ∈ ±(1+|d|). Known-good (a,b,c,d): (-1.4, 1.6, 1.0, 0.7); (1.6, -0.6, -1.2, 1.6); (1.7, 1.7, 0.6, 1.2); (1.5, -1.8, 1.6, 0.9); (-1.7, 1.3, -0.1, -1.2); (-1.7, 1.8, -1.9, -0.4); (-1.8, -2.0, -0.5, -0.9). Range [-3,3]; reject converged runs (bbox of iters 1000–2000 near zero area) and re-roll.
**Visual:** ghostly folded veils — most reliably beautiful attractor.

### 1b. Peter de Jong (verified Bourke)

```js
xn = Math.sin(a*y) - Math.cos(b*x);
yn = Math.sin(c*x) - Math.cos(d*y);
```

Bounds [-2,2]². Known-good: (1.641, 1.902, 0.316, 1.525); (0.970, -1.899, 1.381, -1.506); (1.4, -2.3, 2.4, -2.1); (2.01, -2.53, 1.61, -0.33); (-2.7, -0.09, -0.86, -2.2); (-0.827, -1.637, 1.659, -0.943); (-2.24, 0.43, -0.65, -2.43); (-2.0, -2.0, -1.2, 2.0); (-0.709, 1.638, 0.452, 1.740).
**Svensson variant:** `xn = d*sin(a*x) - sin(b*y); yn = c*cos(a*x) + cos(b*y)`, (1.40, 1.56, 1.40, -6.56).

### 1c. Lorenz projected to 2D

```js
dx = sigma*(y - x); dy = x*(rho - z) - y; dz = x*y - beta*z;  // Euler dt = 0.005
```

σ=10, ρ=28, β=8/3; start (0.1, 0, 0), skip 500 steps; ρ ∈ 24–100 interesting. (x,z) = classic butterfly; expose two projection angles.
**SVG-native:** one continuous polyline, 20k–60k steps, decimate/RDP (ε ≈ 0.1% width), stroke-opacity 0.3–0.5.

### 1d. Gumowski-Mira (verify the NEW-x usage)

```js
function G(x, mu) { return mu*x + 2*(1-mu)*x*x/(1+x*x); }
const xn = y + a*(1 - b*y*y)*y + G(x, mu);
const yn = -x + G(xn, mu);   // uses the NEW x — essential
```

a ≈ 0–0.02, b ≈ 0.05 (≤1.0), **μ ∈ [-1, 1] is the star** (step 0.001). Known-good: (0.008, 0.05, -0.6); try μ = -0.7, -0.55, -0.23, -0.9, 0.31. Simplified classic: a=b=0, μ=-0.573. Start (0.1, 0.1) or (12, 0) — starting radius changes the figure.
**Visual:** radially symmetric "sea creatures" — jellyfish, diatoms, mandalas. Most figurative attractor.

### 1e. Hopalong (Barry Martin)

```js
const xn = y - Math.sign(x) * Math.sqrt(Math.abs(b*x - c));
const yn = a - x;   // start (0,0)
```

Almost any (a,b,c) works: (2.0, 1.0, 0); (0.4, 1.0, 0); (-11, 0.05, 0.5); (7.17, 8.44, 2.56). a,b ∈ [-10,10], c ∈ [0,10]. Grows with iterations — expose N prominently. Variants: positive (drop sign, +sqrt), additive, sinusoidal (sin(bx−c) for sqrt).
**Visual:** concentric squarish rings, pinwheels, lace doilies.

### 1f. More attractors

- **Bedhead:** `xn = sin(x*y/b)*y + cos(a*x - y); yn = x + sin(y)/b` — (0.65343, 0.7345345), (-0.81, -0.92).
- **Fractal Dream (Pickover):** `xn = sin(y*b) + c*sin(x*b); yn = sin(x*a) + d*sin(y*a)` — (-0.966918, 2.879879, 0.765145, 0.744728).
- **Tinkerbell:** `xn = x² - y² + a*x + b*y; yn = 2*x*y + c*x + d*y`, (0.9, -0.6013, 2.0, 0.5), start (-0.72, -0.64).
- **Ikeda:** `t = 0.4 - 6/(1 + x² + y²); xn = 1 + u*(x*cos t - y*sin t); yn = u*(x*sin t + y*cos t)`, u = 0.918.

## 2. Phyllotaxis (Vogel)

```js
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));   // ≈ 137.50776°
theta = n * angle;  r = scale * Math.pow(n, p);      // p = 0.5 Vogel uniform
```

N 200–5000. **Divergence angle is everything:** 137.50776° perfect; ±0.1° visibly winds the arms (famous instability — animate it). Rational angles → spokes. p ∈ [0.4, 1.0]. Element size ∝ √n for sunflower look.
Variants: connect n → n+k for Fibonacci k (8, 13, 21) to draw parastichies; power-diagram cells for cracked-mud sunflower.
Expose: angle (fine around 137.5°), N, p, element shape, growth rate, stride k.

## 3. Circle Packing

**3a. Greedy random:** candidate at random point, reject if overlapping, else grow radius to nearest circle/boundary, cap rMax. **Spatial hash grid (cell = 2·rMax) mandatory** beyond ~2000 circles. Radius distributions: power-law `r = rMin·(rMax/rMin)^u` or 3 size classes (1 : 2.6 : 7) strongest.
**3b. Front-based:** place each new circle tangent to two front circles (Apollonius two-tangency: intersect circles radius r1+r about c1 and r2+r about c2), crystalline growth rings. **Apollonian gasket:** Descartes `k4 = k1+k2+k3 ± 2√(k1k2+k2k3+k3k1)`, complex version gives centers.
SVG-native (`<circle>`), 500–5000. Variants: pack inside mask (letterform); motifs inside circles; negative padding = scale-armor.
Expose: rMin/rMax, distribution exponent, count, padding, mask, motif.

## 4. Voronoi / Delaunay

Embed **d3-delaunay** (~7KB, deterministic). Variants:
- **Lloyd relaxation:** site ← centroid, k=0 jagged / 2–3 organic / 50 hexagonal.
- **Non-uniform seeding:** rejection-sample against density (noise/image) — basis of Voronoi stippling (Secord 2002 weighted Lloyd).
- **Cell inset 80–95% toward centroid** → mortar gaps ("shattered glass / dried mud"). Rounded corners: quadratic Bézier between edge midpoints.
- **Delaunay:** triangulation edges (low-poly mesh) or flat-color triangles.
- **Recursive Voronoi:** mini-Voronoi inside large cells.

Expose: site count, Lloyd iters 0–20, density source, inset %, rounding, mode (cells/edges/triangles), stroke vs fill.

## 5. Noise Flow Fields (streamline tracing)

```js
angleAt(x,y) = noise2D(x*freq, y*freq) * Math.PI * curl;  // curl 2–6
px += Math.cos(a)*stepLen; py += Math.sin(a)*stepLen;     // Euler; RK2/4 smoother
```

- **Evenly-spaced streamlines (Jobard-Lefer 1997):** deposit points in spatial grid; kill line within dSep of another; seed new lines at dSep perpendicular. Magazine-quality non-crossing flow.
- fBm octaves: 1 laminar, 3–4 turbulent. **Domain warping (Quilez):** `n(p + k·n(p + k·n(p)))`, k 1–8 — marbled ink.
- Curl multiplier: 1π gentle, ≥4π scrollwork loops.

SVG: born for it — 200–3000 paths, RDP decimate; taper via ribbon polygons. Variants: grid ticks rotated to field; advected particle dots.
Expose: freq, octaves, curl, step, line count, dSep, warp, mask, taper.

## 6. Curl Noise (divergence-free)

```js
const e = 0.0001;
dpdx = (noise2D(x+e,y) - noise2D(x-e,y))/(2*e);
dpdy = (noise2D(x,y+e) - noise2D(x,y-e))/(2*e);
v = [dpdy, -dpdx];
```

Streamlines are **closed loops** around noise extrema: eddies, thumbprints, isobars. Fade ψ near edges (smoothstep of distance) keeps boundaries tangential. Shortcut: marching-squares contours of ψ ARE the curl streamlines — guaranteed-closed topo contours.
Expose: freq, octaves, amplitude, line count/length, loop-closing, boundary fade.

## 7. Gray-Scott Reaction-Diffusion (verified xmorphia + Sims)

```
∂u/∂t = Du·∇²u − u·v² + F·(1 − u)
∂v/∂t = Dv·∇²v + u·v² − (F + k)·v
```

Discrete (Sims): u=1,v=0 everywhere, seed v=1 blobs; per step (Δt=1):

```js
lap = conv3x3([[0.05,0.2,0.05],[0.2,-1,0.2],[0.05,0.2,0.05]]);
u += 1.0*lapU - u*v*v + F*(1-u);
v += 0.5*lapV + u*v*v - (F+k)*v;   // Du:Dv = 2:1 required
```

2000–10000 steps, 200–400² grid, Float32Array double-buffered, Web Worker.

| Regime | F | k |
|---|---|---|
| Mitosis | 0.0367 | 0.0649 |
| Coral | 0.0545 | 0.0620 |
| Worms | 0.078 | 0.061 |
| Solitons | 0.030 | 0.062 |
| Mazes | 0.029 | 0.057 |
| Holes | 0.039 | 0.058 |
| Waves | 0.014 | 0.045 |
| Chaos | 0.026 | 0.051 |
| Moving spots | 0.014 | 0.054 |
| U-Skate (Munafo) | 0.0620 | 0.0609 |
| Pulsating solitons | 0.025 | 0.060 |

Band: F ∈ [0.01, 0.09], k ∈ [0.045, 0.07] — **UI should be a 2D F/k pad, not two sliders. Spatial F/k gradients across the canvas (Pearson map as the poster) = killer variant.**
SVG: marching squares on v (threshold 0.2–0.3, 2–4 nested), Chaikin ×1–2, fill-rule evenodd.
Expose: F/k pad + presets, steps ("growth time" — intermediate states often beat converged), seed pattern (dots/blob/text mask), thresholds, gradient toggle.

## 8. Diffusion-Limited Aggregation

Walker from spawn circle, random steps, sticks with probability p near cluster; respawn beyond kill radius. Optimize: spatial hash; **adaptive stepping (step = dist to cluster − stickDist)**; spawn just outside cluster radius. p=1 wispy dendrites (fractal dim 1.71); p→0.01 mossy blobs. Seeds: point / bottom line (frost) / circle inward (lichen); directional bias (wind).
**Record each particle's parent → render as tree branches:** root-to-leaf polylines, stroke tapering by distance from root. 5k–50k particles; merge collinear chains.
Expose: count, p, seed geometry, bias, taper, mode (dots/branches), lattice/off.

## 9. Differential Growth

Closed polyline (~20 nodes); per frame: attraction to neighbors (k 0.2–0.5), repulsion within rRep 8–20px (k 0.5–1.2, spatial hash), optional alignment, split if gap > dMax 5–10, merge if < dMin. 300–2000 iterations. Modulate growth by position field; confine in boundary shape (fills like gut folds).
**The single best SVG-native emergent system:** 1–10k node polylines, Catmull-Rom smooth; export snapshots every k iterations as nested growth rings.
Expose: repulsion radius (shape dial), attract/repulse balance, iterations, boundary, modulation field, ring interval, start shape.

## 10. Metaballs → Marching Squares

Field `f = Σ ri²/|p−ci|²` (or finite-support `(1−(d/R)²)³`), threshold T ≈ 1. n = 3–30 balls, negative-weight balls punch holes, multi-thresholds → topo bands, per-ball anisotropy, noise wobble on f.
Marching squares core (reused by §7, §11, §13): 4-bit case per cell, 16-case table, edge interpolation `t = (T−fA)/(fB−fA)`, saddle by center sample, chain into loops. Chaikin ×1.
Expose: count, radii, thresholds, band count, negative fraction, wobble, falloff.

## 11. Wave Interference

```js
f = Σ Ai*sin(ki*dist(p, srci) + phasei)                  // circular
f = Σ Ai*sin(ki*(x*cos θi + y*sin θi) + phasei)          // plane
```

2–5 sources, λ = 4–15% width. Two close circular = double-slit fringes; 3 plane at 120° = quasi-hex; incommensurate k = moiré.
Renders: (1) marching-squares nodal/level contours; (2) halftone dots radius ∝ f; (3) **scanlines displaced by f ("Unknown Pleasures" ridgeline) — one path per row, SVG-cheap, proven genre**.
Expose: sources (draggable), wavelengths, amplitudes, phases, circular↔planar, render mode, levels.

## 12. Dithering as Art

Input: any grayscale field g (gradient, noise, or §5/§7/§11 field). Algorithms:
- **Floyd-Steinberg** (7/16, 3/16, 5/16, 1/16), serpentine kills diagonal worms — or keep them deliberately.
- **Atkinson** (6 × 1/8, loses 25% error — punchy Mac look). **Bayer 8×8** crosshatch.
- **Premium stippling:** weighted Voronoi (Secord) or variable-density Poisson-disc (Bridson, r(x,y) from g).

FS on smooth gradients yields braided "dither waterfall" phase transitions at g = 1/4, 1/3, 1/2…
SVG: counts explode — grids ≤ 300 wide, mega-path dots, or halftone (uniform grid, radius = √g·cell/2 — fewer elements, same read). Hatching with spacing from g.
Expose: source field, algorithm, resolution, dot shape, serpentine, gamma, invert.

## 13. Chladni / Harmonic 2D Fields

```js
f(x,y) = sin(m*PI*x/L)*sin(n*PI*y/L) - sin(n*PI*x/L)*sin(m*PI*y/L);
// general: f = a*sin(πnx)*sin(πmy) + b*sin(πmx)*sin(πny)
```

m ≠ n ∈ [1,12]; (3,5), (2,7), (5,8) lovely; a,b ∈ [-1,1] morph. Circular plate: `f = Jn(k·r)·cos(n·θ)` (Bessel polynomial approx).
Renders: marching squares at 0 (sparse elegant curves); ±ε bands; **"sand": rejection-sample points with prob ∝ exp(−|f|/σ) — piles on nodal lines like real sand, 5–20k dots, very evocative**.
Expose: m, n, mix a/b, rect/circular, band count, sand/line, grain count, σ.

## 14. Additional

- **Harmonograph** (see analytic catalog §5) — cross-listed as SVG-native.
- **Superformula** (see analytic catalog §1).
- **Space colonization (Runions):** scatter attractors; grow branches toward mean direction of attractors in influence radius; kill within kill-distance. Botanical veins/trees, tapered.
- **Poisson-disc (Bridson):** r, k=30 candidates, grid-backed — foundation for §4/§5/§12 seeds; with r(x,y) it IS a stippling engine.
- **Truchet with flow:** cross-listed with tilings catalog.

## Cross-cutting SVG craft

| Mapping | Systems | Guardrail |
|---|---|---|
| Point cloud / density bins | attractors, Chladni sand, DLA dots, dithering | ≤ 50k dots; mega-path or density-binned sizes |
| Polylines | Lorenz, flow/curl, differential growth, harmonograph, DLA branches | RDP ε ≈ 0.1% W; Catmull-Rom→Bézier |
| Marching squares | Gray-Scott, metaballs, waves, Chladni | grid ≤ 400², Chaikin ×1–2, evenodd, nested thresholds |
| Native primitives | packing, Voronoi, phyllotaxis, superformula, Truchet | ≤ 5k elements; cheapest and sharpest |

Universal sliders: seed, palette, background, margin, density/detail master scaling the count parameter. Heavy sims (Gray-Scott, DLA, differential growth) get a "growth time" step slider — intermediate states often beat converged ones.
