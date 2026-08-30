---
source: Farris, F. A., "Creating Symmetry: The Artful Mathematics of Wallpaper Patterns" (Princeton University Press, 2015)
url: https://press.princeton.edu/books/hardcover/9780691161730/creating-symmetry
doi: 10.1515/9781400865673
---

## Formula

    z(t) = Σₕ Aₕ · e^{i(kₕt + φₕ)},   t ∈ [0, 2π]
    with every frequency kₕ ≡ 1 (mod m),  e.g. k ∈ {1, 1+m, 1−m, 1+2m, …}
    Amplitudes decay as Aₕ = 1/(1+|s|)^β where kₕ = 1 + m·s

## What it means

Chain a few circles together — a point riding a circle riding a circle, each spinning at its own integer frequency — and trace the path of the last one. That is a finite Fourier series, the machinery behind epicycle drawings. Most frequency choices give a tangle. Frank Farris noticed the exception, and it is a one-line theorem.

Require every frequency to leave remainder 1 when divided by m. Then advancing t by one m-th of a turn multiplies every term by the same unit factor e^{2πi/m} — so the whole curve maps onto itself rotated by exactly 360/m degrees. Perfect m-fold rotational symmetry, not tuned or approximated but *forced* by a congruence. Farris called the results "mystery curves" because the symmetry seems to come from nowhere: the phases and amplitudes are completely free, so every random choice of them is a different flourish with the same flawless order.

That freedom is the pattern's engine. The seed draws new phases; the falloff exponent decides whether high frequencies whisper (smooth, calligraphic loops) or shout (wild, spiky rosettes); and since rotating each harmonic's phase never touches the frequencies, the curve can morph continuously through its family while the symmetry survives untouched — which is exactly what the animation does.

## Parameters

**Symmetry** is m, the enforced rotational order. **Harmonics** counts the circles in the chain, **falloff** how quickly the higher ones fade. **Bloom** lets each harmonic's amplitude swell and collapse at its own integer rate as the curve moves — loops blossoming on different beats. **Layers** overlays the same curve a little further along its morph, an engraved motion-trail that fans open mid-cycle. The seed rolls new phases — a new flourish, the same theorem.
