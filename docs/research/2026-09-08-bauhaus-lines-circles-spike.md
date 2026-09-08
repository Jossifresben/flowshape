# Bauhaus lines-and-circles patterns from formulas — spike findings

> Spike, 2026-09-08. Question: can the Bauhaus-poster family of repeating line-and-circle patterns be emulated by a mathematical formula that fits flowshape's `generate(params, seed, size) → SvgNode` contract? Answer: **yes, and one formula covers almost the whole family.** Throwaway prototype: `scratchpad/bauhaus/index.html` (session scratchpad, not in the repo). Nothing here is production code.

## The one idea

Every reference image reduces to the same object:

```
stripe_k(base) = offset curve of a base curve at distance d_k,  k = 0..N-1
base ∈ { line ∥ edge, line at 45°, quarter arc centred on a cell corner, L-bend }
d_k chosen so stripe k meets every cell edge at t_k = (k + ½) / N
```

Offsetting a line is a parallel line; offsetting an arc of radius R is an arc of radius R ± d. Both are exact, so the stripes stay lines and arcs (clean SVG `L` and `A` commands, no sampling). The constraint on `t_k` is what makes the family **tile**: any glyph continues into any neighbour across any edge, in any rotation or reflection. The existing `truchet` pattern is the N = 1 special case of this engine.

Two rendering modes fall out of one parameter: **stroke** draws all N stripes at width `w · (1/N)`; **fill** draws only even k at width exactly `1/N`, so bands touch and read as solid concentric rings (the "bold pipes" look).

## Reference → formula map

| Reference (your images) | Glyph alphabet | Symmetry | Notes |
|---|---|---|---|
| Multi-stripe pipes, knots, woven bands | quarter arcs (2 orientations), H, V, cross | none (per-cell random) | Cross = V stripes, then H stripes over a paper halo of width 1/N: the weave crossing |
| Concentric half / full discs on a grid | one-corner quarter disc | **pmm** on a 2×2 block | Mirroring fuses four quarter discs into a full disc, two into a half disc. Exactly the poster |
| Quarter-disc stripes + solid corner square | quarter disc + solid ¼ square | none, random rotation | Matches the second poster in your second image |
| Chevrons, nested diamonds, crosses | 45° lines (both), L-bend | pmm / p4m | The nested diamonds are not a glyph; they emerge from mirroring diagonal stripes |
| Hatch blocks (H/V line groups of varying size) | H, V | guillotine partition | Random recursive splits on a unit grid; one global pitch across all leaves |
| Dot chains (discs joined by diagonal bars) | disc, disc + capsule to the ↘ neighbour | none | Fill mode only; the N-stripe machinery is irrelevant here |
| Houndstooth | — | — | Not a stripe tile at all: it is a weave drawdown, `cell(i,j) = tieup[threading[i]][treadling[j]]` with 2/2 twill × 4-dark-4-light colour sequence. Reproduced exactly |
| Overlapping concentric rings (tan/black/white) | concentric circles on a staggered lattice | painter's order | Rows drawn top to bottom; each circle clips the ones above. Two fills alternate: bold rings, or a polar grid (rings × spokes) clipped to the disc |
| S-curves and 180° loops of ~10 stripes | quarter arcs, N ≈ 10, stripes spanning the whole cell | none, low grid count (2–4) | The "inner stripes collapse to a tight loop" effect appears by itself: inner offsets of an arc have radius → 0 |

Fidelity judgement from the prototype: pipes, half discs, corner discs, chevrons, dot chain and houndstooth are **convincing at first glance**. Hatch blocks and the ring lattice are **recognisable but need composition rules** (the posters use fewer, larger, deliberately placed blocks; the ring reference has a "tail" band leaving each circle that I did not implement).

## Fit with flowshape's contract

- **Pure, seeded, SVG-native.** Every glyph is a `<path>` of `L`/`A` commands inside a `<g transform>`. A 16×16 grid at N = 10 is ~5 k path commands: not `heavy`.
- **Three colour roles are enough.** The genre is monochrome ink on paper; `accent` gives the occasional red glyph. The Bauhaus-primaries palette in the prototype looks worse than mono, which confirms the product decision.
- **Animation.** `width`, `N` (as a float, rounding inside) and `grid` are continuous; `usesPhase` could rotate the seeded block through the four orientations, or slide the mirror lines. Beat mode: reseed the block.
- **URL state.** Params: `preset` (enum), `group` (enum), `N`, `grid`, `block`, `width`, `mode` (enum). Seven params, all clampable.
- **Overlap with `truchet`.** The stripe engine strictly contains it. Do not touch `truchet` (its URLs are live); add the new pattern alongside it.

