---
source: Amidror, I. (2000) "The Theory of the Moiré Phenomenon, Volume I: Periodic Layers"
url: https://link.springer.com/book/10.1007/978-1-84882-181-1
---

## Formula

    Λ = 1 / √( 1/dA² + 1/dB² − 2·cos(θB − θA) / (dA·dB) )      (fringe period)

    grating A: parallel lines, spacing dA, angle θA
    grating B: parallel lines, spacing dB, angle θB
    (circle mode: two families of concentric circles, spacings dA/dB, centers offset by `offset`)

## What it means

Two gratings are drawn independently, each a plain set of evenly spaced parallel lines, and simply overlaid. Neither grating alone contains any large-scale structure — but wherever the two nearly line up, the eye reads a bright band, and wherever they nearly cancel, a dark one. That banding, the moiré fringe, is not drawn by anything in the code; it's a pure interference artifact of superimposing two periodic structures, exactly the effect you see when two window screens or two sheer curtains overlap. The Λ formula predicts the spacing of those fringes from nothing but the two gratings' own periods and the angle between them.

The formula's shape explains the pattern's defaults directly: when the two spacings are nearly equal (dA ≈ dB) and the angle between them is small, the two 1/d² terms nearly cancel the cross term, and Λ blows up — the fringes stretch into slow, sweeping bands wide enough to see clearly, which is exactly the near-degenerate case the defaults sit in (spacing 9 vs. 9.6, a 6° angle apart). Push the spacings further apart, or widen the angle, and Λ shrinks fast: the fringes tighten into a fine crosshatch and eventually disappear into what just looks like two ordinary overlapping grids.

Circle mode replaces the two line gratings with two families of concentric circles, offset from each other rather than rotated — the offset plays the same geometric role the angle difference plays for straight lines, producing the "ripples in a pond" rosette pattern instead of straight sweeping fringes.

## Parameters

- **mode** — chooses which pair of gratings interferes: two straight-line families, or two families of concentric circles. This swaps the underlying geometry the fringe formula acts on, not just how it's drawn.
- **spacingA** / **spacingB** — dA, dB, the periods of the two gratings. How close these two values are to each other is the single strongest lever on the fringe period Λ.
- **angleA** / **angleB** — θA, θB, the orientation of each line grating (ignored in circle mode). Their difference is the other term controlling Λ.
- **offset** — circle mode only: the distance between the two circle families' centers. Plays the role that the angle difference plays for line gratings, controlling how tight the resulting rosette rings are.
- **strokeWidth** — the line thickness of each grating. A rendering choice, but not a neutral one: strokes thick enough to overlap each other physically wash out the fine fringe structure the interference math produces.
