---
source: Poincaré disk model of the hyperbolic plane — geodesics are circular arcs orthogonal to the boundary; Coxeter, H.S.M. (1979) "The Non-Euclidean Symmetry of Escher's Picture 'Circle Limit III'", Leonardo 12; the closed coprime walk and its rippled symmetry are this project's own construction
url: https://en.wikipedia.org/wiki/Poincar%C3%A9_disk_model
doi: 10.2307/1574078
construction: original
---

## Formula

    B = m · grain points on the unit circle:  Pⱼ at angle θⱼ = 2πj/B + ripple(j)
    walk j → j + δ (mod B), with δ coerced to the nearest integer coprime with B
    geodesic from u to v: the circle through both, orthogonal to the rim —
    centre (u+v)/(1+u·v),  radius √((1−u·v)/(1+u·v))
    ripple(j) = a · sin(2π·w·j/grain + φ),  exactly (B/m)-periodic in j

## What it means

In the Poincaré disk — the map of the hyperbolic plane that Escher's *Circle Limit* prints are drawn on — a straight line does not look straight. The shortest path between two boundary points is a circular arc that meets the rim at right angles, bowing away from the centre. That bow is the signature of hyperbolic geometry: arcs hug the boundary, so ink piles up near the rim like the border of an engraving, exactly as Escher's fish shrink toward the edge of their disk.

This pattern draws one single closed walk of such geodesics, and two theorems keep it orderly. First, the step δ is coerced to the nearest integer coprime with B, so the walk is forced to visit *all* B boundary points before closing — one continuous line, guaranteed by arithmetic, never by luck. Second, the walk's edge set is carried onto itself by rotation, and the seed's ripple — a wave in the point angles that is exactly (B/m)-periodic in the point index — cuts that full symmetry down to exactly m-fold. The symmetry you see is forced by the construction, not tuned into it.

One cap protects the look: a walk step near B/2 would join nearly diametral pairs, whose geodesics flatten into straight chords through the centre. The step is therefore held under ~0.25·B, where every arc still bows visibly, so the figure stays hyperbolic at every value the controls can reach. In motion the whole figure precesses by exactly one symmetry step per cycle — the m-fold symmetry makes that the identity at the wrap — while the ripple travels once around its own sector.

## Parameters

**Symmetry** is m, the enforced rotational order. **Grain** sets how many points each symmetry sector holds (B = m·grain in all). **Wind** asks for a walk step, remapped under the cap and coerced coprime — small steps hug the rim, large ones open the star. **Ripple** is the seed wave's amplitude, a shimmer on the rim that never breaks the theorem. **Layers** overlays the walk a little further along its own motion, a fanned trail. The seed rolls a new ripple — a new weave, the same order.
