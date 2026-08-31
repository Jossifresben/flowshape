import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns, generateSafe, defaultParams, type ParamDef } from '../../src/patterns/registry';
import { serialize, type Palette } from '../../src/core/svg';
import { RESERVED } from '../../src/core/reserved';

const patterns = listPatterns();
const FRAME = { w: 600, h: 840 };

describe('pattern registry as a whole', () => {
  it('registers all 32 patterns at phase 1', () => {
    expect(patterns).toHaveLength(32);
    for (const p of patterns) expect(p.phase).toBe(1);
  });

  it('every enum param has exactly one option per legal index', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        if (pd.kind !== 'enum') continue;
        expect(pd.options, `${p.id}.${pd.key} needs options`).toBeDefined();
        expect(pd.options!.length, `${p.id}.${pd.key} options vs range`).toBe(pd.max - pd.min + 1);
      }
    }
  });

  it('no param step is finer than the URL encoding precision', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        expect(pd.step, `${p.id}.${pd.key} step below 1e-4`).toBeGreaterThanOrEqual(1e-4);
      }
    }
  });

  it('param keys are unique per pattern and never reserved', () => {
    for (const p of patterns) {
      const keys = p.params.map((pd) => pd.key);
      expect(new Set(keys).size, `${p.id} has duplicate param keys`).toBe(keys.length);
      for (const k of keys) expect(RESERVED.has(k), `${p.id}.${k} is reserved`).toBe(false);
    }
  });

  it('defaults are within their own declared range', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        expect(pd.default, `${p.id}.${pd.key} default below min`).toBeGreaterThanOrEqual(pd.min);
        expect(pd.default, `${p.id}.${pd.key} default above max`).toBeLessThanOrEqual(pd.max);
      }
    }
  });

  it('every pattern has a universal size param', () => {
    for (const p of patterns) {
      const sizeParam = p.params.find((pd) => pd.key === 'size');
      expect(sizeParam, `${p.id} missing size param`).toBeDefined();
      expect(sizeParam!.kind).toBe('float');
      expect(sizeParam!.default).toBe(1);
    }
  });

  it('generateSafe wraps children in a scaling <g> only when size !== 1', () => {
    for (const p of patterns) {
      const scaled = generateSafe(p, { size: 0.5 }, 1, FRAME);
      expect(scaled.children, `${p.id} scaled root should have paper rect + wrapper`).toHaveLength(2);
      const wrapper = scaled.children[1]!;
      expect(wrapper.tag, `${p.id} scaled root's second child should be a <g>`).toBe('g');
      expect(String(wrapper.attrs['transform']), `${p.id} <g> transform should scale(0.5)`).toContain(
        'scale(0.5)',
      );

      const unscaled = generateSafe(p, { size: 1 }, 1, FRAME);
      const hasGWrapper = unscaled.children[1]?.tag === 'g';
      expect(hasGWrapper, `${p.id} size:1 should return the ungrouped tree`).toBe(false);
    }
    // 50 full generations (25 patterns × 2 sizes), several of them the heavy
    // ones. It fits in vitest's 5 s default on an idle machine and does not
    // when the worker pool is contended — a timeout here has never meant a
    // real failure. Nothing about what is asserted changes.
  }, 30_000);

  it('generateSafe prepends an unscaled full-frame paper rect', () => {
    for (const p of patterns) {
      const unscaled = generateSafe(p, {}, 1, FRAME);
      const paperRect = unscaled.children[0]!;
      expect(paperRect.tag, `${p.id} first child should be the paper rect`).toBe('rect');
      expect(paperRect.attrs['fill'], `${p.id} paper rect fill`).toBe('paper');
      expect(paperRect.attrs['x'], `${p.id} paper rect x`).toBe(0);
      expect(paperRect.attrs['y'], `${p.id} paper rect y`).toBe(0);
      expect(paperRect.attrs['width'], `${p.id} paper rect width`).toBe(FRAME.w);
      expect(paperRect.attrs['height'], `${p.id} paper rect height`).toBe(FRAME.h);

      const scaled = generateSafe(p, { size: 0.5 }, 1, FRAME);
      const scaledPaperRect = scaled.children[0]!;
      expect(scaledPaperRect.tag, `${p.id} scaled: first child should still be the paper rect`).toBe(
        'rect',
      );
      expect(scaledPaperRect.attrs['fill'], `${p.id} scaled paper rect fill`).toBe('paper');
      expect(scaledPaperRect.attrs['width'], `${p.id} scaled paper rect stays unscaled (full frame width)`).toBe(
        FRAME.w,
      );
      expect(scaledPaperRect.attrs['height'], `${p.id} scaled paper rect stays unscaled (full frame height)`).toBe(
        FRAME.h,
      );

      const g = scaled.children[1]!;
      expect(g.tag, `${p.id} artwork should be inside the <g>`).toBe('g');
    }
    // Same 50-generation cost as the test above; same reason for the budget.
  }, 30_000);
});


