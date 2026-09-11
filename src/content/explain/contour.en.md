---
source: Lorensen, W. E. & Cline, H. E. (1987) "Marching Cubes: A high resolution 3D surface construction algorithm", SIGGRAPH '87 (the 2-D case, marching squares); field is fractional Brownian value noise after Perlin, K. (1985) "An image synthesizer"
url: https://en.wikipedia.org/wiki/Marching_squares
doi: 10.1145/37401.37422
---

## Formula

    v(x, y) = ½ + ½ · contrast · fbm(x · s, y · s)          clamped to [0, 1]
    fbm     = Σₖ noise(2ᵏ · x, 2ᵏ · y) / 2ᵏ,  k = 0 … octaves − 1

    level i:   region { v ≥ i / N },  i = 1 … N − 1
    boundary traced by marching squares, crossings placed by linear interpolation

## What it means

A contour map is a scalar field cut at evenly spaced heights. The field here is fractional Brownian noise: layers of smooth value noise, each twice as fine and half as strong as the last, which is the standard recipe for terrain that looks like terrain. The interesting part is not the field but the cut. Marching squares samples the field on a lattice and looks at each small square in turn: if some corners are above the threshold and some below, the level line must cross that square, and it crosses on exactly the edges whose two ends disagree. Where along the edge is set by linear interpolation between the two corner values — so the line lands where the field actually reaches the threshold, not on the lattice. There are sixteen ways four corners can be above or below, two of them ambiguous saddles that the centre value resolves, and chaining the resulting segments edge to edge closes every level line into a loop.

Because each region contains the next one up, drawing them lowest first is a painter's stack: every terrace genuinely covers the one beneath it, which is how the depth reads. A ring of samples set below every threshold, just outside the frame, guarantees that a region running off the sheet still closes, and its crossings are clamped to the sheet's edge. With fills alternating ink and paper the sheet reads as a topographic map cut into bands; in isolines mode the same loops are drawn as hairlines.

Nothing in the construction is smoothed after the fact: the loops are polygons with a vertex per lattice crossing, which at this pitch is fine enough to print.

## Parameters

- **noiseScale** — the spatial frequency at which the field is sampled. Lower values give broad, slow hills; higher values give many small peaks.
- **octaves** — how many layers of noise are summed. One octave is a single smooth swell; five adds fine detail to every edge.
- **levels** — N, the number of height bands the field is cut into. N − 1 boundaries are drawn.
- **contrast** — stretches the field about its midpoint before cutting. Higher values push more of the sheet into the top and bottom bands; lower values keep everything near the middle levels.
- **mode** — terraces (filled regions, alternating ink and paper) or isolines (the same loops as strokes).
- **strokeWidth** — line weight in isolines mode. A rendering choice.
- **accentEvery** — every k-th level in the accent colour, as a fill or as a heavier stroke. 0 disables it.
