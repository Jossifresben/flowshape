---
source: Bourke, P. "Harmonograph"; underlying physics traces to Lissajous, J.A. (1857)
url: https://paulbourke.net/geometry/harmonograph/
---

## Formula

    x(t) = A1·sin(f1·t + p1)·e^(−d1·t) + A2·sin(f2·t + p2)·e^(−d2·t)
    y(t) = A3·sin(f3·t + p3)·e^(−d3·t) + A4·sin(f4·t + p4)·e^(−d4·t)
    t ∈ [0, T]

## What it means

A real harmonograph is a pendulum device: two or more pendulums, each swinging at its own frequency, jointly steer a pen over paper. Each pendulum contributes one damped sine term — damped because friction bleeds energy out of a swinging pendulum, so its amplitude shrinks over time as e^(−d·t) instead of oscillating forever. This pattern sums two such terms per axis, one pair driving x and one driving y, so the pen traces whatever curve the four pendulums agree on together.

If the two frequencies feeding an axis were locked to an exact small-integer ratio and undamped, you'd get a plain closed Lissajous figure — a fixed figure-eight or knot that repeats forever. Two things break that stillness here. Damping shrinks the whole curve inward over time, so instead of retracing a fixed loop, the pen spirals gradually toward the center as the pendulums run out of energy — that decay is what gives a harmonograph drawing its characteristic layered, tapering look. And detune — a small offset added to one frequency so it's no longer an exact integer ratio with its partner — keeps the figure from ever closing on itself; instead the whole pattern slowly precesses, rotating and reshaping itself over the drawing's duration, which is what fills in the dense, richly interleaved look of a real harmonograph trace rather than a single clean lissajous loop.

## Parameters

- **ratio** — the base frequency ratio between the two pendulum pairs (2:3, 3:4, 1:2, or 3:5). This sets the family of figure the undamped, undetuned curve would trace — the "skeleton" the rest of the parameters distort.
- **detune** — a small offset added to one of the paired frequencies, breaking the exact ratio. This is what stops the figure from closing into a fixed loop and instead makes it precess slowly over time, filling the canvas with interleaved passes.
- **damping** — how fast each pendulum's amplitude decays, e^(−d·t). Low damping traces a large, long-lived figure; high damping collapses the curve toward the center quickly.
- **duration** — T, how long (in the same time units as the frequencies) the simulated pendulums are allowed to swing before sampling stops.
- **strokeWidth** — line width of the traced curve. A rendering choice.
- **opacity** — opacity of the traced line. Since the curve overlaps itself thousands of times as it spirals inward, low opacity is what makes the denser, more-retraced regions of the drawing read as visibly darker — a rendering choice, not part of the physics.