const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };

/** Every value a gate can take; three probe points for anything continuous. */
function probeValues(pd: ParamDef): number[] {
  if (pd.kind === 'bool' || pd.kind === 'enum') {
    return Array.from({ length: pd.max - pd.min + 1 }, (_, i) => pd.min + i);
  }
  return [pd.min, pd.default, pd.max];
}

/**
 * `dependsOn` is a claim the playground acts on — it dims the control and
 * tells the visitor the param belongs to another mode. An annotation that
 * drifts away from its generator turns that into a lie the UI tells, so the
 * claim is measured here rather than trusted.
 *
 * This is the check that would have answered the Part 4 audit's question
 * about interlace's `coreRatio` directly: it renders the param across its
 * range and compares the *whole serialized SVG*, not element counts or path
 * data. `coreRatio` only ever moves a `stroke-width`, which is exactly the
 * kind of effect a geometry-only diff reports as "no effect at all".
 */
describe('dependsOn annotations match the generators', () => {
  it('names a real enum/bool gate of the same pattern', () => {
    for (const p of patterns) {
      for (const pd of p.params) {
        if (!pd.dependsOn) continue;
        const gate = p.params.find((g) => g.key === pd.dependsOn!.key);
        expect(gate, `${p.id}.${pd.key} gates on unknown param '${pd.dependsOn.key}'`).toBeDefined();
        expect(['enum', 'bool'], `${p.id}.${pd.key} gate is not switchable`).toContain(gate!.kind);
        const all = probeValues(gate!);
        expect(pd.dependsOn.values.length, `${p.id}.${pd.key} lists no gate values`).toBeGreaterThan(0);
        expect(
          pd.dependsOn.values.length,
          `${p.id}.${pd.key} lists every gate value, so it depends on nothing`,
        ).toBeLessThan(all.length);
        for (const v of pd.dependsOn.values) {
          expect(all, `${p.id}.${pd.key} gate value ${v} out of range`).toContain(v);
        }
      }
    }
  });

  it('has no effect under any excluded gate value, and a real effect under an included one', () => {
    for (const p of patterns) {
      const base = defaultParams(p);
      const draw = (params: Record<string, number>): string =>
        serialize(generateSafe(p, params, 7, FRAME), PAL);
      for (const pd of p.params) {
        const dep = pd.dependsOn;
        if (!dep) continue;
        const gate = p.params.find((g) => g.key === dep.key)!;
        const sweep = (gv: number): string[] =>
          probeValues(pd).map((v) => draw({ ...base, [dep.key]: gv, [pd.key]: v }));

        for (const gv of probeValues(gate)) {
          if (dep.values.includes(gv)) continue;
          const outs = sweep(gv);
          for (const out of outs) {
            expect(
              out,
              `${p.id}.${pd.key} still changes the drawing at ${dep.key}=${gv}, ` +
                'which the playground dims as inert',
            ).toBe(outs[0]);
          }
        }

        // The mirror: an annotation that excluded everything real would pass
        // the loop above vacuously. At least one allowed value must show it
        // actually doing something.
        const live = dep.values.some((gv) => {
          const outs = sweep(gv);
          return outs.some((o) => o !== outs[0]);
        });
        expect(
          live,
          `${p.id}.${pd.key} has no effect at any of its own dependsOn values ` +
            `(${dep.key}=${dep.values.join(',')}) — it is dead, not gated`,
        ).toBe(true);
      }
    }
  }, 60_000);
});
