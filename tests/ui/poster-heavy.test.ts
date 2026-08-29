import { describe, it, expect } from 'vitest';
import { composerModel } from '../../src/ui/poster';
import { decodeState } from '../../src/core/url-state';
import { getPattern, generateSafe } from '../../src/patterns/registry';
import { renderPoster, artworkSize } from '../../src/compose/render';
import { sheet } from '../../src/compose/units';
import { SKELETONS } from '../../src/compose/skeletons';
import { variantsFor } from '../../src/compose/variants';
import { colorwaysFor } from '../../src/compose/colorways';
import { posterData } from '../../src/compose/data';
import { approxMeasure } from '../../src/compose/measure';
import '../../src/patterns';

/**
 * The composer offers only layouts whose title fits, and used to decide that by
 * generating REAL artwork for every candidate variant. `diffgrowth` is `heavy`
 * — a full simulation per call — so building the model ran 68 simulations and
 * took ~73 s of synchronous main-thread work. The page never painted, which
 * Jossi reported as "Poster for Differential growth does not work, empty page".
 */
describe('composer with a heavy pattern', () => {
  it('builds the model without running the pattern once per variant', () => {
    const st = decodeState('#/c/diffgrowth?v=1&seed=1')!;
    const t0 = Date.now();
    const model = composerModel(st);
    const elapsed = Date.now() - t0;
    expect(model).not.toBeNull();
    expect(model!.variants.length).toBeGreaterThan(0);
    // Was ~73000ms. A 5s ceiling still leaves a 15x margin over the fix while
    // failing loudly if per-variant generation ever comes back.
    expect(elapsed).toBeLessThan(5000);
  });

  it('the empty-artwork probe selects exactly the variants real artwork does', () => {
    // The optimisation is only safe because renderPoster's !ok verdicts are
    // about title fitting and never about artwork content. Verified on a light
    // pattern so the real-artwork arm is affordable.
    const st = decodeState('#/c/phyllotaxis?v=1&seed=1')!;
    const def = getPattern(st.patternId)!;
    const sh = sheet(st);
    const data = posterData(def, st);
    const cw = colorwaysFor(st.color)[0]!;
    const withReal = variantsFor(SKELETONS, sh.ratio).filter((v) => renderPoster({
      sheet: sh, skeleton: v.skeleton, colorway: cw, data,
      artwork: generateSafe(def, st.params, st.seed, artworkSize(sh, v.skeleton)),
      measure: approxMeasure(), hideText: false,
    }).ok).map((v) => v.id);

    expect(composerModel(st)!.variants.map((v) => v.id)).toEqual(withReal);
  });
});
