/**
 * OKLCH -> sRGB hex conversion, using Björn Ottosson's canonical OKLab
 * matrices (https://bottosson.github.io/posts/oklab/).
 *
 * Pipeline: OKLCH -> OKLab -> LMS' (cubed) -> LMS -> linear sRGB -> gamma
 * sRGB -> hex.
 *
 * Gamut handling: chroma-reduction gamut mapping. L and H are held fixed —
 * they are what our contrast and distinctness guarantees are expressed
 * in — and C is binary-searched down to the largest value that still
 * lands inside sRGB. This is real gamut mapping, not a per-channel clamp:
 * clamping each of R/G/B independently after the fact distorts hue and
 * lightness simultaneously at the boundary, which is not a subtle effect —
 * it is why saturated colours at extreme lightness used to crush toward
 * black/white almost independent of hue, and why the ink/paper contrast
 * ceiling stalled at a fixed value no matter how `inkL` was reshaped. The
 * one honest consequence of doing this properly: a request for very high
 * chroma at extreme lightness now comes back *less saturated* rather than
 * *wrong*. For a colour system whose whole promise is that L and H mean
 * what they say, that is the correct trade.
 */

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Linear sRGB channel -> gamma-encoded sRGB channel, in [0,1]. */
function gammaEncode(c: number): number {
  const cc = clamp01(c);
  return cc <= 0.0031308 ? 12.92 * cc : 1.055 * Math.pow(cc, 1 / 2.4) - 0.055;
}

function toHexByte(c: number): string {
  const v = Math.round(clamp01(c) * 255);
  return v.toString(16).padStart(2, '0');
}

/** OKLCH -> linear sRGB, before gamma encoding or clamping. */
function oklchToLinearSrgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab -> LMS' (nonlinear)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // LMS' -> LMS (cube)
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS -> linear sRGB
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, bl];
}

const GAMUT_EPS = 1e-6;

/** Whether (L, C, H) lands inside the sRGB cube (in *linear* sRGB), allowing a small epsilon. */
function inGamut(L: number, C: number, H: number): boolean {
  const [r, g, b] = oklchToLinearSrgb(L, C, H);
  return (
    r >= -GAMUT_EPS && r <= 1 + GAMUT_EPS &&
    g >= -GAMUT_EPS && g <= 1 + GAMUT_EPS &&
    b >= -GAMUT_EPS && b <= 1 + GAMUT_EPS
  );
}

/**
 * Converts an OKLCH colour to a `#rrggbb` hex string.
 * @param L lightness, roughly [0, 1]
 * @param C chroma, roughly [0, 0.4]
 * @param H hue, degrees
 */
export function oklchToHex(L: number, C: number, H: number): string {
  let c = C;
  if (!inGamut(L, c, H)) {
    // Chroma-reduction gamut mapping: hold L and H fixed and binary-search
    // the largest in-gamut chroma. (If L itself is out of a sane range —
    // e.g. a caller passes L < 0 or L > 1 — even C=0 may be out of gamut;
    // the search then converges toward c=0 and the final clamp below
    // is the real safety net for that case.)
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(L, mid, H)) lo = mid; else hi = mid;
    }
    c = lo;
  }

  const [rLin, gLin, blLin] = oklchToLinearSrgb(L, c, H);
  const r = gammaEncode(rLin);
  const g = gammaEncode(gLin);
  const bl = gammaEncode(blLin);

  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(bl)}`;
}
