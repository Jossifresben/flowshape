import { describe, it, expect, beforeAll } from 'vitest';
import { el, type Palette } from '../../src/core/svg';
import { drawTree, type Ctx2D } from '../../src/anim/canvas-render';

const PAL: Palette = { paper: '#ffffff', ink: '#111111', accent: '#e3261a' };

class StubPath2D { constructor(public d = '') {} }
beforeAll(() => { (globalThis as { Path2D?: unknown }).Path2D = StubPath2D; });

/** Records every method call and property write, in order. */
function recorder(): { ctx: Ctx2D; log: string[] } {
  const log: string[] = [];
  const target: Record<string, unknown> = {};
  const ctx = new Proxy(target, {
    get(_t, prop: string) {
      return (...args: unknown[]) => {
        const a = args.map((x) => (x instanceof StubPath2D ? `d:${x.d}` : String(x))).join(',');
        log.push(`${prop}(${a})`);
      };
    },
    set(_t, prop: string, v: unknown) { log.push(`${prop}=${String(v)}`); return true; },
  }) as unknown as Ctx2D;
  return { ctx, log };
}

describe('drawTree', () => {
  it('fills a role-colored circle with the palette color', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [el('circle', { cx: 5, cy: 6, r: 2, fill: 'ink' })]), PAL);
    expect(log).toContain('arc(5,6,2,0,6.283185307179586)');
    expect(log).toContain('fillStyle=#111111');
    expect(log.some((l) => l.startsWith('fill('))).toBe(true);
    expect(log.some((l) => l.startsWith('stroke('))).toBe(false); // default stroke is none
  });
  it('strokes a path via Path2D and honors stroke-width', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [el('path', { d: 'M0 0L10 10', fill: 'none', stroke: 'accent', 'stroke-width': 0.5 })]), PAL);
    expect(log).toContain('strokeStyle=#e3261a');
    expect(log).toContain('lineWidth=0.5');
    expect(log).toContain('stroke(d:M0 0L10 10)');
    expect(log.some((l) => l.startsWith('fill('))).toBe(false);
  });
  it('inherits group style and multiplies opacity down the tree', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('g', { fill: 'ink', opacity: 0.5 }, [el('rect', { x: 0, y: 0, width: 4, height: 4, opacity: 0.5 })]),
    ]), PAL);
    expect(log).toContain('fillStyle=#111111');
    expect(log).toContain('globalAlpha=0.25');
  });
  it('applies transforms inside save/restore', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('g', { transform: 'translate(300 420) scale(1.2) translate(-300 -420)' }, [
        el('circle', { cx: 1, cy: 1, r: 1, fill: 'ink' }),
      ]),
    ]), PAL);
    const i = (s: string) => log.indexOf(s);
    expect(i('save()')).toBeGreaterThanOrEqual(0);
    expect(i('translate(300,420)')).toBeLessThan(i('scale(1.2,1.2)'));
    expect(i('scale(1.2,1.2)')).toBeLessThan(i('translate(-300,-420)'));
    expect(i('restore()')).toBeGreaterThan(i('arc(1,1,1,0,6.283185307179586)'));
  });
  it('draws line and polyline as stroke-only', () => {
    const { ctx, log } = recorder();
    drawTree(ctx, el('svg', {}, [
      el('line', { x1: 0, y1: 0, x2: 5, y2: 5, stroke: 'ink' }),
      el('polyline', { points: '0,0 2,3 4,0', stroke: 'ink', fill: 'none' }),
    ]), PAL);
    expect(log.filter((l) => l.startsWith('stroke(')).length).toBe(2);
    expect(log).toContain('moveTo(0,0)');
    expect(log).toContain('lineTo(2,3)');
  });
  it('throws on unsupported tags and attributes', () => {
    const { ctx } = recorder();
    expect(() => drawTree(ctx, el('svg', {}, [el('text', { x: 0, y: 0 })]), PAL)).toThrow(/unsupported tag/);
    expect(() => drawTree(ctx, el('svg', {}, [el('circle', { cx: 0, cy: 0, r: 1, filter: 'blur(2)' })]), PAL)).toThrow(/unsupported attribute/);
  });
});
