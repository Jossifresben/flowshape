---
source: Rhombille tiling ("tumbling blocks", "reversible cubes"), the Laves tiling [3.6.3.6] dual to the trihexagonal tiling (Grünbaum, B. & Shephard, G.C., 1987, "Tilings and Patterns", tiling P4-42); reversible-cube ambiguity (Necker, L.A., 1832, "Observations on some remarkable optical phænomena seen in Switzerland; and on an optical phænomenon which occurs on viewing a figure of a crystal or geometrical solid", London and Edinburgh Philosophical Magazine 1(5), 329–337)
url: https://en.wikipedia.org/wiki/Rhombille_tiling
---

## Formula

    pointy-top hex lattice, hexagon circumradius S, axial coords (q, r):
      C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
      V_k    = C + S·( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5

    rhombille split — three rhombi, each  C + a·e₁ + b·e₂  with a, b ∈ [0,1]:
      top    e₁ = V₅ − C,  e₂ = V₁ − C        corners C, V₅, V₀, V₁
      right  e₁ = V₁ − C,  e₂ = V₃ − C        corners C, V₁, V₂, V₃
      left   e₁ = V₃ − C,  e₂ = V₅ − C        corners C, V₃, V₄, V₅

    tone triple, ordered ascending in ink (s = faceShading):
      T = [ 1 − 0.75·s,  1 − 0.45·s,  1 ]
      tone(face i) = i        (cube out)
                   = 2 − i    (cube in — the same triple, reversed)

    flip decision per hexagon, ξ a white-noise draw, c = coherence:
      u = (1 − c)·ξ + c·( 0.5 + 0.5·fbm(κ·x, κ·y) ),   κ = 3 / min(w, h)
      flipped ⇔ u < flipChance

    hatch mode — chords b = const, a: 0 → 1, rhombus height |e₂ × ê₁| = (√3/2)·S
      spacing(tone) = max( S / (hatchDensity · T[tone]),  2·strokeWidth )

## What it means

The tiling is the rhombille: take a pointy-top hexagonal lattice and split every hexagon into three congruent 60°/120° rhombi meeting at its centre. Grünbaum and Shephard catalogue it as the Laves tiling [3.6.3.6], the dual of the trihexagonal (kagome) tiling; quilters have called it "tumbling blocks" for two centuries. It is monohedral — one rhombus, repeated — and edge-to-edge: three rhombi meet at each 120° corner, six at each 60° corner, with no gaps and no overlaps anywhere.

The reason it reads as stacked cubes is not a suggestion or an optical trick added on top. Project a unit cube along its (1,1,1) diagonal — the isometric direction — and the union of its three visible faces is *exactly* a regular hexagon, and each of those three square faces lands *exactly* on one of these three rhombi. The edge-vector pairs are the same ones `voxel` uses for its top, left and right faces: {(±√3/2, −1/2), (0, 1)}, scaled by S. So the rhombille is not a tiling that happens to resemble cubes; it is the plane's own tiling by projected cube faces, which is why the illusion is seamless and why every hexagon can be read as a cube with no residue left over.

What the pattern is actually *about* is the ambiguity that comes free with that fact. Shade the three rhombi light, mid, dark and the hexagon reads as a cube pointing out of the page. Reverse the triple — dark, mid, light — and the identical hexagon reads as a cubical hollow pointing into it. Nothing geometric changes: the three rhombi are congruent, the tiling is the same tiling, the outlines are byte-identical. Only the assignment of ink changes, and the perceived depth flips with it. This is a genuine bistable percept in the Necker-cube family, not a rendering difference; the tiling's other common name, "reversible cubes", is the same observation. The code makes this literal by ordering the tone triple ascending in ink — [lightest, mid, darkest] — so that mapping tone index i ↦ 2 − i is exactly the reversal and nothing else. With the tones in any other order a "flip" would just be an arbitrary recolouring; with them ordered, flipping a hexagon is precisely inverting its cube.

`coherence` is therefore not a knob on how many cubes are reversed — that is `flipChance` — but on how the reversals are *arranged*. Each site's flip statistic u is a convex blend of a white-noise draw and a two-octave fBm field sampled at κ = 3/min(w,h), about three noise cells across the short edge of the frame. At coherence 0 neighbouring hexagons are independent and the surface fizzes salt-and-pepper, each cube reversing against its neighbours. At coherence 1 the decision is a smooth function of position, so raised and sunken blocks gather into continent-sized regions that meet along a coastline the eye cannot settle on. One honest caveat: because u is a blend of two random variables, its variance is lowest at intermediate coherence, so u concentrates near 0.5 there and the realised fraction of flipped hexagons drifts toward `flipChance`'s own relation to 0.5 rather than tracking it exactly. The parameter is a correlation control, and it is only approximately independent of the rate.

Unlike `voxel`, which draws overlapping solids and must sort them back-to-front, this pattern has no depth sort at all — no painter's algorithm, no z-key, nothing. The tiling is non-overlapping by construction, so no rhombus can ever occlude another and the paint order is genuinely irrelevant to the output. All the three-dimensionality lives in the tone assignment. That is also what makes the hatch render mode possible in the same geometry: because every rhombus has the same perpendicular height (√3/2)·S across its b axis, lines drawn at b = constant running a: 0 → 1 are exact chords of the rhombus and need no clipping whatsoever, so the whole drawing collapses to four SVG paths — one per tone bucket, plus the hexagon lattice — however many thousands of rhombi are on screen.

## Parameters

- **cell** — S, the hexagon's circumradius, which is also the rhombus edge length. It sets the lattice period; the tiling is similar to itself at every value, so this is scale rather than shape.
- **flipChance** — the threshold on u, i.e. the fraction of hexagons whose tone triple is reversed. It changes the *labelling* of the tiling, not its geometry — but the labelling is the entire subject here, so it is in no way cosmetic.
- **coherence** — blends the flip statistic from white noise toward a smooth fBm field. It controls the spatial correlation of the reversals, not their rate: salt-and-pepper fizz at 0, continents of raised and sunken blocks at 1.
- **voidChance** — the seeded probability that a lattice site is dropped entirely. The one parameter that changes the actual set of tiles drawn rather than relabelling them, which is why different seeds visibly rearrange the holes.
- **render** — tones (three filled rhombi per hexagon, separated by paper-coloured seams) or hatch (three tone buckets of parallel chords plus the hexagon lattice outline, four paths in total). A drawing choice: same tiling, same flip field, different ink.
- **hatchDensity** — how tightly the hatch chords are packed, per tone: spacing is S/(hatchDensity·T[tone]), so darker faces get tighter lines and the density itself carries the shading. A drawing choice, and inert in tones mode.
- **faceShading** — s, the spread of the tone triple, standing in for the strength of a fixed light from above. A drawing choice, but floored at 0.15 rather than 0 on purpose: at 0 the three tones collapse to one, the rhombille goes flat, and the cube — the whole subject — disappears.
- **strokeWidth** — the seam weight in tones mode and the hatch-line weight in hatch mode. A drawing choice, with one non-cosmetic side effect: hatch spacing is floored at 2·strokeWidth, so a heavy stroke at high density thins the hatch out instead of letting a face ink solid.
