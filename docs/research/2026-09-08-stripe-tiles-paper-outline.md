# Stripe tiles — short-paper outline (draft, pending prior-art scan)

> Working title: **Stripe tiles: an N-band generalisation of Truchet tilings with seamless lateral motion.** Target register: Bridges short paper / Journal of Mathematics and the Arts short communication, 6–8 pages. Deposit: Zenodo preprint with its own DOI, citing the software concept DOI 10.5281/zenodo.22180722. Author: Jossi Fresco Benaim (ORCID 0009-0000-2026-0836), with AI assistance disclosed in the acknowledgements. Every number in the paper is computed by code in the repository, never by hand or by the model.

Status after the literature scan (2026-09-08, `2026-09-08-stripe-tiles-prior-art.md`): **A already stated** (Reimann 2010/2011, Virolainen 2017/2023, Wendt 2023; implicit in Carlson 2018, Mitchell 2020) — becomes the setting, with citations. **B partially** (Glassner 1999 and Kaplan & Cohen 2003 for single strands; the multi-stripe chain as the drawing unit is not found). **C not found.** **D withdrawn**: the scan's referee-style objection (trivial normal bundle of a planar ribbon) was right, and the "Möbius loops" were a tracer bug — see §5. The paper, if written, rests on B and C, and §5 becomes a short remark on why a naive implementation sees an obstruction that does not exist.

Each claim below is phrased as something a referee can check, with the object that checks it.

## 1. Setting

Square cell, unit coordinates. A **base curve** is either a line between opposite sides or a **corner connector** between two adjacent sides — a quarter arc centred on their shared corner, its chord, or the elbow through (r, r). A **glyph** is a set of base curves using each side at most once. A **stripe tile** draws every base curve as N offset curves ("stripes"), stripe k meeting each side of the cell at the fraction

    t_k = (k + ½) / N,   k = 0 … N − 1.

Truchet's arc tiles (Smith 1987) are the case N = 1 with the quarter-arc glyphs.

## 2. Claim A — the crossing invariant is a sufficient tiling condition

**Statement.** If every glyph in an alphabet meets every cell side at the same N positions {t_k}, then any assignment of glyphs to cells, under any of the eight symmetries of the square per cell, produces a drawing in which every stripe continues across every interior edge with C⁰ continuity, and no stripe ends in the interior.

**Why it holds.** The set {t_k} is invariant under the reflection t ↦ 1 − t (it is symmetric about ½), so each side's crossing set is the same for the cell and its neighbour whatever their orientations; a stripe leaving a cell at position t on a shared edge meets a stripe entering the neighbour at the same t.

**Check.** `src/patterns/bauhaus.ts` traces chains across edges by side adjacency only; a test renders every motif under every group and asserts the emitted geometry has no free ends (to be added: an explicit free-end count). Figure 1: one alphabet under free placement, pmm, p4m, p4.

## 3. Claim B — band-chain decomposition

**Statement.** Following side → neighbour's facing side partitions the set of base curves of a tiling into disjoint **band chains**, each an open path from border to border or a closed loop, and every stripe of the drawing lies on exactly one chain.

**Check.** The tracer in `bauhaus.ts` visits each base curve once; the count "34 chains, 5 loops" for a given seed is reproducible from the URL. Figure 2: one chain highlighted through a knot.

## 4. Claim C — lateral flow with no seam

**Statement.** Define a stripe on a chain by its position λ on the chain's entry side and propagate it through each base curve by the map p ↦ f(p), with f = id for a line and f(p) = r or 1 − r, r ∈ {p, 1 − p}, for a corner connector according to which end of each side the corner occupies. Then for any λ ∈ (0, 1) the propagated stripe is continuous across every edge of the chain. Consequently the whole drawing can be shifted laterally by a common φ, λ_k = (t_k + φ) mod 1, with no discontinuity at any edge — the field "rolls".

**Check.** Verified numerically: 339 propagation steps at three λ values, every arc exactly a quarter turn, zero port mismatches (`scripts/` one-off, to be promoted to a test). Also byte-exact loop closure at φ = 1 (tests/anim/phase-adoption.test.ts, tenth wave). Figure 3: frames of the roll.

Two engineering consequences worth one paragraph each, because they are where a naive implementation fails: (i) the wrap at λ → 1 must be hidden by tapering stripe weight to zero at the band edges; (ii) the halo that cuts the under-band at a weave crossing must be fixed to the cell, not to the sliding lanes.

## 5. Remark — there is no Möbius obstruction (claim D withdrawn)

**Statement.** For a closed chain the composition of the maps f around the loop is the identity. A ribbon along a closed curve immersed in the plane has a trivial normal bundle, so a stripe at transverse position p returns to p; every loop admits the lateral shift.

**What the implementation saw, and why it is worth a paragraph.** The first tracer reported loops composing to p ↦ 1 − p and held them still. They were an artefact: glyphs that leave two sides unused (H, V) create chains that end in dead ends rather than at the border; the border pass never finds those; the loop pass met one mid-chain, walked one direction only, and the walk in the other direction later stopped at the first half's start and was labelled closed — a single arc, hence the reversal. Walking both ways from wherever a chain is met, and defining closed as returning to the start segment, removed every such loop.

**Check.** `tests/patterns/bauhaus.test.ts` asserts, across 36 motif × symmetry × seed cases, that every segment lies on exactly one chain, every open chain ends at a border or a dead end, and no closed chain reverses a stripe. The theorem is a test.

## 6. What the paper is not claiming

- No new mathematics: offset curves, edge-matching and parity on loops are all classical. The contribution is the invariant as a design rule, the chain decomposition as the right unit of drawing, and the obstruction as the reason a naive animation fails.
- Not a survey of Truchet generalisations; cite Smith 1987, Lord & Ranganathan 2006, Browne 2008, Carlson's multi-scale tiles, and whatever the scan adds.

## 7. Figures and where they come from

All figures are SVG exports of URL states of the app (the URL is the state, so every figure is reproducible from its caption). Any measured number (chain counts, frozen-loop fractions, the 5.1% → 1.0% frame-to-frame ink change) is produced by a script in `scripts/` committed alongside the paper.

## 8. Decision

A is the setting, cited. The contribution is B (the multi-stripe band chain as the unit of drawing) and C (seam-free lateral flow by propagating entry positions), with §5 as the cautionary remark and §4's two engineering consequences (edge taper, fixed halo). That is a short Bridges-style note, not a JMA paper. Worth writing if Jossi wants the DOI; not worth it as a claim of new mathematics, which it is not.
