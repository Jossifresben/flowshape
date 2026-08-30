---
source: Truchet, S. (1704) "Mémoire sur les combinaisons"; arc variant popularized by Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4)
url: https://en.wikipedia.org/wiki/Truchet_tiles
doi: 10.2307/1578535
---

## Formula

    grid of s×s cells, cols × rows over the frame
    each cell: flip ← seeded coin toss

    diagonal variant (1704): split the cell along one diagonal;
      flip = true  → fill the upper-left triangle
      flip = false → fill the lower-right triangle

    arc variant (Smith, 1987): two quarter-circle arcs, radius s/2,
      each joining the midpoints of two adjacent sides;
      flip picks which pair of opposite corners the arcs curve around

## What it means

Truchet's original 1704 memoir asked a deceptively small question: what happens if you take one asymmetric tile and drop a copy, randomly rotated, into every cell of a grid? His tile was a square cut in half along the diagonal, one triangle inked in. With only two effective orientations per cell (rotating a half-filled square by 180° gives the same picture as flipping it), a coin toss per cell is the entire generator — no two neighboring cells "know" about each other, yet global structure emerges from the sheer statistics of adjacency.

Smith's 1987 variant swaps the diagonal split for two quarter-circle arcs that always land on the same two points: the midpoints of the cell's sides. That fixed anchoring is the trick — because every tile's arcs touch its edges at exactly the same four midpoints regardless of orientation, an arc in one cell always lines up with an arc in the next, and the whole grid resolves into a field of continuous, wandering curves with no gaps or dead ends, the "Truchet curves" that give the arc variant its distinctive maze-like look next to the diagonal variant's crystalline, faceted one.

Both variants are single-scale here — each cell is decided independently by one coin toss, with no hierarchy of tile sizes. What decides the picture's character is simply how biased that coin is toward one orientation over the other, and how densely the grid is packed.

## Parameters

- **cell** — the grid pitch, in user units: the side length of each square tile. Smaller cells pack more tiles into the frame and read as finer, denser curves or facets.
- **variant** — chooses the tile motif: Truchet's original 1704 diagonal split, or Smith's 1987 quarter-circle arcs. This changes the underlying construction, not just its appearance.
- **render** — a drawing choice, not a mathematical one: draw each tile as an open stroke (the traditional look) or as a filled two-tone shape (flat ink polygons, no stroke at all).
- **strokeWidth** — line thickness in stroke mode. Purely a rendering knob.
- **boldChance** — the probability that a given tile's stroke is drawn at double weight instead of the base width, in stroke mode. A rendering accent with no effect on the tile geometry itself.
- **accentChance** — the probability that a given tile is drawn in the accent color instead of ink. Another rendering-only knob layered on top of the same coin-toss geometry.
