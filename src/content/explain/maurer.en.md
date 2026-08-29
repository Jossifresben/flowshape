---
source: Maurer, P.M. (1987) "A Rose is a Rose...", The American Mathematical Monthly 94(7), 631–645
url: https://en.wikipedia.org/wiki/Maurer_rose
---

## Formula

    for k = 0 … 360:
      θ = k · d · (π/180)        (d in degrees, the walk step)
      r = R · sin(n · θ)
      point_k = (R·cosθ, R·sinθ) scaled by r
    connect consecutive points with straight lines

## What it means

Underneath everything is an ordinary rose curve, r = sin(nθ): for integer n it traces n petals if n is odd, or 2n petals if n is even, as θ sweeps around. Maurer's trick, published as a one-page curiosity in 1987, is to never draw that curve directly. Instead he samples it at 361 values of θ spaced d degrees apart — not 1 degree apart — and joins those samples with straight chords rather than following the curve between them.

Because 360 and d are almost always chosen to share no simple common factor (the module's default pair, n=6, d=71, is one of Maurer's own examples), each jump of d degrees lands the underlying angle somewhere far from where the last chord ended. The chords fan out across the whole interior of the rose instead of hugging its outline, and after all 360 steps every point on the rose has been visited exactly once, so the web closes on itself. The result reads as string art — the same over-under weave you get stretching thread between pins on a board — even though every point in it sits exactly on the mathematical rose curve.

The optional envelope path is that same rose curve sampled densely (every 0.25°) instead of via the d-degree walk, drawn faintly underneath the chord web so you can see the smooth petal shape the chords are approximating.

## Parameters

- **n** — the petal count of the underlying rose, r = sin(nθ). Odd n gives n petals; even n gives 2n petals.
- **d** — the walk step in degrees between the 361 sampled points. This is the parameter that matters most: small d traces something close to the smooth rose outline, while d values near (but not exactly at) simple fractions of 360° produce the densest, most tangled chord webs.
- **strokeWidth** — line thickness of the chord web. A rendering choice, not part of Maurer's construction.
- **envelope** — whether to draw the smooth rose curve itself, faintly, beneath the chord web, so the underlying shape the chords approximate is visible. Also a rendering choice — toggling it changes nothing about the chord geometry.
