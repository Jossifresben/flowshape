---
source: Mumford, D., Series, C., Wright, D., "Indra's Pearls: The Vision of Felix Klein" (Cambridge University Press, 2002)
url: https://en.wikipedia.org/wiki/M%C3%B6bius_transformation
---

## Formula

    T(z) = (z − p)/(z − q)   sends the fixed points p → 0, q → ∞
    M = T⁻¹ ∘ (λ·) ∘ T,   λ = s·e^{iθ},  0 < s < 1
    Each circle drawn is M^u(C₀) for integer u; the animation uses real u.

## What it means

A Möbius transformation is a map of the plane built from the four simplest moves there are — shift, rotate, scale, invert — and it has one property that borders on the miraculous: it sends every circle to another perfect circle. No sampling, no approximation; a circle's image has a closed formula.

The *loxodromic* kind has two fixed points and a complex multiplier λ that both shrinks (|λ| < 1) and turns (the angle of λ). Conjugated to the origin, it is just "multiply by λ": every orbit spirals inward along a logarithmic spiral. Undo the conjugation and the same story plays out between the two fixed points p and q — every seed circle, iterated forward and backward, marches out of q and spirals into p along a double-armed vortex. The name is borrowed from navigation: a loxodrome is the rhumb-line course that crosses every meridian at a constant angle, and these orbits cross the family of circles through p and q at a constant angle in exactly the same way.

This is the geometry of *Indra's Pearls*, the Kleinian-group imagery Mumford, Series and Wright traced back to Felix Klein's school. And because λ^u makes sense for fractional u, the discrete chain of circles extends to a continuous flow — the animation slides every circle one step along its own orbit per cycle, so the figure flows through itself and returns exactly.

## Parameters

**Seeds** sets how many circle chains ride the flow, **steps** how far each is iterated both ways. **Twist** is the rotation per step and **shrink** the contraction — together they are λ. **Seed size** and **spread** place the starting circles, reshaping the vortex they are carried into.
