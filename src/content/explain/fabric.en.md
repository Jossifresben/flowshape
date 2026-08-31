---
source: Quílez, I. (2002), "Domain Warping"
url: https://iquilezles.org/articles/warp/
---

## Formula

    s   = noiseScale / min(W, H)
    x'  = x + warpAmount · fbm(x·s, y·s)
    y'  = y + warpAmount · fbm(x·s + 5.2, y·s + 1.3)

    fbm(x, y) = Σₒ noiseₒ(x·2ᵒ, y·2ᵒ) / 2ᵒ   (o = 0, 1 — two octaves, normalised)

## What it means

Start with a plain regular grid of gridSize × gridSize points. Domain warping — Quílez's term for it — does not distort the grid directly; it displaces each point by *evaluating noise at that point's own position* and using the two returned values as an offset vector. The two noise samples are taken at positions separated by a fixed jitter (`+5.2`, `+1.3`) purely so the x- and y-offsets decorrelate: without that offset the whole grid would just breathe uniformly in one diagonal direction instead of billowing.

The noise itself is fractal Brownian motion — two octaves of smoothstep-interpolated value noise, the coarse layer setting broad drift and the finer layer riding on top of it at half the amplitude. That layering is what keeps the warp looking organic rather than like a single smooth wave: nearby points move together at the coarse scale but pick up independent small deflections from the second octave, which is exactly the texture of hand-drawn fabric or a printed fibre weave.

The pattern renders the warped lattice three ways. As dots, each warped point becomes a filled circle — the grid reads as a scattered, textile-like stipple. As mesh, consecutive points along each original row and column are connected into polylines, so the *straight* grid lines of the unwarped lattice become gently undulating curves — visibly the same construction Quílez describes for terrain and cloud rendering, just drawn as ink lines instead of shaded pixels. As squares — a nod to the hiding-square motif of 1960s computational art — each *cell* of the unwarped lattice draws a filled square instead of warping a point: the same two noise reads that displace dots/mesh instead drive that cell's square translation, scale and rotation, all at once. Where the noise is near zero the square sits centred, unrotated, and filling its cell; where the noise is strong the square shrinks, slides and turns, exposing paper at the corners. Translation and size are always kept inside the square's own cell — however far the noise pushes it, it can at most touch, never overlap, its neighbours. Because it rides the same drifting noise reads as the other two modes, the hiding effect travels as an animated wave for free, with no extra maths of its own.

## Parameters

- **gridSize** — the number of lattice points per side before warping. Higher values give a finer weave and more texture detail from the noise, at the cost of more elements.
- **warpAmount** — the displacement magnitude applied to each point; 0 leaves the grid perfectly regular, larger values push the warp toward visible tearing and overlap. In squares mode this same value instead sets how hard the noise can bite into each square's size, shift and turn — 0 leaves a plain untouched grid of full squares.
- **noiseScale** — how many noise-field cycles fit across the frame; low values give broad, slow drift, high values give tight, rapid ripples.
- **mode** — a rendering choice, not part of the maths: whether the warped lattice is drawn as a field of dots, connected mesh lines, or hiding squares.
- **dotSize** — the drawn radius of each dot in dots mode; a pure drawing choice with no effect on the underlying warp. Unused in mesh and squares mode.
- **strokeWidth** — the line weight of the mesh in mesh mode; also a drawing choice. Unused in dots and squares mode.
