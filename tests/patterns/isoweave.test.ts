import { describe, it, expect } from 'vitest';
import { isoweave, unitAt, clampArm, type Box } from '../../src/patterns/isoweave';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(isoweave, { maxElements: 12000 });

/** Every drawn element tag, sorted — i.e. the render with paint order stripped. */
function sortedTags(svg: string): string[] {
  return (svg.match(/<(polygon|path|line|rect)[^>]*>/g) ?? []).slice().sort();
}

describe('isoweave specifics', () => {
  it('the three render modes produce different output', () => {
    const base = defaultParams(isoweave);
    const solid = render(isoweave, { ...base, render: 0 }, 1);
    const outline = render(isoweave, { ...base, render: 1 }, 1);
    const hatch = render(isoweave, { ...base, render: 2 }, 1);
    expect(solid).not.toBe(outline);
    expect(outline).not.toBe(hatch);
    expect(solid).not.toBe(hatch);
    // hatch is outline plus one hatch path per face.
    expect((hatch.match(/<path/g) ?? []).length).toBeGreaterThan(0);
    expect((outline.match(/<path/g) ?? []).length).toBe(0);
  });

  it('outline mode emits only paper-filled polygons', () => {
    const svg = render(isoweave, { ...defaultParams(isoweave), render: 1 }, 1);
    const els = svg.match(/<(circle|path|line|rect|polygon)[^>]*>/g) ?? [];
    // The universal background rect is prepended by generateSafe.
    const body = els.filter((tag) => !tag.startsWith('<rect'));
    expect(body.length).toBeGreaterThan(0);
    for (const tag of body) {
      expect(tag.startsWith('<polygon')).toBe(true);
      expect(tag).toContain('fill="#ffffff"');
      expect(tag).toContain('stroke="#000000"');
    }
  });

  it('stagger changes occlusion order but not a single projected coordinate', () => {
    // 3 and 4 clamp arms identically, so the *only* difference between them is
    // which unit sits at which depth. (1,1,1) is the unique lattice direction
    // with zero screen displacement, so that must leave the set of drawn faces
    // byte-identical and change only the order they are painted in.
    const base = defaultParams(isoweave);
    expect(clampArm(base['armLength']!, base['beamWidth']!, 3, base['unit']!))
      .toBe(clampArm(base['armLength']!, base['beamWidth']!, 4, base['unit']!));
    const three = render(isoweave, { ...base, stagger: 3 }, 1);
    const four = render(isoweave, { ...base, stagger: 4 }, 1);
    expect(sortedTags(three)).toEqual(sortedTags(four));
    expect(three).not.toBe(four);
  });

  it('the stagger is not decorative: it changes what occludes what', () => {
    // The flat (stagger 1) interlock and the woven one must differ as images,
    // not merely in paint order — this is the check that the depth colouring
    // actually buys something.
    const base = defaultParams(isoweave);
    const flat = render(isoweave, { ...base, stagger: 1 }, 1);
    const woven = render(isoweave, { ...base, stagger: 3 }, 1);
    expect(sortedTags(flat)).not.toEqual(sortedTags(woven));
  });

  it('armLength is clamped so arms can never interpenetrate', () => {
    // At stagger 1 every neighbour shares a depth class, so arms may only
    // reach 1 - beamWidth before crossing one another in 3D.
    const base = { ...defaultParams(isoweave), stagger: 1, beamWidth: 0.36 };
    const atClamp = render(isoweave, { ...base, armLength: 0.64 }, 1);
    expect(render(isoweave, { ...base, armLength: 1.0 }, 1)).toBe(atClamp);
    expect(render(isoweave, { ...base, armLength: 1.6 }, 1)).toBe(atClamp);
    // …while anything below the clamp is still live.
    expect(render(isoweave, { ...base, armLength: 0.5 }, 1)).not.toBe(atClamp);
  });

  /**
   * Two lattice-aligned boxes project onto overlapping screen areas exactly
   * when the view line R·(1,1,1) crosses the interior of their Minkowski
   * difference; the returned interval is that crossing in ray parameter, so
   * lo > 0 means b2 is genuinely in front, hi < 0 means b1 is, and an interval
   * straddling 0 means the two solids interpenetrate.
   */
  function viewOverlap(b1: Box, b2: Box): [number, number] {
    let lo = -Infinity;
    let hi = Infinity;
    for (let c = 0; c < 3; c++) {
      lo = Math.max(lo, b2.min[c]! - (b1.min[c]! + b1.size[c]!));
      hi = Math.min(hi, (b2.min[c]! + b2.size[c]!) - b1.min[c]!);
    }
    return [lo, hi];
  }

  it('never interpenetrates, and centre-depth sorting never inverts an occlusion', () => {
    const EPS = 1e-9;
    const problems: string[] = [];
    for (let unit = 0; unit <= 2; unit++) {
      for (let stagger = 1; stagger <= 4; stagger++) {
        for (const beamWidth of [0.15, 0.36, 0.7]) {
          for (const armLength of [0.5, 1.0, 1.6]) {
            const len = clampArm(armLength, beamWidth, stagger, unit);
            const boxes: Box[] = [];
            for (let b = -4; b <= 4; b++) {
              for (let a = -4; a <= 4; a++) {
                if (((a + b) & 1) !== 0) continue;
                boxes.push(...unitAt(unit, a, b, stagger, beamWidth, len));
              }
            }
            const tag = `unit=${unit} stagger=${stagger} w=${beamWidth} L=${armLength}`;
            for (let x = 0; x < boxes.length; x++) {
              for (let y = x + 1; y < boxes.length; y++) {
                const b1 = boxes[x]!;
                const b2 = boxes[y]!;
                const [lo, hi] = viewOverlap(b1, b2);
                if (hi - lo <= EPS) continue; // projections meet at most on a boundary
                if (lo < -EPS && hi > EPS) { problems.push(`interpenetration ${tag}`); continue; }
                const front = lo >= -EPS ? b2 : b1;
                const back = lo >= -EPS ? b1 : b2;
                if (front.depth <= back.depth + EPS) problems.push(`painter inversion ${tag}`);
              }
            }
          }
        }
      }
    }
    expect(problems.slice(0, 5)).toEqual([]);
  });
});
