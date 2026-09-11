---
source: Level sets of a ramp with Gaussian hills and pits, traced by marching squares — Lorensen, W. E. & Cline, H. E. (1987), the 2-D case; the band register follows Riley, B. "Current" (1964); the ramp-plus-centres construction is this project's own
url: https://en.wikipedia.org/wiki/Gaussian_function
doi: 10.1145/37401.37422
construction: original
---

## Formula

    f(p) = count · ⟨p − o, n⟩ / H  +  Σᵢ sᵢ · Aᵢ · exp(−|p − cᵢ|² / 2σᵢ²)

    n   = (−sin angle, cos angle), the stripe normal;  o = the sheet centre
    sᵢ  = +1 for a pull centre, −1 for a push centre;  Aᵢ = pull · count  or  push · count
    σᵢ  = reach · min(W, H), jittered per centre

    band  =  ⌊f⌋ mod 2        (ink where odd)

## What it means

Imagine the sheet as a landscape. With no centres it is a plane tilted so that it rises by exactly one unit per stripe; its contour lines at whole-number heights are evenly spaced parallel lines, and painting every other gap between them gives plain stripes. Each pull centre then adds a smooth hill, a Gaussian bump whose height is the pull strength measured in stripes and whose width is the reach; each push centre digs the same shape as a pit. The bands are still nothing more than the contour lines of this surface at whole-number heights, so everything the picture does follows from how contour lines behave. Far from every centre the plane wins and the stripes run straight. Approaching a hill they bend around it, exactly as the contours of a map bend around a summit, and where the hill is steeper than the plane the contour lines close into rings around the top. A pit does the same with the bending reversed. Two centres near each other make a saddle between them, and the bands there pinch and swap partners, which is where the whorls come from.

The drawing traces every whole-number level set with marching squares and puts all of them into one path filled with the even-odd rule. The regions above each level nest one inside the next, so a point that lies inside m of the loops has height between m and m + 1, and the even-odd rule fills it exactly when m is odd. The alternation is a property of the fill rule, not something the code keeps track of. Lines mode strokes the same loops instead.

In motion the thresholds slide: each frame cuts the surface at heights shifted by twice the phase, so the bands flow across the landscape and around the centres, and because one stripe period is two bands, a full cycle returns the picture to the frame it started from.

## Parameters

- **count** — how many stripes the tilt fits across the height of the sheet. Also sets the unit in which pull and push are measured, so the look holds as the count changes.
- **centres** — the number of hills and pits, placed by seed. They alternate, pull first: one centre is a single hill; two is a hill and a pit.
- **pull** — the height of every hill, as a fraction of the count. Past roughly half the stripes bend into closed rings around the centre.
- **push** — the depth of every pit, in the same unit.
- **reach** — σ, the width of every hill and pit, as a fraction of the shorter sheet edge. Small values make tight local swirls; large values bend the whole field.
- **angle** — the direction of the stripes. 0 is horizontal.
- **render** — bands (the filled parity) or lines (the level sets as hairlines).
- **strokeWidth** — line weight in lines mode. A rendering choice.