## Recommendation

Build **one new pattern** in the `tilings` family, working name `ribbons` (`stripes` reads as the existing `bands`): the stripe-tile engine with presets *pipes / arcs / half discs / corner discs / chevrons / diamonds / hatch / knot / dot chain*, the four symmetry groups, and stroke/fill mode. That single pattern reproduces six of the nine references.

Then, optionally, two small separate patterns rather than modes of `ribbons`, because their parameters do not overlap:

- `drawdown`: the weave formula (threading × tie-up × treadling, colour-and-weave). Houndstooth is one preset; twills, satins and rosepath come free. This is also the genuine mathematics of the Bauhaus weaving workshop (Albers, Stölzl), which the explain-the-math modal can say honestly.
- `scales`: the ring lattice in painter's order, with the tail band added.

Skip: the hatch-block guillotine as its own pattern (it fits as the `hatch` preset of `ribbons` with a merge rule), and anything not built from lines and circles.

Not built, deliberately: Homage-to-the-Square nesting, Stölzl stripe blocks from Thue–Morse words, Albers' Structural Constellations. All three reduce to formulas too, but none is "lines and circles" and none tiles in the sense you meant.

## Open decisions for you

1. Add `ribbons` to the curated shape list (currently 19 by your 2026-08-28 decision), or replace `truchet` with it behind a URL alias?
2. Weave and ring lattice as separate patterns, or leave them out?
3. Preset as an enum param (URL-stable, explainable) versus exposing the glyph alphabet as individual booleans (more combinatorial, harder to explain).

## Part 2 — animating the stripe tiles with music (2026-09-08, later the same day)

Prototype: `scratchpad/bauhaus/animate.html` (canvas renderer, sources: built-in demo beat, microphone, audio file). Three ideas built and verified; the rest are notes.

### The structural fact everything hangs on

A stripe tile's glyphs are base curves connecting two cell sides. Chasing side → neighbour side across the grid traces every **band chain** deterministically: open chains from border to border, plus closed loops. At grid 8 with the pipes alphabet, 34 chains (5 loops). This tracer is what no other flowshape pattern has, and it belongs inside the pattern module.

Per chain, a stripe is defined by its **port position** on the entry edge and propagated step by step: lines keep the position, arcs map it through `r = p` or `1 − p` depending on which end of the side the arc's corner sits. This is what makes the lateral shift (idea 3) consistent across every edge. Verified numerically: 339 steps, every arc exactly a quarter turn, zero port mismatches. Closed loops whose round trip maps `p → 1 − p` are Möbius loops; a global shift cannot be consistent on them, so they are frozen (1 of 34 at seed 7).

### Built

1. **Pulses through the pipes.** Bass onset spawns a pulse on a left-border chain, high onset on a top-border chain; each travels at a fixed speed in cells per second with a fading tail, drawn as partial arcs and segments on every stripe of the band. Reads exactly as intended: drum hits become traffic through the knot. Engine impact: needs one new event kind ("spawn on onset", carrying band and border) and the chain tracer; pulse state is a list of (chain, distance) that the pattern advances per frame from phase, so generate stays pure if the pulse list is derived from onset history.
2. **Stripes as a spectrum.** Stripe width `w_k = w · (1 − 0.7d + 1.3d · band_k)` with inner → high, middle → mid, outer → bass. Positions never move so the tiling holds. Works with N = 3 best; for larger N bands are assigned by thirds. Engine impact: three continuous routes onto three width params, or one `tilt` param.
3. **Rings radiating.** Every stripe slides laterally by a shared phase φ, `λ_k = ((k + ½)/N + φ) mod 1`, with dφ/dt = base + gain · bass. On the discs preset this is ripples from each centre; on pipes it reads as the band rolling. Engine impact: `usesPhase` plus one route on speed. Needs the Möbius freeze.

### Noted, not built

4. Symmetry as song structure (level → block size; step event on group every 16 beats). 5. Mutation rate on flux instead of whole-canvas reseed, choosing cells along the live pulse's chain. 6. Width envelope on level (thin engraving ↔ solid bands). 7. Over/under swap on the cross glyph per beat. 8. Quarter-turn of the seeded block every 4 beats.

### Recommendation

Ship 1–3 as the pattern's own anim presets. 1 is the flagship and the only one that needs an engine change (the spawn event). 2 and 3 fit routes and phase as they exist. 4 and 6 come free from existing route and event kinds.
