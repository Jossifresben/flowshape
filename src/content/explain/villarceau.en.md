---
source: Hopf, H. (1931) "Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche", Mathematische Annalen 104, 637–665; the ribbon reparametrisation and the SO(4) motion are this project's own construction
url: https://en.wikipedia.org/wiki/Hopf_fibration
doi: 10.1007/BF01457962
construction: original
---

## Formula

    fiber over p ∈ S³:      { p·e^{iτ} : τ ∈ [0, 2π) }
    Hopf map:                h(p) = p·i·p̄  ∈ S²
    stereographic proj.:     S³ \ {pole} → ℝ³
    rotation, one parameter: R(φ): p ↦ q(φ)·p,
                              q(φ) = cos(πφ) + sin(πφ)·n,  n a unit pure quaternion
                              R(1) = −I  (the antipodal map)

## What it means

Every point of the 3-sphere sits on exactly one great circle of a very particular family: multiply it by e^{iτ} and it sweeps out a fiber, and the fibers partition all of S³ without touching. Hopf's 1931 map sends each fiber to a single point of the ordinary sphere S², so the 3-sphere turns out to be a bundle of circles standing over a sphere — one of the first genuinely three-dimensional shapes topologists learned to see. Project that structure into ordinary space with stereography and every fiber becomes an honest circle; the fibers lying over one latitude of S² form a torus of circles that spiral around it twice, called Villarceau circles after the astronomer who first noticed a plane could slice a torus into circles instead of the expected ellipses. Nested latitudes give nested tori, and because every fiber links every other, the whole figure reads as rings threaded through rings rather than a flat weave.

The motion is not chosen by eye — it is forced by the group. Left-multiplying every point of S³ by a one-parameter family q(φ) is a rigid rotation of the whole 4-dimensional sphere, and because that multiplication happens on the opposite side from the τ that defines a fiber, it always carries fibers to fibers: whatever q(φ) does, the bundle structure survives it. At φ = 1 the rotation reaches q = −1, the antipodal map, which acts on every fiber as its own half-turn — the point returns to a point already on its circle, so the drawn ribbons close the loop exactly, by the group law itself rather than by any seam stitched in afterwards. That is the same standard the project holds knot's coprime frequencies and mystery's Farris congruence to.

The axis of that rotation, tilted away from the pole of the projection, is what makes the tori roll through one another instead of spinning rigidly in place; near the far side of the tilt range the band sweeps across the projection's own pole and the rings turn inside out through infinity, an effect the code clips rather than lets explode off the page.

## Parameters

**Latitudes** sets how many nested tori are drawn, spaced across the band. **Fibers** is how many Villarceau circles make up each torus's ribbon. **Spread** is how far around each torus that ribbon's fibers reach — small values leave a thin twisted band, large ones cover the whole torus. **Nest** widens or narrows the span of latitudes, so the tori sit close together or spread far apart. **Pole** moves the stereographic projection point off the sphere itself, which pulls the outer rings in from infinity. **Tilt** angles the rotation axis away from the tori's own axis — at zero the figure spins in place, at one it turns inside out. **View** tips the whole projected scene, from looking straight down the shared axis to side-on.
