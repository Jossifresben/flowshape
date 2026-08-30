---
source: Seaton, K.A. (2023) "Mathematical specification of hitomezashi designs", Journal of Mathematics and the Arts 17(1-2)
url: https://arxiv.org/abs/2208.12580
doi: 10.1080/17513472.2023.2187999
---

## Formula

    cᵢ, rⱼ ∈ {0, 1}                    for each column i, each row j (seeded coin)

    vertical dash at column i, row j    iff (j + cᵢ) mod 2 = 0
    horizontal dash at row j, column i  iff (i + rⱼ) mod 2 = 0

    region parity: fill(i, j) = prefixXor(c, i) ⊕ prefixXor(r, j)

## What it means

Hitomezashi ("one stitch") is a running-stitch sashiko technique: a needle enters and exits along a grid, and each row or column of stitches is offset by whether it starts on an odd or even square. The mathematics behind it is almost embarrassingly simple — flip one coin per column and one coin per row, then place a dash wherever a row-index-plus-column-bit parity check comes out even. That single rule, applied independently to every column for the vertical dashes and every row for the horizontal ones, is the entire generator. No dash placement ever looks at its neighbors; the pattern's long walls, zigzags, and enclosed loops all emerge purely from how the fixed per-line bits interact as you scan across the grid.

The parity trick in the second line does something else: it two-colors the regions the stitching encloses, without ever tracing a boundary or flood-filling anything. Running a cumulative XOR of the column bits up to i, and separately of the row bits up to j, and XORing those two prefix sums together, tells you instantly which "side" any given cell falls on — the same kind of propagate-the-parity idea used to two-color a Truchet arc tiling, applied here to a grid of running stitches instead of curved tiles.

Because every column and row is decided by one independent coin toss, the bit-probability parameter is the only real dial on the pattern's character: a fair coin (0.5) produces an even mix of long walls and short zigzags, while biasing it toward 0 or 1 stretches dashes into long unbroken runs in one direction.

## Parameters

- **cell** — the grid pitch, in user units: the spacing between stitch lines. Smaller cells pack more rows and columns into the frame, producing finer stitching.
- **bitChance** — the probability that a given column or row bit is 1, instead of a fair 50/50 coin. Pushing it away from 0.5 biases the construction itself, stretching dashes into longer runs and fewer direction changes.
- **strokeWidth** — the thickness of the stitch lines. A rendering choice with no effect on the underlying bit pattern.
- **fillParity** — toggles a translucent accent fill over the two-colored regions the parity formula identifies. It visualizes real math (the prefix-XOR region coloring), but switching it off doesn't change the stitch pattern itself — only whether that hidden structure is drawn.
