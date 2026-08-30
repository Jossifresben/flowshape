---
source: Hobbs, T. (2020) "Flow Fields"; streamline separation rule after Jobard, B. and Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density"
url: https://www.tylerxhobbs.com/words/flow-fields
doi: 10.1007/978-3-7091-6876-9_5
---

## Formula

    angle(x, y) = noise2D(x·freq, y·freq) · π · curl
    x += cos(angle) · stepLen
    y += sin(angle) · stepLen     (Euler integration)

## What it means

A flow field is a direction assigned to every point in the plane — here, that direction comes from sampling a noise function at each location and turning the result into an angle. A particle dropped anywhere just keeps stepping in whatever direction the field points at its current position, tracing a curve that bends wherever the underlying noise bends. Because the noise field itself is smooth and continuous, nearby particles trace nearly parallel curves, and the whole canvas fills with lines that feel like a single coherent current rather than independent scribbles — the same logic as iron filings settling along magnetic field lines.

Two parameters shape the character of that current before a single line is drawn. The frequency at which the noise is sampled sets how large the eddies are: low frequency stretches the same noise pattern over a wide area, so lines drift and curve gently over long distances; high frequency compresses it, producing tighter, more turbulent loops. The curl multiplier then scales how far the raw noise value gets stretched into an angle before the particle turns — small curl keeps the field close to a straight, laminar drift, while large curl lets a small noise change swing the direction wildly, producing the scrollwork-like loops you get near the top of the slider's range.

The lines themselves are kept from crossing or bunching by a simple rule: as each line advances, it claims the small grid cells it passes through, and the moment it steps into a cell already claimed by a different line, it stops. That's a coarse, grid-based version of the classic evenly-spaced-streamline technique — instead of measuring exact distances to every other line, it just checks whether this cell already belongs to someone else.

## Parameters

- **freq** — the spatial frequency at which the noise field is sampled. Lower values produce large, slow-turning eddies; higher values produce tighter, more turbulent curl.
- **curl** — multiplies the raw noise value before it becomes a turning angle, controlling how sharply lines are allowed to bend — from a gentle laminar drift at low values to tight, looping scrollwork at high values.
- **spacing** — the grid spacing between candidate starting points for streamlines (a random 35% of candidates are skipped). Controls how densely lines are seeded across the canvas.
- **steps** — the maximum number of integration steps a single streamline is allowed to take (each step advances 2 canvas units) before it's cut off, even if it never collides with another line.
- **strokeWidth** — line width of each traced streamline. A rendering choice.
- **emphasisEvery** — every k-th successfully drawn streamline, counted in placement order, is rendered thicker and fully opaque instead of the default thin, translucent stroke. Purely decorative — it has no effect on the traced paths themselves.
