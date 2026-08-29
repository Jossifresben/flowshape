---
source: Rhombille ("tumbling blocks") tiling, the dual of the trihexagonal tiling — Grünbaum, B. & Shephard, G.C. (1987) "Tilings and Patterns"; nonzero winding rule, W3C SVG 1.1 §11.3 "fill-rule"
url: https://en.wikipedia.org/wiki/Rhombille_tiling
---

## Formula

    pointy-top hexagon of circumradius S about centre C:
      V_k = C + S·(cos(−π/2 + kπ/3), sin(−π/2 + kπ/3)),   k = 0…5

    its three 60°/120° rhombi — exactly the three visible faces
    of an isometric unit cube of edge S:
      top   = (C, V₅, V₀, V₁)
      right = (C, V₁, V₂, V₃)
      left  = (C, V₃, V₄, V₅)

    rhombille lattice, axial coordinates (q, r):
      C(q,r) = (S·√3·(q + r/2),  S·1.5·r)

    ring n = 0 … depth−1, of one rhombus:
      outer scale  sₙ = ratio ⁿ        inner scale  sₙ·ratio
      band = quad(C, A, M, B) at sₙ  +  quad(C, B, M, A) at sₙ·ratio
                                        ↑ reversed winding ⇒ a hole
                                          under fill-rule="nonzero"

    fill parity:   ink  ⇔  (n + (twist ? f : 0)) mod 2 = 0
    core cube:     scale = min(coreSize, 0.8 · ratio^depth)

## What it means

Start with the fact that makes the whole picture legible. Under isometric projection a unit cube's three visible faces each map to a rhombus of unit side with angles 60° and 120°, and those three rhombi share the projected corner vertex. Their union is not merely hexagon-*ish*: it is exactly a regular hexagon of circumradius equal to the cube's edge. That identity is why the rhombille tiling — the dual of the trihexagonal tiling, known to quilters as "tumbling blocks" — reads as a wall of stacked cubes rather than as a field of diamonds, and it is why the tiling supports the classic Necker-cube flip where the same drawing reads convex or concave depending on which rhombus you take as the top face. This file inherits the identity from the voxel pattern's projection deliberately: face 0 here is voxel's top face, face 1 its +x, face 2 its −x, and the core cube's tones follow the same assignment so a core shades the way a voxel cube shades.

On top of each rhombille cell the pattern nests concentric scalings of the whole hexagon about its centre, by a fixed factor `stepRatio` per step. Because the scaling is uniform and about the shared vertex C, each ring's rhombi are *strictly inside* the previous ring's, with no partial overlap anywhere. That has a pleasant consequence for occlusion: painter order is not something you compute here, it is the loop counter. Emitting rings outermost-first is already correct back-to-front order, so unlike voxel or isoweave there is no depth key, no sort and no comparison of any kind in this file.

The implementation then goes one step further and removes the need for paint order at all. Instead of stacking `depth` solid hexagons and letting the later ones cover the earlier ones, it emits each ring as a **band**: the outer rhombus, followed immediately by the inner rhombus wound the other way round. Under `fill-rule="nonzero"` the reversed subpath contributes the opposite winding number, so the interior cancels to zero and becomes a hole — the same rule that hollows the counter of a letter *o* in a font outline. The band that survives is the annulus between scale sₙ and scale sₙ·ratio, which is pixel-for-pixel what the overlapping-solids version would have shown. Since every band in a bucket is now disjoint from every other, all the ink bands in the entire frame can share a single `<path>` and all the paper bands another, at any lattice density. The whole image costs about seven SVG elements: one paper path, one ink path, one hatch path, three core-face paths and one stroke path. That is the difference between an SVG that scales to a wall poster and one that ships tens of thousands of polygons.

The depth reading itself comes from a two-value parity fill and nothing else. A ring is inked when `(n + f·twist) mod 2 = 0` and left as paper otherwise — no mid-tones, no gradient, no opacity ramp on the rings at all. Alternating light and dark concentric steps is enough for the eye to read each cell as a square shaft receding along the cube's body diagonal, the same way an engraver gets depth out of pure black line on white paper. It is also what makes the pattern survive the project's monochrome defaults intact: at two values there is nothing to lose to a low-contrast palette or a bad print. `twist` adds the face index *f* to the parity, so the three rhombi of a cell fall out of phase with each other and the concentric rings become a pinwheel — a genuine change to the parity function, not a rotation of the drawing.

Two degeneracies are guarded rather than left to bite. The core cube is clamped to `0.8 · ratio^depth` so it stays strictly inside the innermost hole instead of fusing with the last frame (at depth 5 and stepRatio 0.88 the innermost hole reaches 0.53 while `coreSize` can reach 0.5). And ring generation stops early once a ring's circumradius falls under one stroke diameter, because such a ring would be pure stroke with no fill visible at all — which means the effective ring count can be smaller than the `depth` you asked for at low `stepRatio`. In `hatch` mode the hatching is likewise exact rather than clipped: the rhombus is parameterised as C + a·e₁ + b·e₂ with a, b ∈ [0,1], the hole is precisely the region a, b < ratio, so a line at constant b runs a: ratio→1 below the hole and a: 0→1 above it, with no clip path and no overdraw anywhere.

## Parameters

- **cell** — S, the circumradius of the hexagon and so the pitch of the rhombille lattice. Sets how many shafts fill the frame; the tiling itself is the same object at every value.
- **depth** — how many nested rings each cell carries. Genuinely changes the object drawn, not its styling — though the realised count can come out lower when small rings are dropped for falling under one stroke diameter.
- **stepRatio** — the self-similar scale factor between one ring and the next, and the single number that decides how steeply each shaft appears to recede. Mathematical: it defines the nesting, and it also defines exactly where the hole sits in the hatch parameterisation.
- **coreSize** — the edge of the small solid cube at the dead centre, so each shaft bottoms out in an object rather than in a hole. Mathematical (it adds a solid to the figure), and clamped to stay inside the innermost ring. At 0 the shaft simply runs to a point.
- **render** — frames (solid parity bands), outline (pure line art, no fills at all — a paper fill there would be indistinguishable from the background), or hatch (ink rings replaced by exact hatching, paper rings still solid). A drawing choice over unchanged geometry.
- **twist** — adds the face index to the fill parity, breaking the three rhombi of a cell out of phase and turning concentric rings into a pinwheel. This changes the parity function itself, so it is a change to the mathematical object, not a restyling.
- **faceShading** — how much darker the two side faces of the **core cube** are drawn relative to its top face. Narrower than it looks: the tone array it feeds is used only by the core, so this has no effect at all when `coreSize` is 0 or in outline mode. A drawing choice standing in for a fixed light direction.
- **strokeWidth** — the ink weight on every rhombus outline. Mostly a drawing choice, with one real side effect: it is the threshold that stops ring generation once a ring would be thinner than one stroke diameter.
