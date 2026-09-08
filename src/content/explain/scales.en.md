---
source: Seigaiha (青海波), the Japanese blue-wave tiling of overlapping concentric arcs, documented on Nara-period textiles; here rebuilt as a two-fill lattice in painter's order
url: https://en.wikipedia.org/wiki/Seigaiha
---

## Formula

    lattice:  x = −R + col · 2R·overlap  (+ R·overlap on odd rows)
              y = −R + row · R·rowStep
    draw rows top to bottom, discs left to right; each disc covers what is under it

    per disc, by seed:
      bold  ink disc, n paper rings at r_j = R · ((j + ½)/n + phase) mod 1
      fine  accent disc, 2n paper rings and S spokes at angles 2πs/S

## What it means

Overlapping discs drawn in order is one of the oldest tricks in pattern making. Each disc hides whatever was drawn before it, so with a row pitch smaller than the radius only the top crown of each earlier disc survives, and a flat lattice of circles reads as fish scales or as the stacked waves of the seigaiha textiles. Nothing is computed about the overlap; the order of drawing is the whole construction.

The two fills come from the Bauhaus textile studies that set bold rings against a fine grid on the same lattice. A bold disc is ink with a few wide paper rings; a fine disc is the accent colour with a dense polar grid of thin rings and spokes. Neither needs clipping: every ring is inside its disc by construction and every spoke stops at the rim, so the disc itself is the clip.

With phase, the ring radii advance outward and wrap, so each disc pulses as ripples from its own centre while the lattice holds still.

## Parameters

- **radius** — disc radius in user units.
- **overlap** — horizontal pitch as a fraction of the diameter; below 1 the discs in a row overlap.
- **rowStep** — row pitch as a fraction of the radius; smaller stacks the rows more tightly.
- **rings** — ring count on a bold disc (the fine disc uses twice as many).
- **boldShare** — the probability that a disc is bold rather than fine.
- **ringWidth** — ring stroke weight as a fraction of the ring pitch.
- **spokes** — spoke count on a fine disc; 0 for rings only.
