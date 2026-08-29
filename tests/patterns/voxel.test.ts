import { describe, it, expect } from 'vitest';
import { voxel } from '../../src/patterns/voxel';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(voxel, { maxElements: 20000 });

describe('voxel specifics', () => {
  it('emits only polygons (besides the universal paper background rect)', () => {
    const svg = render(voxel, defaultParams(voxel), 1);
    const els = svg.match(/<(circle|path|line|rect|polygon)[^>]*>/g) ?? [];
    const body = els.filter((tag) => !tag.startsWith('<rect'));
    expect(body.length).toBeGreaterThan(0);
    for (const tag of body) expect(tag.startsWith('<polygon')).toBe(true);
  });

  it('shellOnly emits strictly fewer elements than a full solid, for a cube', () => {
    const base = { ...defaultParams(voxel), shape: 1, dimension: 8 };
    const shellSvg = render(voxel, { ...base, shellOnly: 1 }, 1);
    const solidSvg = render(voxel, { ...base, shellOnly: 0 }, 1);
    const countPolys = (svg: string): number => (svg.match(/<polygon/g) ?? []).length;
    expect(countPolys(shellSvg)).toBeLessThan(countPolys(solidSvg));
  });

  it('sphere and cube differ', () => {
    const a = render(voxel, { ...defaultParams(voxel), shape: 0 }, 1);
    const b = render(voxel, { ...defaultParams(voxel), shape: 1 }, 1);
    expect(a).not.toBe(b);
  });
});
