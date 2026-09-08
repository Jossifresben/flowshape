# Stripe tiles — prior-art scan (2026-09-08)

> Research-agent output, 2026-09-08, ~45 web searches. Scope and sources as reported; verdicts are the agent's, the caveat on item 4 was checked the same day (see the outline's status). Companion to `2026-09-08-stripe-tiles-paper-outline.md`.

## Verdicts

1. **Edge-crossing invariant** (equally spaced fixed crossing points ⇒ tiles in any rotation/reflection, including crossings): **ALREADY STATED.** Virolainen (GA2017; Bridges 2023), Wendt (Bridges 2023), Reimann (Bridges 2010, 2011); implicit in Carlson 2018, Mitchell 2020, Ahmed 2014, and the game Tsuro. What is not in the literature is the (k+½)/N half-offset placement and the framing of stripes as offset curves of one base curve — a presentation choice, not a result.
2. **Band-chain decomposition** (trace side → facing side; draw per chain): **PARTIALLY.** Stated for single-strand knotwork by Kaplan & Cohen 2003 (threads as circular linked lists) and Glassner 1999 (band tracing, counting, directed skeleton); contour tracing through Truchet tilings is routine (Browne 2008). Not found: the chain as the unit that carries N stripes.
3. **Lateral flow** (sideways stripe shift by a shared phase, propagated through p ↦ p or 1−p): **NOT FOUND.** Existing Truchet animation is tile rotation or longitudinal flow along arcs in shaders. Confidence medium: Shadertoy pages were blocked.
4. **Möbius obstruction**: **NOT FOUND**, and the agent's caveat: a closed ribbon immersed in the plane has a trivial normal bundle, so a stripe at transverse position p must return to p; a round trip composing to 1−p cannot be geometric and must be a coordinate artefact or a bug. **Checked the same day: it was a tracer bug** — see the outline for the resolution.

## Sources (closest first)

