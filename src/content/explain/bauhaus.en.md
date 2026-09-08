---
source: Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4); the N-stripe glyph alphabet, the band-chain tracing and the lateral flow are this project's own construction
url: https://en.wikipedia.org/wiki/Truchet_tiles
doi: 10.2307/1578535
construction: original
---

## Formula

    unit cell, N stripes, stripe k crosses every side at t_k = (k + ½) / N

    base curves (any rotation or reflection of):
      line      side ↔ opposite side          p_out = p_in
      arc       corner connector, radius r    r = p_in or 1 − p_in,
      chamfer   the arc's straight chord        by which end of the side
      bend      the elbow through (r, r)         the corner sits on

    band chain: side → neighbour's facing side → … until a border or a loop
    stripe k on a chain: entry position λ_k = (t_k + phase) mod 1,
                         propagated step by step through p_out = f(p_in)

    Möbius loop: a closed chain whose round trip maps p → 1 − p;
                 it cannot slide consistently, so it holds phase 0

    symmetry over a seeded m×m block:
      pmm  mirror across both axes     p4m  pmm plus the diagonal mirror
      p4   quarter turns about the supercell centre

## What it means

The Bauhaus posters, textiles and wallpapers that every "geometric pattern" reference reaches for are, almost without exception, one object: parallel stripes following a path made of straight runs and quarter turns, laid on a square grid. Pipes that turn corners, half discs stacked in columns, chevrons and nested diamonds, blocks of hatching, the woven knot with its over-and-under crossings — each is the same bundle of stripes taking a different route.

What makes them tile is a single rule. Every stripe meets every cell edge at the same fixed heights, the N evenly spaced fractions along the side. A quarter arc centred on a corner with radius t meets both adjacent sides at t; a horizontal line at height t meets both vertical sides at t. So whatever glyph sits in the next cell, its stripes pick up exactly where these leave off, and the glyphs can be rotated, reflected and shuffled freely without ever opening a gap. Truchet's arc tiles are the N = 1 case of this: one stripe, one arc per corner.

The drawing here does not go cell by cell. It follows each bundle, the band chain, from the border where it enters to the border where it leaves, or around its loop, and places every stripe by where it crosses the entry edge. That reversal is what allows the field to move: shift the entry positions and propagate, and every crossing on every edge stays matched. Under mirrors, four quarter discs become a disc and the sliding stripes become rings radiating from its centre. On a knot the band appears to roll. Some closed loops turn out to be Möbius: a stripe that goes around comes back on the other side of the band, so no consistent shift exists, and those loops stay still.

Symmetry is what turns a handful of glyphs into the classic compositions. A seeded block of two by two cells, mirrored across both axes, gives the concentric discs and half discs; add the diagonal mirror and diagonal stripes meet as nested diamonds; rotate the block instead and the field turns about its centres like a kaleidoscope.

## Parameters

- **motif** — the glyph alphabet: pipes (arcs, lines and crossings), arcs only, discs, corner discs with a solid square, chevrons, diamonds, hatch, knot, or a dot chain (discs joined diagonally; not stripe-based).
- **symmetry** — free placement, or the plane group that extends the seeded block: pmm mirrors, p4m mirrors plus the diagonal, p4 rotates.
- **cell** — the grid pitch in user units.
- **repeat** — the seeded block's side in cells. 0 means every cell is its own under free placement, and a 2×2 block under any symmetry.
- **stripes** — N, the number of parallel stripes in every band.
- **render** — strokes (N lines of the chosen weight) or bands (alternate lanes filled solid, so the band reads as concentric rings).
- **width** — stroke weight as a fraction of the lane, in strokes mode.
- **tilt** — a weight gradient across the band: positive fattens the outer stripes, negative the inner ones. A single continuous axis for audio.
- **accentEvery** — draw every n-th band chain in the accent colour; 0 for none.
