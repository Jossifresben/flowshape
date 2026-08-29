---
source: Voronoi, G. (1908) "Nouvelles applications des paramètres continus à la théorie des formes quadratiques", Journal für die reine und angewandte Mathematik 133
url: https://en.wikipedia.org/wiki/Voronoi_diagram
---

## Formula

    V_i = { x in the plane : |x − s_i| ≤ |x − s_j|  for every other site s_j }

    each V_i is the intersection of half-planes, one per neighbor s_j,
    bounded by the perpendicular bisector of the segment s_i–s_j

## What it means

A Voronoi diagram answers one question for every point in the plane: which of the scattered sites is closest? Region V_i collects all the points for which s_i wins that contest. Because "closer to s_i than to s_j" is exactly the half of the plane on s_i's side of the perpendicular bisector between them, each cell is simply the overlap of one half-plane per neighboring site — a convex polygon carved out by straight cuts, one cut per nearby site.

The construction here builds each cell that way directly: starting from the full canvas rectangle, it clips away the far side of the bisector for each of the nearest sites in turn, in order of distance, until only the site's own territory remains. Sites near the edge of the canvas end up with cells truncated by the canvas boundary rather than closing naturally — that's an unavoidable fact about Voronoi diagrams of a finite point set, not an approximation in this implementation.

After the true cell polygon is computed, every vertex is pulled a fraction of the way toward the cell's own centroid before it's drawn. That inset has nothing to do with the Voronoi construction itself — mathematically, neighboring cells share an edge exactly, with zero gap between them. Pulling the vertices inward is purely a drawing decision, done to open a visible "mortar line" of paper between adjacent tiles instead of drawing them edge-to-edge.

## Parameters

- **sites** — the number of randomly scattered points partitioning the plane. More sites give smaller, more numerous cells.
- **inset** — how far each cell's vertices are pulled toward its own centroid before drawing, from 1 (cells meet exactly, as in the true diagram) down toward 0.5 (a visible gap opens between every pair of neighbors). A rendering choice layered on top of the geometry, not part of it.
- **strokeWidth** — line width of each cell's outline.
- **inkEvery** — fills every k-th cell (by index) with ink instead of paper. A rendering choice.
- **accentEvery** — fills every k-th cell with the accent color, taking priority over inkEvery where the two would otherwise coincide. Also purely decorative.
