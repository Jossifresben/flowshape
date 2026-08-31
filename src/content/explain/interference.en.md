---
source: Two-source wave interference — the phase-difference argument that fixes the fringes to the hyperbola family with foci at the sources is classical wave physics, the same construction behind the double-slit pattern and a ripple tank's two-point-source figure; cf. Wikipedia, "Wave interference"; the horizontal-line displacement rendering and its composition are this project's own construction
url: https://en.wikipedia.org/wiki/Wave_interference
construction: original
---

## Formula

    Sᵢ = sources on the frame's horizontal centre-line, `separation` apart, symmetric about the vertical axis
    kᵢ = frequency · (1 + detune · i)                    (per-source wavenumber)

    z(x,y) = Σᵢ sin( kᵢ · dist((x,y), Sᵢ) + φᵢ )         (summed field)

    y(x) = row_y + z(x, row_y) · amplitude               (each polyline vertex, displaced vertically)

## What it means

Two point sources, each radiating an expanding circular wave: at equal wavenumber, a single source's wave crests sit on a family of concentric circles. Where two such waves overlap, the SUM is what an eye or an ear actually receives, and the sum is largest wherever the path-length difference from the two sources — `dist to S₁` minus `dist to S₂` — is a whole multiple of the wavelength, and smallest wherever it lands on a half-multiple. The set of points sharing a fixed path-length difference from two fixed foci is, by the textbook definition, a hyperbola — so the bright and dark fringes of a two-source field sit exactly on the hyperbola family with foci at the two sources. That is forced by the geometry of the distance field itself, not a choice made in the code.

This pattern draws that field indirectly: instead of shading the plane, a bed of horizontal lines is bent vertically by the field's value at each point, so a fringe reads as a place where several neighbouring lines bunch together (destructive interference pulling them toward each other) or spread apart (constructive interference pushing them apart). At the default register the sources sit far off-canvas and the displacement is large enough that neighbouring lines don't just approach — they cross and stay crossed over a real stretch of the frame, and under a translucent stroke those sustained crossings braid into the luminous, silk-like ribbons that are the whole point of this register; dropping the line count and the amplitude relaxes the same geometry into a calmer, non-crossing sweep instead.

`detune` breaks the equal-wavenumber premise on purpose: with k₂/k₁ ≠ 1, the hyperbolae are no longer static, and the fringes visibly drift as the phase advances. Each source's phase advances by its own small integer number of full turns per animation cycle, which keeps the whole field exactly one-periodic regardless of what `detune` did to that source's wavenumber, so the loop closes without a seam no matter how fast the fringes appear to travel.

## Parameters

- **lines** — the number of horizontal polylines sampled from the field. A structural axis: it resets how densely the field is sampled, not a smooth deformation of the existing lines.
- **sources** — how many point sources contribute to the field (2 or 3).
- **frequency** — the wavenumber k, in radians per pixel of raw distance; sets how many fringes cross the frame.
- **amplitude** — the vertical displacement gain; the pattern's own drama knob, deep enough at the defaults that lines cross and braid.
- **separation** — the distance between adjacent sources; kept far off-canvas by default, which is what keeps the fringes reading as open sweeping curves instead of closed rings around a visible centre.
- **detune** — how much the second (and third) source's wavenumber differs from the first's, as a fraction; nonzero values make the fringe pattern drift rather than stay static.
- **strokeWidth** — line thickness. A rendering choice.
- **opacity** — the base opacity every line is drawn at; low values are what let crossing lines braid into brighter overlaps.
