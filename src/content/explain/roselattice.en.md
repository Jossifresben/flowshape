---
source: Weisstein, E. W., "Rose", MathWorld
url: https://mathworld.wolfram.com/Rose.html
---

## Formula

    θ(n) = 2π·n / spokes                             (n = 0 … spokes − 1)
    t(m) = m / rings                                  (m = 0 … rings)
    base(m) = innerRadius + (outerRadius − innerRadius) · t(m)
    r(m,n)  = base(m) + petalDepth · cos(petals·θ(n)) · t(m)
    x = cx + r·cosθ,  y = cy + r·sinθ

## What it means

Underneath, this is an ordinary polar mesh: rings of constant radius crossed by straight spokes at even angular steps, the standard way to draw a wireframe disc. The rose curve enters as a modulation on top of that grid — the term `petalDepth · cos(petals·θ)` is exactly the classical rhodonea curve r = A·cos(k·θ), where an integer k gives k petals for odd k and 2k for even k. Rather than replacing the mesh's radius outright, that term is *added* to it, so the mesh keeps its ring-and-spoke topology while every ring bulges outward wherever cos(petals·θ) is positive and pinches inward where it is negative.

The `t(m)` factor is what turns a flat ripple into a flower: it scales the petal term by each ring's fractional distance from the centre, so the modulation is zero at the innermost ring (m = 0) and reaches full strength at the outer boundary (m = rings). The centre therefore stays an undisturbed, near-circular mesh — reading as a dark, quiet core — while the outer rings flare into the petals' full amplitude, exactly the "polar mesh warped into petals with a negative-space core" construction this pattern is built from.

Because both ring paths (closed, one per m) and spoke paths (open, one per n) are drawn through the same warped point field, the petal shape shows up twice — once as the ring outlines bending in and out, and once as the spokes fanning unevenly between them — which is what gives the lattice its woven, layered look rather than a single flat rose outline.

## Parameters

- **petals** — k in the rose term cos(k·θ); sets how many lobes the outer rings bulge into.
- **rings** — how many concentric rings make up the mesh, from centre to rim.
- **spokes** — how many angular samples make up each ring and each spoke; more spokes trace the petal curve more smoothly.
- **petalDepth** — the amplitude of the rose modulation added to the radius; 0 collapses the pattern back to a plain polar mesh.
- **innerFraction** — the radius of the innermost ring as a fraction of the outer radius, i.e. the size of the untouched core before the petal modulation takes hold.
- **strokeWidth** — the line weight of both rings and spokes; a drawing choice, not part of the rose-curve maths.
