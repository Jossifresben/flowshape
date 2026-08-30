---
source: Delaunay, B. (1934) "Sur la sphère vide", Bulletin de l'Académie des Sciences de l'URSS; Bowyer, A. and Watson, D.F. (1981), independent incremental algorithms
url: https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm
doi: 10.1093/comjnl/24.2.162, 10.1093/comjnl/24.2.167
---

## Formula

    A triangulation T of point set P is Delaunay iff:
      no point of P lies inside the circumcircle of any triangle in T

    Bowyer–Watson (incremental construction):
      start with one "super-triangle" enclosing all points
      for each point p in P:
        find every triangle whose circumcircle contains p   ("bad" triangles)
        remove them, leaving a star-shaped polygonal hole
        re-triangulate the hole by connecting p to each edge of its boundary
      discard any triangle that still touches the super-triangle

## What it means

The defining rule — no other point may sit inside a triangle's circumcircle — sounds narrow, but it has a strong practical consequence: among every possible way to triangulate a set of points, the Delaunay triangulation is the one that avoids thin, needle-like triangles as much as possible. It maximizes the smallest angle that appears anywhere in the mesh, which is exactly why it is the standard choice for terrain meshes, low-poly art, and finite-element grids — nobody wants a sliver triangle.

The construction used here builds that triangulation one point at a time. It starts from a single triangle so large it swallows the whole canvas, then inserts each real point in turn: any existing triangle whose circumcircle now contains the new point is no longer valid — those get deleted, leaving a polygonal hole around the new point — and the hole gets refilled by fanning new triangles out from the point to each edge of the hole's boundary. Once every point has been inserted this way, the oversized starting triangle and anything still touching it are thrown away, leaving a clean triangulation of just the real points.

Both display modes in this pattern draw the identical mesh — mode only changes whether the triangles are shown as an open wireframe or filled as solid mosaic tiles.

## Parameters

- **points** — the number of randomly scattered sites to triangulate. More points give a finer mesh with smaller triangles.
- **mode** — edges draws the triangulation as an unfilled wireframe; mosaic fills each triangle with a flat color. A rendering choice; the underlying triangulation is the same either way.
- **strokeWidth** — line width of the triangle edges.
- **vertexSize** — radius of the dot drawn at each site, shown only in edges mode. 0 hides them. A rendering choice.
- **accentEvery** — in mosaic mode, sets how often a triangle (by index) is filled ink or accent instead of paper, creating a periodic color rhythm across the mesh. Purely decorative — it has no effect on the geometry.