1. Virolainen, S. "Random Hexagons and Other Pattern Continuities." Proc. GA2017, 331–352. https://generativeart.com/GA2017/SeveriVirolainen_longtext.pdf — stripes connect edges "at same positions at every edge"; Neil Katz's three-stripe hexagon; ABA/ABCBA edge classification.
2. Virolainen, S. "Pattern Continuity in Polygon Tessellations." Bridges 2023, 53–60. https://archive.bridgesmathart.org/2023/bridges2023-53.pdf — equidistant symmetric edge segmentation ⇒ rotation-free continuity; asymmetric edges need mirrored placement.
3. Reimann, D. A. "Patterns from Archimedean Tilings Using Generalized Truchet Tiles Decorated with Simple Bézier Curves." Bridges 2010, 427–430. https://archive.bridgesmathart.org/2010/bridges2010-427.pdf — equal subdivisions of sides ⇒ arcs from adjacent tiles form continuous segments.
4. Reimann, D. A. "Decorating Regular Tiles with Arcs." Bridges 2011, 581–584. https://archive.bridgesmathart.org/2011/bridges2011-581.pdf — d divisions per side, counting crossing-free vs crossing decorations.
5. Mitchell, K. "Generalizations of Truchet Tiles." Bridges 2020, 191–198. https://archive.bridgesmathart.org/2020/bridges2020-191.pdf — two points per side (thirds), four quarter arcs; hexagons with any number of points per side.
6. Carlson, C. "Multi-Scale Truchet Patterns." Bridges 2018, 39–44. https://archive.bridgesmathart.org/2018/bridges2018-39.pdf — arcs meeting sides at 1/3 and 2/3; 15 connection motifs including a crossing.
7. Wendt, A. E. "Pattern Gradients with Generalized Duotone Truchet Tiles." Bridges 2023, 461–464. https://archive.bridgesmathart.org/2023/bridges2023-461.pdf — colour matching under any rotation for ABA/ABCBA edges; Eduardo Nery's "Magic Tile".
8. Glassner, A. "Celtic Knots, Parts 1–3." IEEE CG&A 19(5), 19(6), 20(1), 1999–2000. https://www.glassner.com/wp-content/uploads/2014/04/CG-CGA-PDF-99-11-Celtic-Knotwork-2-Nov99.pdf — X-tiles and T-tiles (after Truchet); band tracing and counting; the directed skeleton.
9. Kaplan, M. & Cohen, E. "Computer Generated Celtic Design." EG Workshop on Rendering 2003, 9–19. https://diglib.eg.org/handle/10.2312/EGWR.EGWR03.009-019 — threads as circular linked lists, curves computed per thread.
10. Fisher, G. & Mellor, B. "On the Topology of Celtic Knot Designs." https://blakemellor.lmu.build/research/CelticKnots.pdf — strand permutations around a closed circuit; component counts.
11. Ahmed, A. G. M. "Line-Based Rendering with Truchet-Like Tiles." CAe '14, 41–51. DOI 10.1145/2630099.2630111 — weave tiles, parallel line bands; recommends tracking individual lines across tiles.
12. Reimann, D. A. Truchet resource page. http://drmathart.com/Resources/Truchet/ — hexagonal arc tiles with over/under crossings. (ISAMA 2012 "Modular knots" paper unreachable.)
13. Browne, C. "Truchet curves and surfaces." Computers & Graphics 32(2), 2008, 268–281; "Duotone Truchet-like tilings." J. Math. Arts 2(4), 2008, 189–196 — contour tracing; duotone parity of odd-sided tiles (a different parity).
14. Lord, E. A. & Ranganathan, S. "Truchet tilings and their generalisations." Resonance 11(6), 2006, 42–50. https://ericlord.neocities.org/ericsfiles/pdfs/68.pdf — review; 3D units. None of the four items.
15. Bosch, R. & Colley, U. "Figurative mosaics from flexible Truchet tiles." J. Math. Arts 7(3–4), 2013, 122–135. — not relevant.
16. Smith, C. S. & Boucher, P. "The Tiling Patterns of Sebastien Truchet and the Topology of Structural Hierarchy." Leonardo 20(4), 1987, 373–385. — the N = 1 baseline.
17. Complex Projective 4-Space, "Generalised Truchet tiles" (2013). https://cp4space.hatsya.com/2013/01/09/generalised-truchet-tiles/ — checkerboard parity of crossing tiles (adjacent only).
18. Shadertoy: Shane, "Square Truchet Flow" (2017) https://www.shadertoy.com/view/XtfyDX; BigWings, "Hexagonal Truchet Weaving" (2017) https://www.shadertoy.com/view/llByzz; Shane, "Animated Two-Tiled Truchet" (2020) https://www.shadertoy.com/view/tsSfWK — longitudinal flow, per-pixel; snippets only.
19. Gonsalves, L. "Truchet Tiles variant: Intertwined quarter circles." Observable. https://observablehq.com/@xenomachina/truchet-tiles-variant-intertwined-quarter-circles
20. Nijhoff, R. "Truchet tiles: simple rules, infinite patterns" (2019). https://reindernijhoff.net/2019/10/truchet-tiles-simple-rules-infinite-patterns/ — ribbons between connection points, per tile.
21. Rombo.tools, "Truchet Pattern" (2026-01). https://www.rombo.tools/2026/01/05/truchet-pattern/ — "bands" parameter; entry/exit points always align.
22. Lomonaco & Kauffman knot mosaics (2008); corner-connection variants arXiv:2306.09276, 2311.12258. — formal cousin of the N = 1 cross glyph.
23. Wikipedia "Truchet tiles"; Tsuro; Trax; Black Path Game — N = 2 edge-matching in play.

Not found in any phrasing: Truchet + Möbius / non-orientable / holonomy; Jerry Krisher; "Bauhaus tiles generator" (unrelated poster tools).

## Bottom line (agent's)

A paper resting on item 1 alone is not warranted. Items 2 and 3 in their multi-stripe form are absent and would be the contribution: a short Bridges-style note on stripe bundles as the drawing unit with seam-free transverse animation, positioned against Reimann/Virolainen for the invariant and Glassner/Kaplan–Cohen for chain tracing. Item 4 should not be claimed.
