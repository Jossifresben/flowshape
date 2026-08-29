import { describe, it, expect, beforeAll } from 'vitest';
import '../../src/patterns/index';
import { listPatterns, defaultParams, generateSafe } from '../../src/patterns/registry';
import { drawTree, type Ctx2D } from '../../src/anim/canvas-render';
import type { Palette } from '../../src/core/svg';

const PAL: Palette = { paper: '#ffffff', ink: '#000000', accent: '#e3261a' };
const SIZE = { w: 1066.67, h: 600 }; // the 16:9 stage in user units

class StubPath2D { constructor(public d = '') {} }
beforeAll(() => { (globalThis as { Path2D?: unknown }).Path2D = StubPath2D; });

/** Accepts everything silently — the audit only cares whether drawTree throws. */
function nullCtx(): Ctx2D {
  return new Proxy({}, {
    get: () => () => undefined,
    set: () => true,
  }) as unknown as Ctx2D;
}

describe('every pattern renders through the canvas adapter', () => {
  for (const def of listPatterns()) {
    it(`${def.id} at defaults and at every enum/bool variant`, { timeout: 60_000 }, () => {
      const base = defaultParams(def);
      const variants: Record<string, number>[] = [base];
      for (const p of def.params) {
        if (p.kind === 'enum' || p.kind === 'bool') {
          for (let v = p.min; v <= p.max; v++) variants.push({ ...base, [p.key]: v });
        }
      }
      for (const params of variants) {
        expect(() => drawTree(nullCtx(), generateSafe(def, params, 3, SIZE), PAL)).not.toThrow();
      }
    });
  }
});
