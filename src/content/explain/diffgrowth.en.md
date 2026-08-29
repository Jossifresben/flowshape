---
source: Webb, J. "2D Differential Growth Experiments" (ongoing since 2018)
url: https://github.com/jasonwebb/2d-differential-growth-experiments
---

## Formula

    closed polyline of nodes n₀ … n_{m-1}
    per iteration, for each node nᵢ (prev = n_{i-1}, next = n_{i+1}):

      attract = k_a · (midpoint(prev, next) − nᵢ)
      repel   = Σ_{j: |nᵢ−nⱼ| < R}  (1 − d/R) · (nᵢ − nⱼ) / d       (d = |nᵢ − nⱼ|, R = repulsion radius)
      nᵢ ← nᵢ + clamp(attract + repel + noise)

    split edge (nᵢ, n_{i+1}) if |nᵢ − n_{i+1}| > dMax   (insert midpoint)
    merge edge (nᵢ, n_{i+1}) if |nᵢ − n_{i+1}| < dMin   (drop nᵢ)

## What it means

Start with a closed loop of points and run two opposing forces on it, every frame, forever. Attraction pulls each point toward the midpoint of its two neighbors — left alone, this force alone would just smooth the loop into a plain circle and shrink it to a point. Repulsion works against that: it pushes each point away from any other point on the loop that has drifted within the repulsion radius R, whether or not that point is an actual neighbor on the curve. That's the crucial detail — repulsion doesn't care about the loop's topology, only physical proximity, so as the curve gets crowded it has to buckle outward to relieve the pressure, since it can no longer simply shrink.

The split-and-merge bookkeeping is what lets that buckling accumulate into growth instead of jamming: whenever two adjacent points get stretched too far apart, a new point is inserted between them, adding perimeter; whenever two adjacent points get pressed too close, one of them is dropped. That keeps point density roughly constant on a curve whose total length keeps increasing — which is exactly the mechanism behind the wrinkling of coral, lettuce-leaf edges, and the folding of the brain's cortex: material added faster than the available space can absorb it, forced to buckle into new folds instead.

The repulsion radius is effectively the pattern's one real shape dial: a small R lets points crowd close before they push back, so folds appear early and stay small and tight; a large R keeps points spread out for longer, producing fewer, broader, more languid lobes before the same crowding pressure kicks in.

## Parameters

- **iterations** — how many simulation steps run before the loop is frozen and drawn. More iterations let more folding accumulate; very early snapshots still look like a smooth loop, while late ones are densely wrinkled.
- **repulsion** — R, the repulsion radius. The pattern's real shape dial: small values produce many small, tight folds; large values produce fewer, broader lobes.
- **rings** — how many earlier snapshots of the loop, taken at evenly spaced points through the simulation, are kept and drawn faintly behind the final shape as growth rings. A visualization choice layered on top of the simulation, not part of the growth rule itself — it shows the same loop's history, it doesn't change its outcome.
- **strokeWidth** — the line thickness of the final loop. A rendering choice; earlier ring snapshots are drawn thinner and more transparent automatically.
