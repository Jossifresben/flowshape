---
source: Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4)
url: https://en.wikipedia.org/wiki/Phyllotaxis
doi: 10.1016/0025-5564(79)90080-4
---

## Formula

    θₙ = n · α                  (α ≈ 137.50776°, the golden angle)
    rₙ = s · n^p                (p = 0.5 in Vogel's original model)
    s  = R / (N − 1)^p          (R = maximum radius available in the frame)

## What it means

Every point n is placed at angle n·α and radius rₙ = s·n^p. Because α is the golden angle — the turn that splits a full circle in the golden ratio — no finite number of points ever lands back on the same ray. That single fact is the whole trick: it is what keeps a sunflower head, or this pattern, filling in without ever leaving a visible seam or a repeating spoke.

The radius rule spaces the points so packing density stays roughly even as n grows: with p = 0.5 (Vogel's own choice), the area available at radius r grows linearly with r, which exactly cancels the ∝r² growth of a plain circle, so points never bunch up in the centre or thin out at the rim. Nudge p away from 0.5 and the eye reads it immediately — points crowd near the middle at low p, or thin out and hug the boundary at high p.

The angle is the unstable part. At exactly 137.50776° the spiral looks disordered up close but reveals interleaved spiral families — the parastichies — when you step back; Vogel's own paper calls out that even a tenth of a degree off and those families visibly wind into rational spokes instead. This pattern lets you dial the angle by hand for exactly that reason: it turns a textbook footnote into something you can watch happen.

## Parameters

- **points** — N, the total point count. More points fill the frame more densely and make the parastichy spirals read more clearly at a distance.
- **angle** — the divergence angle α between consecutive points. Defaults to the golden angle (≈137.50776°); moving it even slightly away from that value visibly winds the pattern into straight spoke lines — the instability the formula predicts.
- **radialExp** — p, the radial growth exponent. 0.5 is Vogel's uniform-density model; lower values pull points toward the centre, higher values push them toward the rim.
- **dotMin** — the radius of the very first dot (n = 0), in user units.
- **dotGrow** — how much each dot's radius grows per step of n; dots drawn late in the sequence (large n, near the rim) end up larger than dots drawn early — a rendering choice layered on top of Vogel's geometry, not part of the original model.
- **accentEvery** — highlights every k-th point in the accent colour instead of ink. The default, 89, is a Fibonacci number: the visible spiral-arm counts in a phyllotactic pattern are always consecutive Fibonacci numbers, so stepping through Fibonacci values here traces out a different family of arms each time. 0 disables the accent.
