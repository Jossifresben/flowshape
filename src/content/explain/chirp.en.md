---
source: Linear (frequency-swept) chirp signal; cf. Wikipedia, "Chirp"
url: https://en.wikipedia.org/wiki/Chirp
construction: original
---

## Formula

    u    = (x − margin) / W                        (u ∈ [0, 1] across the frame)
    φ(u) = 2π · ( freqStart·u + (freqEnd − freqStart)·u² / 2 )
    env(u) = amplitude · (0.06 + 0.94·u²)
    y(u) = row_i + env(u) · sin( φ(u) + i·phaseStep )

## What it means

Each of the lineCount rows is a sine wave, but not one of constant pitch: φ(u) is the phase of a *linear chirp* — a signal whose instantaneous frequency ramps linearly from freqStart to freqEnd as u runs left to right. Differentiating φ(u) with respect to u gives exactly that ramp, `freqStart + (freqEnd − freqStart)·u`; the u² term in the phase is simply what integrating a linearly rising frequency produces. It's the same construction used in radar and audio chirps, laid out horizontally instead of played back in time.

The envelope compounds the effect: env(u) starts at only 6% of amplitude and grows to the full amplitude by u = 1, following u². So each line begins nearly flat and slow on the left — visually calm, almost parallel lines — and by the right edge is oscillating at high frequency with full swing, the two effects reinforcing each other into what reads as a sudden tightening into a woven knot.

phaseStep is what keeps the rows from moving in lockstep: it offsets each successive line's phase by i·phaseStep, so neighbouring rows drift in and out of sync as u increases. Near u = 0 the small phase differences barely matter and the lines look like a calm, ordered stack; by u = 1, with frequency and amplitude both maxed out, that same small phase offset is enough to make adjacent lines cross and interleave — the visual arc from order to woven chaos the pattern is built around.

## Parameters

- **lineCount** — how many parallel chirp rows are drawn, stacked vertically across the frame.
- **freqStart** — the instantaneous frequency at the left edge (u = 0); low values start the sweep nearly flat.
- **freqEnd** — the instantaneous frequency at the right edge (u = 1); the gap between freqStart and freqEnd is what the sweep ramps across.
- **amplitude** — the maximum vertical swing of the sine wave, reached at the right edge; also sets the vertical spacing needed between rows so the sweep never clips.
- **phaseStep** — the phase offset applied to each successive row; the parameter that turns the calm left side into the interleaved, woven right side.
- **strokeWidth** — the line weight of each row; a drawing choice with no effect on the underlying chirp.
