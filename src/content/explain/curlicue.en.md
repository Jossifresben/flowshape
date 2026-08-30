---
source: Berry, M. V. and Goldberg, J., "Renormalisation of curlicues" (Nonlinearity 1, 1988)
url: https://mathworld.wolfram.com/CurlicueFractal.html
---

## Formula

    Heading:  θₙ = θₙ₋₁ + 2π·α·n   (so θₙ ≈ π·α·n², a quadratic phase)
    Walk:     Pₙ₊₁ = Pₙ + (cos θₙ, sin θₙ),  unit steps, n = 1 … N

## What it means

Walk in a straight line, but at every step turn a little more than you turned last time — the extra turn growing by the same fixed amount 2πα each step. That single rule, iterated ten thousand times, is the whole pattern. The walk is the polygonal graph of the theta sum Σ e^{πiαn²}, an object physicists meet in optics (it is Fresnel diffraction's discrete cousin — locally the walk keeps tracing Euler spirals) and number theorists meet in Gauss sums.

Everything you see is decided by the arithmetic personality of the one number α. If α is rational the headings eventually repeat and the walk closes into a periodic crystal. If α is irrational it never repeats, and *how* it fails to repeat — the continued-fraction expansion of α — becomes visible geometry: √2−1 chains identical curls like seahorses, the golden ratio (the "most irrational" number, all 1s in its continued fraction) lays the most uniform lace, and π−3, whose expansion starts with the enormous term 292, marches in long straight avenues before deigning to curl. Berry and Goldberg showed the structure is self-similar under renormalisation: zoom out and the curls of curls obey the same rule with a transformed α — the Gauss map, the same engine that drives continued fractions.

It is the quadratic cousin of the times-table chords: there, multiplication mod N painted its structure on a circle; here, quadratic residues mod 1 paint theirs on an open path.

## Parameters

**Alpha** is the number itself, the turning rate: smaller values sweep grand, slow spirals; larger ones wind tight little eyes; land near a rational (0.02 = 1/50, 0.025 = 1/40) and the walk crystallizes into repeating figures. **Curls** is the walk's budget of visible structure — the step count adapts as curls/α, so the spiral hierarchy stays legible at every setting instead of collapsing into fuzz. The figure is refit to the frame whatever shape the walk takes.
