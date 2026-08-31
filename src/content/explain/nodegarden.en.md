---
source: Gilbert, E. N. (1961) "Random Plane Networks", Journal of the Society for Industrial and Applied Mathematics 9(4), 533–543 (the random geometric graph — points joined whenever they fall within a fixed radius of each other — is this pattern's underlying model); the jittered-lattice placement, the rim-to-rim edge trimming and the phase-driven drift orbit are this project's own construction
url: https://epubs.siam.org/doi/10.1137/0109045
doi: 10.1137/0109045
construction: original
---

## Formula

    p(i,j) = lattice(i,j) + jitter·ξᵢⱼ + drift·N(x + ρ·cos2πph, y + ρ·sin2πph)

    edge(a,b) exists  ⇔  dist(pₐ, p_b) < radius

    opacity(edge) = 1                                          if dist ≤ radius·(1 − edgeFade)
                  = 1 − (dist − radius·(1−edgeFade)) / (radius·edgeFade)   otherwise, → 0 at dist = radius

## What it means

Gilbert's 1961 paper asked a simple question about a scatter of random points: join any two that land within a fixed radius of each other, and what does the resulting network look like? The answer — clusters, chains, and open voids, rather than a uniform mesh — is the random geometric graph, and it is exactly this pattern's rule for when a line gets drawn.

What is this project's own is where the points start from and how the graph is rendered. Rather than a pure scatter, the points sit on a regular lattice displaced by a small jitter — rows and columns stay legible at a glance, and it is the jitter alone that occasionally brings a pair of neighbours close enough to connect. Because the dots are drawn large and the connection radius sits a little under the lattice spacing, most points carry no edge at all at the defaults; the handful that do are the composition; a network isn't the goal, a scattering of small constellations is. Edges are trimmed rim-to-rim rather than centre-to-centre, so the drawn line is the actual gap of paper between two dots rather than a segment half-buried under the fills it joins — and as a pair drifts toward the connection radius, `edgeFade` fades its line to nothing exactly at the crossing, so a connection breaks by dimming rather than by popping.

Motion comes from a single closed orbit: the jitter never moves, but each point's displacement also reads a noise field at a point that circles once around a fixed loop in noise space every cycle. A closed loop is the only path that can return the noise read to exactly where it started — value noise has no period of its own — so phase 0 and phase 1 sample the identical field and the loop closes without a seam. As points drift, distances cross the radius threshold in both directions, and the whole garden reads as points and their edges quietly forming and dissolving as the field breathes.

## Parameters

- **cell** — the underlying lattice spacing. A structural axis: it relays the whole grid.
- **jitter** — how far each point may wander from its lattice slot; the character of the "garden" versus a rigid grid.
- **radius** — the connection distance. The pattern's own drama knob — audio and small nudges alike make more or fewer pairs cross it.
- **drift** — the amplitude of the phase-driven noise displacement that carries the intrinsic motion.
- **dotSize** — the drawn radius of each point; also sets how far an edge is trimmed back from either endpoint.
- **edgeFade** — how much of an edge's length fades continuously toward the connection radius, versus popping on and off at a hard cutoff.
- **strokeWidth** — line thickness. A rendering choice.
- **opacity** — the base opacity every point and edge is scaled against.
