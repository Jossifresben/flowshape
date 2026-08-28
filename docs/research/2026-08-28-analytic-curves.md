# Analytic Curves for Generative SVG Posters — Formula Catalog

> Research agent output, 2026-08-28. Formulas verified against Wikipedia (superformula), paulbourke.net (Chladni, harmonograph), MathWorld. Conventions: angles in radians unless noted; sample as points, emit as SVG `<path>`; all deterministic given parameters.

## 1. Superformula (Gielis)

```
r(θ) = ( |cos(m·θ/4)/a|^n2 + |sin(m·θ/4)/b|^n3 )^(-1/n1)
x = r·cos(θ),  y = r·sin(θ),   θ ∈ [0, 2π]  (use [0, 2π·q] for rational m = p/q)
```

Guard: skip point if bracketed sum is 0; clamp `|n1| ≥ 0.05`.

- `m` ∈ 0–24 (integer for closed single-turn shapes): rotational symmetry / lobe count. m=0 circle; m=5,6,7 starfish/flowers; large m gears.
- `n1` ∈ 0.1–20: overall inflation. n1 < 1 pinches into stars/crosses; n1 > 5 bloats toward circle.
- `n2, n3` ∈ 0.1–20: asymmetric pinching; n2 ≠ n3 breaks mirror symmetry.
- `a, b`: fix at 1.

Classic sets (m,n1,n2,n3): (3, 4.5, 10, 10) rounded triangle; (5, 1, 1, 1) star; (7, 2, 8, 4) asymmetric flower; (16, 0.5, 0.5, 16) gear.

**Visual:** the universal "natural shape" generator. Nested stacks of 30 copies with interpolated n-values make a striking centerpiece.

**SVG:** closed path (`Z`). N = 720–2000 (cusps need N ≥ 1500). Normalize by max r per frame. Sliders: m (int), n1/n2/n3 (log-scale), layer count, n-interpolation amount.

## 2. Rose / Rhodonea

```
r(θ) = A·cos(k·θ),  k = n/d reduced fraction
θ ∈ [0, π·d] if n·d odd;  [0, 2π·d] if n·d even
```

n, d small integers 1–12. Integer k: k odd → k petals, k even → 2k petals. Rational k gives interleaved multi-petal roses (7/3, 5/4). Irrational k → dense disk (θ ∈ [0, 60π]).

**SVG:** closed path when exact period used. N ≈ 360 per π. Offset rose `r += r0` opens center hole. Sliders: n, d, r0, stroke width.

## 3. Maurer Rose

```
for k = 0 … 360:
  θ = k · d · π/180        // d in degrees, the walk step
  r = sin(n · θ)
  point_k = (r cosθ, r sinθ)
connect consecutive points with straight lines
```

`n` ∈ 1–8, `d` ∈ 1–359 (best near-but-not-at simple fractions of 360). Famous pairs: (2, 39), (3, 47), (6, 71), (4, 31).

**Visual:** string-art web inscribed in a rose envelope — highest wow-per-parameter. **SVG:** one polyline of 361 points; stroke 0.3–0.8; optionally overlay smooth rose envelope. Sliders: n, d (the money slider), envelope toggle.

## 4. Lissajous

```
x(t) = A·sin(a·t + δ),  y(t) = B·sin(b·t),  t ∈ [0, 2π]
```

a, b small integers 1–12; δ ∈ [0, π] morphs continuously. Grid-of-figures "Lissajous table" poster: a = column, b = row.

**SVG:** closed path for integer a,b; N = 500–1500. Sliders: a, b, δ (scrubber), grid mode.

## 5. Harmonograph (damped Lissajous)

```
x(t) = A1·sin(f1·t + p1)·e^(−d1·t) + A2·sin(f2·t + p2)·e^(−d2·t)
y(t) = A3·sin(f3·t + p3)·e^(−d3·t) + A4·sin(f4·t + p4)·e^(−d4·t)
t ∈ [0, T],  T ≈ 100–300
```

fi ≈ small integers with tiny detune (f = 2 + 0.004 — the detune creates precession); di ∈ 0.001–0.02; pi ∈ [0, 2π].

**Visual:** Victorian pendulum drawings; arguably the best "one curve = one poster" formula. **SVG:** one polyline, N = 10 000–40 000, stroke-opacity 0.15–0.4, round coords to 2 decimals. Sliders: frequency ratio presets (1:2, 2:3, 3:4), detune (key slider), damping, phases, duration.

## 6. Epitrochoids / Hypotrochoids (Spirograph)

```
Hypotrochoid: x = (R−r)·cos t + h·cos(((R−r)/r)·t);  y = (R−r)·sin t − h·sin(((R−r)/r)·t)
Epitrochoid:  x = (R+r)·cos t − h·cos(((R+r)/r)·t);  y = (R+r)·sin t − h·sin(((R+r)/r)·t)
t ∈ [0, 2π·r/gcd(R,r)]
```

Integer R ∈ 3–20, r ∈ 1–19 (coprime = most petals), h: <r rounded lobes, =r cusps, >r loops. Special cases: astroid R/r=4, deltoid 3, cardioid R=r, nephroid R=2r.

**SVG:** closed path; N = 200/revolution; compute closure with gcd. Sliders: R, r, h/r, layers.

## 7. Fourier Epicycles ("mystery curves", Frank Farris)

```
x(t) = Σ_{k=1..K} A_k·cos(ω_k·t + φ_k);  y(t) = Σ A_k·sin(ω_k·t + φ_k),  t ∈ [0, 2π]
```

