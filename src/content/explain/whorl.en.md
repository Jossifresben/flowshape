---
source: Sherlock, B. G. & Monro, D. M. (1993) "A model for interpreting fingerprint topology", Pattern Recognition 26(7); ridge classes after Galton, F. (1892) Finger Prints; streamline separation after Jobard, B. & Lefer, W. (1997)
url: https://en.wikipedia.org/wiki/Fingerprint#Classifying_fingerprints
doi: 10.1016/0031-3203(93)90006-I
---

## Formula

    θ(z) = θ₀ + ½ · [ Σᵢ arg(z − cᵢ) − Σⱼ arg(z − dⱼ) ]      (z = x + iy)

    cᵢ  the cores,  dⱼ  the deltas,  θ₀ = lean
    ridge  =  streamline of the direction (cos θ, sin θ), traced both ways

## What it means

A fingerprint is not a field of arrows. A ridge has no front or back, so the direction of the pattern at any point is an angle taken modulo a half turn, and that one fact decides everything about how prints look. Sherlock and Monro noticed that the orientation of a whole print is captured by a single formula on the complex plane: add up half the angle to every core, subtract half the angle to every delta, and take the streamlines. A core is the centre of a loop — the place a ridge turns back on itself. A delta is the triradius, the point where three ridge systems meet in a Y. In the formula a core is a zero and a delta is a pole, and the ½ in front is what gives each of them the strange half-index that no electric or magnetic field can have: walk once around a core and the ridge direction has turned only half way round, which is exactly why ridges loop instead of radiating out like field lines from a charge.

Galton's four classes fall out of the two counts alone. No cores and no deltas is an arch: ridges run across the finger in gentle waves. One of each is a loop. Two cores placed close together with two deltas below is the plain whorl, the pattern that gives this page its name; pull the cores apart and it opens into a double loop. Real prints add a ridge period of about half a millimetre, roughly ten ridges per centimetre, which is the scale the default spacing imitates.

The drawing traces ridges as streamlines from a grid of seed points, in both directions since the field has no preferred sense, and keeps them apart with a coarse occupancy grid — the same cell-claiming rule the flow field and Coulomb patterns use, a grid-based version of Jobard and Lefer's evenly spaced streamlines. Ridges stop short of every singularity, which leaves the small blank eye at the centre of each loop that a real print has too.

## Parameters

- **cores** — the number of loop centres (zeros of the field). 0 with 0 deltas is an arch; 1 with 1 delta is a loop; 2 with 2 deltas is the plain whorl.
- **deltas** — the number of triradii (poles). They sit below the cores, fanned across the lower half of the sheet.
- **separation** — how far apart the cores sit, as a fraction of the frame. Small values fuse them into a tight whorl; large values open a double loop. The core pair also orbits its centre once per animation cycle.
- **lean** — θ₀, a constant added to every orientation. On an arch it tilts the whole field; with cores present it turns the pattern. When there is no core pair to orbit, the animation advances lean by a half turn per cycle instead.
- **spacing** — the pitch of the seed grid, and half of it the cell size that keeps ridges apart. Smaller values give a denser, finer print.
- **steps** — the maximum length of a ridge, in integration steps of two units, split between its two directions.
- **strokeWidth** — ridge weight. A rendering choice.
- **accentEvery** — every k-th ridge drawn, in the order they were placed, in the accent colour and heavier. 0 disables it. Purely decorative.
