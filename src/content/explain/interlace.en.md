---
source: Celtic knotwork construction (Cromwell, P.R., 1993, "Celtic Knotwork: Mathematical Art", The Mathematical Intelligencer 15(1), 36–47); the free over/under rests on the honeycomb graph being bipartite — a graph is bipartite iff it contains no odd cycle (Kőnig, D., 1916)
url: https://doi.org/10.1007/BF03025256
---

## Formula

    honeycomb, pointy-top axial coords (q, r), hexagon circumradius S:
      C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
      u_k    = ( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5
      V_k    = C + S·u_k          honeycomb vertex, valence 3
      P_k    = C + rs·S·u_k       ring corner        (rs = ringScale)

    bipartite class of a corner:  class(V_k) = k mod 2   (same from all 3 faces)
      k even (sublattice A): ring over arm  → cut the arm
      k odd  (sublattice B): arm over ring  → cut the ring

    crossing angle is a constant θ = 60°; band width W = ribbonWidth·S
      gap half-length  t₀ = ( W/2 + (W/2)·cos θ ) / sin θ  ·  gapScale
      t_ring = min(t₀, 0.4·edge),   edge = rs·S
      arm run  d = (1 − rs)·S,  length L = d + 0.5·t_ring + 0.7·W
      t_arm  = min(t₀, 0.4·L)

    band = one ink stroke of width W, overdrawn by a paper stroke of width core·W

## What it means

Two families of strand are drawn, and only two. Every hexagonal face of the honeycomb carries a closed hexagonal ring, shrunk to `ringScale` of the face. Every honeycomb *vertex* — a corner shared by three faces — carries a Y-shaped tri-radiate strand whose three arms run inward along the three face bisectors and cross the three rings around it. That is the whole cast: rings and Ys, on a lattice, forever.

The over/under alternation, which in hand-drawn Celtic knotwork is the fiddly part, is free here, and the reason is a piece of graph theory. The honeycomb graph is bipartite: its vertices split into two classes — the A and B sublattices familiar from graphene — such that every edge joins an A to a B. Travelling around any hexagonal face you therefore visit A, B, A, B, A, B and return to where you started. Assign "the ring passes over the arm at A-corners, the arm passes over the ring at B-corners" and the ring's own crossing sequence reads over, under, over, under, over, under all the way round — perfect Celtic alternation, on every ring in the plane, with zero randomness and zero bookkeeping. Better still, the class is computable locally with no lookup at all: index the corners k = 0..5 from the lattice's own angular origin and the class is exactly k mod 2, and it agrees across all three faces sharing that corner. The corner sitting at −90° of one face is the corner at +30° of one neighbour and at +150° of the other — indices 0, 2, 4, all even. Every corner behaves the same way.

The load-bearing fact is that six is even, and it is worth being precise about what fails otherwise. Each ring crosses exactly one arm per corner, so the ring's crossings form a closed cyclic sequence with as many terms as the face has sides. A closed cycle of odd length cannot alternate — go over, under, over around five corners and the fifth crossing meets the first with the same value, a defect. This is the same parity obstruction that makes a graph bipartite exactly when it has no odd cycle. So on a triangular or pentagonal lattice the failure is not that this rule is inconvenient and needs more bookkeeping; it is that *no* assignment of any kind makes those rings alternate. Hexagons are not a stylistic choice for this weave, they are the cheapest even-sided face that admits it.

The second thing worth understanding is that the over/under is not painted, it is *cut*. Where a strand goes under, it is broken either side of the crossing by the gap half-length t — the classic Celtic-knot break — and the strand that goes over is simply left whole. Nothing in the finished drawing overlaps anything else, so the paint order is genuinely irrelevant: the four SVG paths (ink ring, paper ring, ink arm, paper arm) can be emitted in any order and the image is identical. A paint-order weave would need a per-crossing z-decision and a stable sort; this needs neither, and it stays four paths no matter how many thousand crossings are on screen. The gap length is derived rather than guessed: both ring edges leave a corner at 60° to that corner's bisector and the arm runs along the bisector, so the crossing angle is a constant 60° everywhere, and t₀ = (W/2 + (W/2)·cos 60°)/sin 60° is exactly the clearance at which the under-strand's butt-capped end stops touching the over-strand's band. `gapScale` scales that baseline; at 1 it is the mathematical minimum.

The ribbon itself is drawn with no offset-curve mathematics at all. A wide stroke in ink is laid down along the path, and a narrower stroke in paper is drawn over it along the same path; what survives is a band with two exactly parallel ink edges around a paper core, with correct joins and caps for free from the stroker. There are no parallel curves to compute, no polygon booleans, no self-intersection cleanup — the same trick `girih` uses for its ribbons mode, and the reason both patterns can afford a ribbon look in a handful of path elements.

The construction has three guardrails, all of them clamps that are inert at the shipped defaults and only bite when a fat ribbon meets a large ring. `ringScale` is capped at 1 − 1.5·ribbonWidth so each arm keeps at least one and a half band widths of free run before it reaches its ring; the ring gap is capped at 40% of a ring side and the arm gap at 40% of the arm, so a cut can never eat the strand it is cutting; and the arms overshoot the ring's cut ends by 0.5·t_ring + 0.7·W, because a pass-over that stops level with the gap reads as two strands that merely happen to end near each other.

## Parameters

- **cell** — S, the honeycomb's circumradius and hence its period. The whole drawing is similar to itself at every value, so this is scale, not shape.
- **ribbonWidth** — W as a fraction of the cell. Nominally the ribbon's thickness, but it is not merely cosmetic: it feeds the derived gap length and it sets the cap on `ringScale`, so at high values it genuinely moves geometry.
- **ringScale** — rs, the ring corner's distance from the face centre as a fraction of S. Real geometry: it decides how much of the face the ring fills and, with it, the arms' free run (1 − rs)·S. Silently capped at 1 − 1.5·ribbonWidth.
- **coreRatio** — the paper core's width as a fraction of the band, i.e. how heavy the ribbon's two ink edges look. Purely a drawing choice, bounded so the edges never vanish below `strokeWidth`.
- **junctions** — with it off, the tri-radiate strands are omitted entirely and the rings are left whole: a plain tiling of hexagonal rings with no crossings at all. This changes what exists in the drawing, not how it is drawn — the weave is only a weave when this is on.
- **gapScale** — multiplies the derived gap half-length t₀. A drawing choice with a meaningful baseline: at 1 the gap is exactly the clearance at which the under-strand's cap stops touching the over-strand. Below 1 the break closes up and the crossing muddies; well above it the strands read as broken rather than woven.
- **strokeWidth** — a floor on the weight of the ribbon's two ink edges, applied by capping the paper core at W − 2·strokeWidth, so a thin ribbon still reads as a band rather than a hairline pair. A drawing choice.