m-fold rotational symmetry when all ω_k ≡ same value mod m. E.g. ω = (1, 6, −14) → 5-fold. Choose ω_k from {1−m, 1, 1+m, 1+2m…}, amplitudes ~1/k, seeded phases.

**Visual:** looping band ornaments with exact m-fold symmetry. Enforce the mod-m rule in code — that's what makes every random draw beautiful. Sliders: m, K, amplitude decay, seed.

## 8. Spirals

```
Archimedean:  r = a + b·θ
Logarithmic:  r = a·e^(b·θ)   (golden: b = ln(φ)/(π/2) ≈ 0.3063)
Fermat:       r = ±a·√θ       (two arms, equal-area rings)
Vogel/phyllotaxis: r_k = c·√k, θ_k = k·137.50776°, k = 1…M
```

turns 3–50; log b ∈ 0.05–0.4; Vogel M ∈ 200–3000 — perturbing the angle ±0.05° dramatically rearranges the arms. Multi-arm: θ → θ + 2π·j/arms. Wobble carrier: r ·= (1 + ε·sin(mθ)).

## 9. Cardioid Times-Tables (modular multiplication on a circle)

```
N points on circle: P_k = (cos 2πk/N, sin 2πk/N)
for each k: chord P_k → P_(k·M mod N)
```

N ∈ 100–600; M ≥ 2, real-valued works (continuous morph). M=2 cardioid envelope, 3 nephroid, 4 three-cusped epicycloid; M near N/2 exotic webs.

**Visual:** chord webs whose envelope is an epicycloid; luminous on dark backgrounds at opacity 0.1–0.3. Sliders: M (continuous 2–100, THE slider), N, opacity, hue mapping.

## 10. Chladni Plate Nodal Patterns

```
f(x, y) = cos(nπx/L)·cos(mπy/L) − cos(mπx/L)·cos(nπy/L)
nodal lines: f = 0
general: f = A·cos(nπx)cos(mπy) + B·cos(mπx)cos(nπy), A,B ∈ [−1,1]
```

Integers m ≠ n ∈ 1–12; (A,B) morphs continuously between mode shapes.

**SVG:** implicit curve — marching squares over 200–400² grid for f = 0 contours; or stipple ("sand"): keep seeded random points with |f| < ε. Sliders: m, n, A/B morph, contour count, resolution.

## 11. Butterfly Curve (Temple Fay)

```
r(θ) = e^(sin θ) − 2·cos(4θ) + sin^5((2θ − π)/24),  θ ∈ [0, 24π]
```

Generalize: 4θ → kθ (lobes), exponent 5 → odd p, divisor 24 → q (period 2πq). **SVG:** open path, N ≈ 6000, low-opacity multi-pass.

## 12. Clothoid / Euler Spiral

```
x(t) = ∫₀ᵗ cos(s²/2) ds;  y(t) = ∫₀ᵗ sin(s²/2) ds,  t ∈ [−T, T], T ≈ 5–8
```

```js
let x = 0, y = 0, pts = [[0,0]]; const dt = 0.005;
for (let t = 0; t < T; t += dt) { x += Math.cos(t*t/2)*dt; y += Math.sin(t*t/2)*dt; pts.push([x,y]); }
// mirror through origin for negative branch
```

Generalized polynomial spiral: cos(t^k/k), k = 2–6. Chained clothoids (flip curvature sign every L arc-length) = calligraphic meanders. Sliders: T, k, rotated copies, flip period.

## 13. Superellipse (Lamé)

```
x(t) = a·sign(cos t)·|cos t|^(2/n);  y(t) = b·sign(sin t)·|sin t|^(2/n),  t ∈ [0, 2π]
```

n ∈ 0.2–8: 2 ellipse, 2.5 Piet Hein squircle, →∞ rectangle, 1 diamond, 2/3 astroid. Ideal as `<clipPath>` and for n-gradient grids. N = 360 (1440 for n < 0.6).

## 14. Additional Candidates

**Guilloché rings:** `r(θ) = R0 + A·sin(kθ + B·sin(jθ))`, k rational p/q, θ ∈ [0, 2πq]. Layer 20–60 rings with drifting R0, A, φ → banknote lathework.

**Lemniscate of Bernoulli (parametric, no domain gaps):** `x = a·cos t/(1+sin²t), y = a·sin t·cos t/(1+sin²t)`.

**Involute of circle:** `x = a(cos t + t·sin t), y = a(sin t − t·cos t)`.

**Exact polar k-gon (polygonizer for any polar curve):** `r(θ) = cos(π/k)/cos((θ mod 2π/k) − π/k)`; blend with circle by lerp.

**Phase-modulated circle ("wobble mandala"):** `r(θ) = R·(1 + a1·sin(k1θ+φ1) + a2·sin(k2θ+φ2))` — cheap, always closed; stack 50 with drifting φ.

## Cross-Cutting Guidance

- Sampling: N = 1000 default; 10k+ for harmonograph/butterfly; marching squares only for Chladni. Round coords to 2 decimals.
- Closure: append `Z` only at the exact period (lcm/gcd for rational ratios).
- Normalization: compute points first, then fit bbox to frame.
- Determinism: seeded PRNG (mulberry32) for any randomness; expose seed.
- Universal sliders: sample count, stroke width/opacity, layer count + drift, n-fold rotation copies, seed.
- Highest impact per slider: harmonograph detune, Maurer d, times-table M, superformula (m, n1), Chladni (m, n) + A/B morph, Vogel divergence angle.
