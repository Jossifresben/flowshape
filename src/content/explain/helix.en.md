---
source: Helix, parametric double-helix curve; cf. Wikipedia, "Helix"
url: https://en.wikipedia.org/wiki/Helix
construction: original
---

## Formula

    t(k)  = (k / N) · turns · 2π                    (k = 0 … N)
    x(t,φ) = cx + radius · cos(t + φ)
    y(t)   = yTop + (t / tMax) · usableHeight
    z(t,φ) = sin(t + φ)

    strand A: φ = 0        strand B: φ = π
    rung at k:  segment from strand A's point to strand B's point, same k

## What it means

A helix is a curve that turns at constant angular speed around an axis while advancing at constant linear speed along it — here x and z trace the circular cross-section (cos and sin of the same angle t) while y climbs steadily down the frame as t increases. Two copies of that curve, offset by exactly π in phase, sit on opposite sides of the axis at every height: that's the double-helix construction, and because the offset is a half turn, strand B is always exactly where strand A was a half-turn ago — the two never touch but stay in constant mirrored relation, the classic ladder shape.

z here is a genuine third coordinate, not a rendering trick: it's the depth component that a straight top-down orthographic view of the helix would normally discard. The pattern keeps it and uses it for shading instead of projection — each strand segment's stroke width scales with the average z of its endpoints via depthFade, so the parts of the curve swinging toward the viewer (z near +1) draw heavier than the parts swinging away (z near −1). That's what fakes depth in a flat SVG: no true 3D projection, just width standing in for distance.

Rungs are drawn first, then both strands on top, so the strands always read as being in front of the rungs — a simple painter's-order trick, not part of the helix geometry itself. rungEvery controls how many of the N sampled rungs actually get drawn; skipping some keeps the ladder look without every single cross-section being wired in.

## Parameters

- **turns** — how many full 2π rotations the helix makes from top to bottom of the frame; more turns means a tighter, denser coil.
- **radiusFraction** — the helix's radius as a fraction of the frame's shorter side.
- **rungEvery** — how often (in sampled steps) a rung is drawn between the two strands; a sampling/drawing choice, not part of the helix's own geometry.
- **depthFade** — how strongly the z-coordinate is allowed to swing stroke width between thin and thick; 0 removes the depth illusion entirely and every segment draws at the same weight.
- **strokeWidth** — the base line weight before depth shading is applied; a drawing choice.
