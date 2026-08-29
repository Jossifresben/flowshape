---
source: Hankin, E.H. (1925) "The Drawing of Geometric Patterns in Saracenic Art", Memoirs of the Archaeological Survey of India; construction formalized by Kaplan, C.S. (2005) "Islamic Star Patterns from Polygons in Contact"
url: https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf
---

## Formula

    base tiling: hexagonal grid, hex size S
    for each hexagon, edge k has midpoint Mₖ, unit edge direction Eₖ, inward normal Nₖ

    ray from Mₖ, direction  E_k·cosθ + N_k·sinθ           (θ = contact angle)
    ray from M_{k+1}, direction −E_{k+1}·cosθ + N_{k+1}·sinθ

    P = intersection of the two rays
    girih segment: Mₖ → P → M_{k+1}                        (for every adjacent edge pair)

## What it means

This is not a closed-form curve — it's a construction rule, and it's the one E.H. Hankin documented in 1925 after studying Islamic geometric patterns: "polygons in contact." Start from an ordinary tiling (here, a hexagon grid) and discard it once you're done — it only exists to anchor the construction. At the midpoint of every polygon edge, fire two rays into the interior, tilted away from the edge by a fixed contact angle θ instead of running straight in. Where the ray launched from one edge meets the ray launched from its neighbor, that intersection becomes a sharp point; connecting midpoint → point → midpoint for every pair of adjacent edges traces out the interlaced star-and-strap motif that reads as "Islamic geometric pattern" at a glance.

The construction is entirely local — every hexagon only ever needs its own six edges and angle θ — yet the result is globally continuous. Because two neighboring hexagons share an edge, they also share that edge's midpoint, so a strand that exits one tile's boundary always re-enters the adjacent tile at the exact same point. No stitching, no lookup table: continuity is a free consequence of using shared midpoints as anchors.

The contact angle θ is the one number that decides everything about how the pattern reads. Hankin's own historical examples cluster around a handful of canonical values — 72°, 54°, and 36° for ten-pointed star patterns, or 30°, 45°, 60° for hexagon- and square-based grids (30° on a hex grid gives the classic six-pointed star surrounded by hexagons). Away from those special angles the star motifs simply open or close continuously, which is what makes θ such an effective slider: it's a smooth, exact re-derivation of the whole pattern for every value, not an approximation.

## Parameters

- **hexSize** — S, the size of the underlying hexagonal grid the construction is anchored to. Larger hexagons produce larger, more open star motifs; the base grid itself is discarded from the final drawing.
- **contactAngle** — θ, the Hankin contact angle each ray is tilted away from its edge. This is the pattern's real mathematical control: it continuously opens or closes the star and strap motifs, passing through Hankin's own canonical values (30°, 36°, 45°, 54°, 60°, 72°) along the way.
- **render** — a drawing choice: draw the girih lines as plain single strokes, or as interlaced two-tone ribbons that fake an over/under woven look using a wide background-colored stroke cased under a narrower ink one.
- **ribbonWidth** — the width of the ribbon strands in ribbon mode. Purely a rendering knob layered on the same underlying line geometry.
- **strokeWidth** — line thickness in stroke mode. Also a rendering-only choice.
