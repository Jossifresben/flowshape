---
source: Bridson, R. (2007) "Fast Poisson Disk Sampling in Arbitrary Dimensions", ACM SIGGRAPH 2007 Sketches
url: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
---

## Formula

    vignette(x,y) = 1 − dist((x,y), center) / maxDist
    density(x,y)  = vignette·(1 − contrast) + vignette·noise(x,y)·2·contrast     (clamped to [0,1])
    gap(x,y)      = minGap + (1 − density(x,y))·(maxGap − minGap)

    accept a random candidate point only if no placed point lies within gap(x,y) of it

## What it means

This is variable-density Poisson-disc sampling: instead of one fixed minimum distance between every pair of points, the minimum gap changes from place to place according to a density field, so points pack tightly where the field is "dark" and spread out where it is "light." The version here is a naive rejection sampler rather than Bridson's original O(N) dart-throwing algorithm — it grid-accelerates neighbor lookups for speed, but otherwise it is exactly the idea Bridson describes: throw a random candidate, compute the locally-required spacing from the field, and keep the point only if nothing already placed is closer than that.

The density field itself is a blend of two things: a soft radial vignette that is brightest at the canvas center and fades toward the corners, and a fractal-noise texture layered on top of it. The contrast parameter controls how much the noise gets to distort the plain vignette — at contrast 0 the field is pure vignette, so dots simply thin out smoothly from center to edge; as contrast rises toward 1, patches of noise start pulling density up or down locally, breaking the smooth gradient into mottled clumps and gaps, more like the grain of a half-tone print than an even fade.

Every accepted point becomes a visible dot in the final image, so the placement rule and the drawing are the same operation here — unlike some of the other point-cloud patterns in this collection, there's no separate "what to draw" step after sampling.

## Parameters

- **minGap** — the minimum spacing enforced between points in the densest regions (density = 1). Sets the finest grain the stippling can reach.
- **maxGap** — the minimum spacing enforced in the emptiest regions (density = 0). Sets how far dots can spread apart before the canvas reads as blank.
- **noiseScale** — the spatial frequency of the fractal-noise field that perturbs density; higher values pack more noise detail into the same area, giving finer, busier mottling.
- **contrast** — how strongly that noise field is allowed to distort the smooth radial vignette, from 0 (pure smooth gradient) to 1 (heavily noise-driven, patchy density).
- **dotSize** — the drawn radius of each dot. A rendering choice — it has no effect on where points are placed.
- **accentEvery** — colors every k-th placed dot (in placement order) with the accent color instead of ink. Purely decorative; 0 disables it.
