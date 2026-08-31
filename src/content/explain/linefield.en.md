---
source: Stream function formulation of a divergence-free 2D vector field (classical vector calculus — a planar field is the curl of a scalar stream function exactly when it is divergence-free; cf. the Helmholtz decomposition); domain warping after Quílez, I. (2002) "Domain Warping"; the vortex/curl-wave field composition, its forced-order coherence and its phase motion are this project's own construction
url: https://en.wikipedia.org/wiki/Stream_function
construction: original
---

## Formula

    V(x,y) = swirl · Σᵢ (−Δyᵢ, Δxᵢ) · sᵢ · exp(−|Δᵢ|² / 2σᵢ²)          (vortices, Δᵢ = (x,y) − centreᵢ)
             + waviness · Σⱼ (kyⱼ, −kxⱼ) · Aⱼ · cos(kxⱼ·x + kyⱼ·y + φⱼ)  (curl waves)

    (x, y) evaluated at the warped coordinate  x′ = x + warp·N₁(x,y),  y′ = y + warp·N₂(x,y)

    θ(x,y) = atan2(Vy, Vx)                      (stroke orientation, θ ≡ θ + π)

## What it means

Every stroke on the grid points the way a tiny compass would if it were dropped at that spot into a wind: the direction comes from a vector field, and the field is built so that it can only ever swirl. Each vortex term above is the curl of a Gaussian bump, and each wave term is the curl of a plane sinusoid — and the curl of *any* scalar function is automatically divergence-free, which in a flow means there are no sources and no sinks: nothing can spray outward or drain away. Coherence between neighbouring strokes is therefore a theorem, not a tuning choice — nearby strokes agree because they sample the same smooth field, never because they were nudged toward agreement.

The vortices set the broad structure — alternating rotation directions, so the eye reads counter-spinning wheels stitched into one fabric — and the curl waves ride on top as smaller, local bending, exactly the "large coherent movement, then local bending, then another coherent region" the pattern was briefed to reach. Before either is sampled, the coordinates themselves are bent through two low-frequency noise fields — Quílez's domain warping, the same technique this project already uses for the warped-fabric lattice — which is what keeps the vortices from reading as perfect compass circles and gives the swirls their organic, hand-drawn edge.

Only the orientation of each stroke ever moves; the grid itself is fixed, so nothing appears or disappears across the whole animation. In motion, the entire field turns by one tick per cycle with a structure-timed shimmer riding on top of that turn, each wave's phase advances at its own small integer rate so the local bending visibly travels, and every vortex centre wanders a tiny closed circle — all of it exactly one-periodic, so the loop closes without a seam. Where the field would otherwise go quiet — the eye of a vortex — the stroke opacity itself is dimmed instead of the angle turning unstable, so the cores read as breathing rather than flickering.

## Parameters

- **cells** — the grid resolution (strokes per short side); a structural axis that reseats every stroke position.
- **vortices** — how many rotating centres seed the field; another structural axis, since adding one reshuffles the whole placement.
- **swirl** — the vortex field's strength, from a bare whisper of rotation to a fully dominant flow.
- **waviness** — the curl-wave amplitude that layers local bending on top of the vortices.
- **warp** — how far the domain-warp noise bends the coordinates before the field reads them; the organic-edge control.
- **strokeLen** — the drawn length of each stroke, as a fraction of the grid spacing.
- **strokeWidth** — line thickness. A rendering choice.
- **opacity** — the base opacity every stroke is scaled against, before the field's own strength dims its quieter regions.
