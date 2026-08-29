---
source: Isometric projection; painter's algorithm (Newell, Newell & Sancha, 1972, "A Solution to the Hidden Surface Problem")
url: https://en.wikipedia.org/wiki/Painter%27s_algorithm
---

## Formula

    isometric projection (unit cube, edge s = 1):
      w = (s·√3) / 2,  h = s / 2,  v = s
      screenX(i,j,k) = (i − k)·w
      screenY(i,j,k) = (i + k)·h − j·v

    painter's-algorithm depth key:
      depth(i,j,k) = i + j + k
      draw cells in ascending order of depth  (farthest first, nearest last)

## What it means

Every voxel sits at an integer lattice coordinate (i, j, k) inside a bounding shape — a sphere (i²+j²+k² ≤ D²), a cube (unconditional), or a torus (a ring implicit surface in i,k with thickness in j). Isometric projection flattens that 3D lattice to 2D by projecting along the cube diagonal, which is why the three visible cube faces (top, left, right) all draw as parallelograms of the same size and the whole form reads as "solid" without any true perspective distortion — it's the standard axonometric convention used in isometric pixel art and CAD wireframes alike.

The one detail that makes an isometric drawing of many overlapping cubes look right, instead of a jumble, is drawing them in the correct back-to-front order. This pattern sorts cells by i + j + k before drawing. That sum is not an arbitrary choice: it's the only linear combination of (i, j, k) that increases strictly as a cube moves along the cube diagonal — the one 3D direction the isometric projection collapses to a single screen point (zero screen displacement). Every other direction changes i+j+k *and* moves on screen, so two cells can never have the same screen position while differing in depth-order along any axis except that diagonal — which is exactly why i+j+k, and nothing else, produces a pixel-correct painter's-algorithm ordering here.

scatter is the one parameter here that changes the actual mathematical set of cells kept, not how they're drawn: each lattice cell draws one PRNG value in a fixed, coordinate-ordered stream, and a cell is dropped if that value falls below scatter — a genuine seeded thinning of the solid, which is why different seeds visibly reshape the silhouette. shellOnly, by contrast, only removes *interior* cells (ones with all six neighbours present) — cells that a solid opaque render would never show anyway, since the painter's algorithm already draws over them. It's a pure performance optimisation: for an opaque form, shellOnly = on and off produce pixel-identical output, just with far fewer polygons in the off state's interior.

## Parameters

- **shape** — which implicit bounding surface the lattice is clipped to: sphere, cube, or torus. This is the actual mathematical definition of the solid.
- **dimension** — the lattice's half-extent D; larger values mean more, smaller voxels packed into the same bounding shape.
- **gap** — shrinks each drawn face toward its own centroid, opening a visible seam between neighbouring voxels; a rendering choice, not part of the lattice or projection maths.
- **shellOnly** — drops interior cells that a solid render would never reveal. A performance optimisation, invisible in the output for an opaque solid — see above.
- **scatter** — the seeded probability threshold below which a lattice cell is culled. Genuinely mathematical: it changes which cells exist in the set being projected, not just how they're drawn.
- **faceShading** — how much darker the left and right isometric faces are drawn relative to the top face; a drawing choice standing in for a fixed light direction.
- **depthShading** — how much cells farther along the painter's-algorithm depth axis are dimmed relative to nearer ones; a drawing choice layered on top of the depth sort, not the sort itself.
- **strokeWidth** — the outline weight on each drawn face; a drawing choice.
