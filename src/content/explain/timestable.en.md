---
source: Plouffe, S. (pattern); Polster, B. and Geracitano, G., "Times Tables, Mandelbrot and the Heart of Mathematics" (Mathologer, 2019)
url: https://www.youtube.com/watch?v=qhbuKbxJsk8
---

## Formula

    N points on a circle: P_k = (cos 2πk/N, sin 2πk/N),   k = 0 … N−1
    for each k: draw a chord from P_k to P_(k·M mod N)

## What it means

Place N points evenly around a circle and number them 0 through N−1, like a clock face. Then, for every point k, draw a straight chord to the point sitting M times as far around the circle — that position, wrapped around with a modulus, is just k·M mod N. What you're looking at is literally the times table for M, drawn as geometry instead of listed as numbers: point 7 connects to wherever "7×M" lands once you wrap past N.

For small integer M, the chords aren't random — their outer envelope traces a specific named curve. M=2 produces a cardioid, M=3 a nephroid, M=4 a three-cusped shape (a deltoid); these are the same curves that show up as the caustic patterns light makes in a coffee cup or as slices through the Mandelbrot set, which is why this simple construction has an outsized reputation. As M grows toward N/2, the chords stop clustering into a clean envelope and instead weave a dense, star-like web across the whole disk.

Because each point's position is a smooth function of k rather than an array lookup, M doesn't have to be a whole number — the code evaluates k·M mod N as a continuous angle even when M carries a fractional part. That means this pattern can morph smoothly through every value between the named curves instead of jumping discretely from one to the next.

## Parameters

- **chords** — N, the number of points spaced around the circle (also the modulus in k·M mod N). More points give finer angular resolution and more chords.
- **multiplier** — M, the times-table multiplier. This is the parameter that matters most: small integers (2, 3, 4…) produce the classic cardioid/nephroid/deltoid envelopes, and because M is allowed to be fractional here, it morphs continuously between them rather than switching abruptly.
- **strokeWidth** — line width of each chord. A rendering choice.
- **opacity** — opacity of each chord. With hundreds of overlapping chords drawn, low opacity is what turns regions crossed by many chords into visibly darker curves — the envelope becomes visible purely through overlap density, a rendering effect layered on top of the geometry.
- **showCircle** — whether to draw a faint reference circle through the N points. Purely decorative.
