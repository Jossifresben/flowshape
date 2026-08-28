/**
 * OKLCH -> sRGB hex conversion, using Björn Ottosson's canonical OKLab
 * matrices (https://bottosson.github.io/posts/oklab/).
 *
 * Pipeline: OKLCH -> OKLab -> LMS' (cubed) -> LMS -> linear sRGB -> gamma
 * sRGB -> clamp -> hex.
 *
 * Gamut handling: out-of-gamut linear sRGB values are simply clamped to
 * [0,1] per channel after gamma encoding. This is not a perceptually
 * accurate gamut mapping (it can shift hue/chroma at the edges) but it is
 * simple, fast, and good enough for a generative decorative palette where
 * we already keep chroma within a conservative [0, 0.22] range.
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

/**
 * Converts an OKLCH colour to a `#rrggbb` hex string.
 * @param L lightness, roughly [0, 1]
 * @param C chroma, roughly [0, 0.4]
 * @param H hue, degrees
 */
export function oklchToHex(L: number, C: number, H: number): string {
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
  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const r = gammaEncode(rLin);
  const g = gammaEncode(gLin);
  const bl = gammaEncode(bLin);

  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(bl)}`;
}
