---
source: Müller-Brockmann, J. (1955) Tonhalle concert poster ("Beethoven") — concentric-arc design lineage; the band-thickness power law is this project's own parameterisation
url: https://commons.wikimedia.org/wiki/File:Josef_M%C3%BCller-Brockmann._beethoven_poster(1955).jpg
---

## Formula

    thicknessᵢ = minT + (maxT − minT) · (i / (N−1))^growth      for i = 0 … N−1
    r₀ᵢ = Σ_{k<i} (thicknessₖ + gap)                              (inner radius of band i)
    r₁ᵢ = r₀ᵢ + thicknessᵢ                                        (outer radius of band i)
    band i = filled annular sector, radii [r₀ᵢ, r₁ᵢ], angles [a₀, a₀+sweep]

## What it means

This pattern is a direct homage to Josef Müller-Brockmann's 1955 Tonhalle poster for a Beethoven concert — one of the defining images of Swiss graphic design: nothing but a handful of bold black arcs radiating from a shared center, drawn to suggest the intensity of the music with no illustration at all. The construction here is stripped to its geometric essentials: each band is a filled annular sector — a ring segment, like a slice cut from a very fat donut — with zero stroke, so the picture reads purely as opposed flat shapes rather than outlined circles. That flat-fill approach is deliberate: everything else in this pattern set draws with strokes; this is the one built entirely from solid ink shapes.

The thickness formula is what gives the bands their rhythm. Each band's width is interpolated between a minimum and maximum thickness by a power curve, not a straight line — the exponent decides how that growth is distributed across the N bands. An exponent near 1 gives a roughly linear ramp, band to band; well below 1 front-loads the growth, so early bands widen quickly and later ones barely change; well above 1 does the opposite, keeping inner bands thin and dumping most of the growth into the outermost few — visually close to Müller-Brockmann's own technique of doubling each arc's width outward from the center.

The angular sweep is independent of the thickness progression: bands can wrap a full 360° into a target-like ring, or span a narrower wedge, as in the original poster's fan of arcs suggesting a single gesture rather than a closed circle.

## Parameters

- **bandCount** — N, the number of concentric bands. The number of terms in the thickness progression; more bands means finer-grained control over how the width ramps from minThickness to maxThickness.
- **minThickness** / **maxThickness** — minT, maxT: the thickness of the first and last band, the two endpoints the power-law progression interpolates between.
- **growthExponent** — the exponent in the (i / (N−1))^growth progression. Controls whether the thickness ramp front-loads (exponent < 1), grows linearly (≈1), or back-loads (exponent > 1) across the bands.
- **gap** — the empty radial space left between consecutive bands. Enters directly into the running-radius bookkeeping, so it changes the pattern's total extent, not just its appearance.
- **startAngle** / **sweepAngle** — a₀ and the angular span each band's sector covers. Together they decide whether the bands form a full ring (360° sweep) or a partial fan, as in Müller-Brockmann's original composition.
- **accentEvery** — a rendering choice: every k-th band is filled with the accent color instead of ink. Purely a color decision layered on top of the geometry — the band radii and thicknesses are unaffected.
