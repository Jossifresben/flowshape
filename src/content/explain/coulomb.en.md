---
source: Jobard, B. & Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density", Visualization in Scientific Computing '97 (field is the classic 2D electrostatic point-charge field)
url: https://link.springer.com/chapter/10.1007/978-3-7091-6876-9_5
---

## Formula

    E(r) = Σᵢ qᵢ (r − rᵢ) / |r − rᵢ|²          (n point charges qᵢ ∈ {+1, −1} at positions rᵢ)

    step:  r ← r + h · E(r) / |E(r)|            (unit-speed streamline integration)

## What it means

Every point in the plane has a field vector: the sum of the pull or push from every charge, each contributing a vector that points toward it (if negative) or away from it (if positive), weighted inversely by the square of the distance — the same inverse-square law that governs real electrostatics. A streamline is what you get by dropping a test point anywhere and letting it walk, one small step at a time, always in the direction the local field points. Because charges alternate sign around a jittered ring, most streamlines curve away from a positive charge and arc toward the nearest negative one, tracing the same field-line loops you'd see in a textbook diagram of two opposite point charges — except here there are many charges, and hundreds of independent streamlines seeded across the frame trace out the whole shape of the field at once.

To keep field lines from blowing up to infinite velocity right next to a charge — physically real for a true 1/r² singularity — the distance term is floored at a minimum (the core radius), and streamlines are stopped outright once they get close enough to a charge to be redundant. Streamlines are also stopped, or never drawn, if they'd retrace ground another line has already covered, checked against a coarse occupancy grid — a simplified stand-in for the adaptive, density-controlled streamline placement Jobard and Lefer describe, aimed at the same goal: even visual coverage without needless overlap, rather than their full separating-distance algorithm.

## Parameters

- **charges** — n, the number of point charges placed with jitter around a ring, alternating sign. This sets the field's topology directly: it decides how many sources and sinks organize the flow, and therefore how many distinct arcing regions the streamlines fall into.
- **spacing** — the grid pitch streamline seeds are sampled from. A mathematical/sampling parameter: tighter spacing seeds more streamlines and reads as denser field coverage.
- **steps** — the maximum number of integration steps allowed per streamline before it's cut off, regardless of where it ends up.
- **coreRadius** — the minimum distance from a charge a streamline can approach before it's stopped, and also the floor applied to the distance term in the field equation itself so it never divides by (near-)zero. Part of the field's own regularization, not just a stopping rule.
- **strokeWidth** — line thickness. A rendering choice.
- **emphasisEvery** — every k-th surviving streamline is drawn thicker and fully opaque instead of thin and translucent. A purely visual accent with no effect on the field or the paths themselves.
